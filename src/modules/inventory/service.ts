import mongoose, { ClientSession } from 'mongoose';
import { Bin, Warehouse } from '../warehouse/model';
import { StockLedgerEntry, StockReservation } from './model';
import { CustomError } from '../../middlewares/errorHandler';
import { Commodity } from '../commodities/model';
import { runInTransaction } from '../../utils/transaction';

export const inventoryService = {
  // Helper to fetch current physical and available stock
  getStockSummary: async (commodityId: string, warehouseId?: string, binId?: string) => {
    const matchQuery: any = { 
      commodityId: new mongoose.Types.ObjectId(commodityId) 
    };
    if (warehouseId) matchQuery.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    if (binId) matchQuery.binId = new mongoose.Types.ObjectId(binId);

    // Sum physical stock from stock ledger entries
    const ledgerResult = await StockLedgerEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$batchNo',
          physicalQty: { $sum: { $subtract: ['$quantityIn', '$quantityOut'] } },
          averageCost: { $avg: '$unitCost' }
        }
      }
    ]);

    // Sum reserved stock
    const reservationResult = await StockReservation.aggregate([
      { $match: { ...matchQuery, status: 'Active' } },
      {
        $group: {
          _id: '$batchNo',
          reservedQty: { $sum: '$reservedQty' }
        }
      }
    ]);

    // Combine results
    const summary = ledgerResult.map(item => {
      const reservation = reservationResult.find(r => r._id === item._id);
      const reserved = reservation ? reservation.reservedQty : 0;
      return {
        batchNo: item._id,
        physicalStock: item.physicalQty,
        reservedStock: reserved,
        availableStock: Math.max(0, item.physicalQty - reserved),
        averageCost: item.averageCost
      };
    });

    return summary;
  },

  // Record Immutable Stock Ledger Entry
  createStockLedgerEntry: async (
    session: ClientSession | undefined,
    data: {
      commodityId: string;
      batchNo: string;
      warehouseId: string;
      binId: string;
      referenceType: any;
      referenceId: string;
      quantityIn: number;
      quantityOut: number;
      unitCost: number;
      createdBy: string;
    }
  ) => {
    // 1. Fetch the physical bin
    const bin = await (session ? Bin.findById(data.binId).session(session) : Bin.findById(data.binId));
    if (!bin) throw new CustomError('Target storage bin not found', 404);

    if (String(bin.allowedCommodityId) !== String(data.commodityId)) {
      throw new CustomError('Commodity type is not authorized for this silo bin storage configuration', 400);
    }

    const netQtyChange = data.quantityIn - data.quantityOut;

    // 2. Validate Bin capacity bounds
    if (bin.occupiedMT + netQtyChange > bin.capacityMT) {
      throw new CustomError(`Bin capacity overflow! Max: ${bin.capacityMT} MT, Current Occupied: ${bin.occupiedMT} MT, Adding: ${netQtyChange} MT`, 400);
    }

    if (bin.occupiedMT + netQtyChange < 0) {
      throw new CustomError(`Bin capacity underflow error. Attempting to pull more stock than exists.`, 400);
    }

    // 3. Update Bin currentStock list array
    const existingIndex = bin.currentStock.findIndex(item => item.batchNo === data.batchNo);
    if (existingIndex > -1) {
      bin.currentStock[existingIndex].quantity += netQtyChange;
      if (bin.currentStock[existingIndex].quantity <= 0) {
        bin.currentStock.splice(existingIndex, 1);
      }
    } else if (netQtyChange > 0) {
      bin.currentStock.push({
        commodityId: new mongoose.Types.ObjectId(data.commodityId),
        batchNo: data.batchNo,
        quantity: netQtyChange
      });
    }

    bin.occupiedMT += netQtyChange;
    bin.availableMT = bin.capacityMT - bin.occupiedMT;
    await (session ? bin.save({ session }) : bin.save());

    // 4. Update parent Warehouse total occupancy
    const warehouse = await (session ? Warehouse.findById(data.warehouseId).session(session) : Warehouse.findById(data.warehouseId));
    if (warehouse) {
      warehouse.usedCapacityMT += netQtyChange;
      await (session ? warehouse.save({ session }) : warehouse.save());
    }

    // 5. Get current running balance for ledger history
    const prevLedgerQuery = StockLedgerEntry.findOne({
      commodityId: data.commodityId,
      binId: data.binId,
      batchNo: data.batchNo
    }).sort({ createdAt: -1 });

    const prevLedger = await (session ? prevLedgerQuery.session(session) : prevLedgerQuery);

    const prevRunning = prevLedger ? prevLedger.runningBalance : 0;
    const runningBalance = prevRunning + netQtyChange;

    // 6. Save ledger entry
    const entry = new StockLedgerEntry({
      commodityId: data.commodityId,
      batchNo: data.batchNo,
      warehouseId: data.warehouseId,
      binId: data.binId,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      quantityIn: data.quantityIn,
      quantityOut: data.quantityOut,
      unitCost: data.unitCost,
      runningBalance,
      createdBy: data.createdBy
    });

    await (session ? entry.save({ session }) : entry.save());
    
    // 7. Sync commodity global stock count
    const comm = await (session ? Commodity.findById(data.commodityId).session(session) : Commodity.findById(data.commodityId));
    if (comm) {
      const aggrQuery = StockLedgerEntry.aggregate([
        { $match: { commodityId: comm._id } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$quantityIn', '$quantityOut'] } } } }
      ]);
      const ledgerAggr = await (session ? aggrQuery.session(session) : aggrQuery);
      
      const newGlobalStock = ledgerAggr[0] ? ledgerAggr[0].total + netQtyChange : netQtyChange;
      comm.purchasePrice = data.unitCost > 0 ? data.unitCost : comm.purchasePrice;
      await (session ? comm.save({ session }) : comm.save());
    }

    return entry;
  },

  // Reserve Stock for Sales Order
  reserveStock: async (
    salesOrderId: string,
    commodityId: string,
    quantity: number,
    warehouseId: string,
    createdBy: string
  ): Promise<void> => {
    await runInTransaction(async (session) => {
      const stocks = await inventoryService.getStockSummary(commodityId, warehouseId);
      let qtyToReserve = quantity;

      const availableBatches = stocks.filter(s => s.availableStock > 0);
      if (availableBatches.reduce((sum, s) => sum + s.availableStock, 0) < quantity) {
        throw new CustomError('Insufficient available stock to confirm order booking', 400);
      }

      for (const batch of availableBatches) {
        if (qtyToReserve <= 0) break;

        const resQty = Math.min(qtyToReserve, batch.availableStock);

        const binQuery = Bin.findOne({
          warehouseId,
          allowedCommodityId: commodityId,
          'currentStock.batchNo': batch.batchNo
        });
        const bin = await (session ? binQuery.session(session) : binQuery);

        if (!bin) continue;

        const reservation = new StockReservation({
          salesOrderId,
          commodityId,
          warehouseId,
          binId: bin._id,
          batchNo: batch.batchNo,
          reservedQty: resQty,
          status: 'Active',
          createdBy
        });
        await (session ? reservation.save({ session }) : reservation.save());

        qtyToReserve -= resQty;
      }
    });
  },

  // Release/Consume Stock Reservation
  releaseStockReservation: async (
    salesOrderId: string,
    status: 'Released' | 'Cancelled',
    session: ClientSession | undefined
  ): Promise<void> => {
    const query = StockReservation.updateMany(
      { salesOrderId: new mongoose.Types.ObjectId(salesOrderId), status: 'Active' },
      { $set: { status } }
    );
    if (session) {
      await query.session(session);
    } else {
      await query;
    }
  },

  // executeStockTransfer (Silo-to-Silo transaction)
  executeStockTransfer: async (
    data: {
      commodityId: string;
      batchNo: string;
      fromWarehouseId: string;
      fromBinId: string;
      toWarehouseId: string;
      toBinId: string;
      quantity: number;
      transferNo: string;
      createdBy: string;
    }
  ): Promise<void> => {
    await runInTransaction(async (session) => {
      const fromBin = await (session ? Bin.findById(data.fromBinId).session(session) : Bin.findById(data.fromBinId));
      if (!fromBin) throw new CustomError('Source bin not found', 404);

      const batchStock = fromBin.currentStock.find(item => item.batchNo === data.batchNo);
      if (!batchStock || batchStock.quantity < data.quantity) {
        throw new CustomError(`Insufficient physical stock in source bin. Available: ${batchStock?.quantity || 0} MT`, 400);
      }

      const prevLedgerQuery = StockLedgerEntry.findOne({
        commodityId: data.commodityId,
        binId: data.fromBinId,
        batchNo: data.batchNo
      }).sort({ createdAt: -1 });
      const prevLedger = await (session ? prevLedgerQuery.session(session) : prevLedgerQuery);
      const unitCost = prevLedger ? prevLedger.unitCost : 0;

      await inventoryService.createStockLedgerEntry(session, {
        commodityId: data.commodityId,
        batchNo: data.batchNo,
        warehouseId: data.fromWarehouseId,
        binId: data.fromBinId,
        referenceType: 'STOCK_TRANSFER',
        referenceId: data.transferNo,
        quantityIn: 0,
        quantityOut: data.quantity,
        unitCost,
        createdBy: data.createdBy
      });

      await inventoryService.createStockLedgerEntry(session, {
        commodityId: data.commodityId,
        batchNo: data.batchNo,
        warehouseId: data.toWarehouseId,
        binId: data.toBinId,
        referenceType: 'STOCK_TRANSFER',
        referenceId: data.transferNo,
        quantityIn: data.quantity,
        quantityOut: 0,
        unitCost,
        createdBy: data.createdBy
      });
    });
  }
};
