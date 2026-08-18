import mongoose from 'mongoose';
import { PurchaseEnquiry, PurchaseQuotation, PurchaseOrder, GRN, QualityInspection } from './model';
import { Supplier } from '../suppliers/model';
import { Farmer } from '../farmers/model';
import { Commodity } from '../commodities/model';
import { Bin } from '../warehouse/model';
import { CustomError } from '../../middlewares/errorHandler';
import { inventoryService } from '../inventory/service';
import { Voucher, LedgerEntry } from '../finance/model';
import { runInTransaction } from '../../utils/transaction';

export const procurementService = {
  // --- ENQUIRIES ---
  createEnquiry: async (data: any, createdBy: string) => {
    const enquiryNo = `PEQ-2026-${String(await PurchaseEnquiry.countDocuments() + 1).padStart(5, '0')}`;
    const pe = new PurchaseEnquiry({
      enquiryNo,
      date: new Date(data.date || Date.now()),
      partyType: data.partyType,
      partyId: new mongoose.Types.ObjectId(data.partyId),
      commodityId: new mongoose.Types.ObjectId(data.commodityId),
      quantity: data.quantity,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      status: 'Sent',
      createdBy
    });
    return await pe.save();
  },

  // --- QUOTATIONS ---
  createQuotation: async (data: any, createdBy: string) => {
    const quotationNo = `PQT-2026-${String(await PurchaseQuotation.countDocuments() + 1).padStart(5, '0')}`;
    
    const qty = data.quantity;
    const baseValue = data.rate * qty;
    const taxes = baseValue * ((data.gstPercent || 5) / 100);
    const transport = data.transportCost || 0;
    const loading = data.loadingCost || 0;
    const unloading = data.unloadingCost || 0;
    const other = data.otherCharges || 0;

    const totalLandedCost = baseValue + transport + loading + unloading + other + taxes;
    const landedCostPerUnit = totalLandedCost / qty;

    const pq = new PurchaseQuotation({
      quotationNo,
      enquiryId: data.enquiryId ? new mongoose.Types.ObjectId(data.enquiryId) : undefined,
      date: new Date(data.date || Date.now()),
      partyType: data.partyType,
      partyId: new mongoose.Types.ObjectId(data.partyId),
      commodityId: new mongoose.Types.ObjectId(data.commodityId),
      quantity: qty,
      rate: data.rate,
      transportCost: transport,
      loadingCost: loading,
      unloadingCost: unloading,
      otherCharges: other,
      gstPercent: data.gstPercent || 5,
      landedCostPerUnit,
      total: totalLandedCost,
      validUntil: new Date(data.validUntil),
      status: 'Sent',
      createdBy
    });

    return await pq.save();
  },

  compareQuotations: async (commodityId: string) => {
    const list = await PurchaseQuotation.find({
      commodityId: new mongoose.Types.ObjectId(commodityId),
      status: 'Sent'
    }).populate('partyId', 'name gstin state phone');

    return list.sort((a, b) => a.landedCostPerUnit - b.landedCostPerUnit);
  },

  // --- PURCHASE ORDER ---
  createPO: async (data: any, createdBy: string) => {
    const poNo = `PO-2026-${String(await PurchaseOrder.countDocuments() + 1).padStart(5, '0')}`;
    
    const po = new PurchaseOrder({
      poNo,
      quotationNo: data.quotationNo,
      date: new Date(data.date || Date.now()),
      partyType: data.partyType,
      partyId: new mongoose.Types.ObjectId(data.partyId),
      commodityId: new mongoose.Types.ObjectId(data.commodityId),
      quantity: data.quantity,
      rate: data.rate,
      transportCost: data.transportCost || 0,
      otherCharges: data.otherCharges || 0,
      gstPercent: data.gstPercent || 5,
      total: data.total,
      warehouseId: new mongoose.Types.ObjectId(data.warehouseId),
      expectedDelivery: new Date(data.expectedDelivery),
      status: data.total >= 1000000 ? 'Pending Approval' : 'Approved',
      createdBy
    });

    if (data.quotationNo) {
      await PurchaseQuotation.updateOne({ quotationNo: data.quotationNo }, { status: 'Converted' });
    }

    return await po.save();
  },

  approvePO: async (poId: string, username: string) => {
    const po = await PurchaseOrder.findById(poId);
    if (!po) throw new CustomError('PO not found', 404);
    po.status = 'Approved';
    return await po.save();
  },

  // --- GRN (Goods Receipt Inward) ---
  createGRN: async (data: any, createdBy: string) => {
    return await runInTransaction(async (session) => {
      const poQuery = PurchaseOrder.findById(data.poId);
      const po = await (session ? poQuery.session(session) : poQuery);
      if (!po) throw new CustomError('PO not found', 404);

      const countQuery = GRN.countDocuments();
      const grnNo = `GRN-2026-${String(await (session ? countQuery.session(session) : countQuery) + 1).padStart(5, '0')}`;
      const batchNo = `BAT-${po.poNo.slice(-5)}-${Date.now().toString().slice(-4)}`;

      const grn = new GRN({
        grnNo,
        poId: po._id,
        partyType: po.partyType,
        partyId: po.partyId,
        vehicleNo: data.vehicleNo.toUpperCase(),
        driverName: data.driverName,
        commodityId: po.commodityId,
        batchNo,
        warehouseId: po.warehouseId,
        orderedQty: po.quantity,
        receivedQty: data.receivedQty,
        acceptedQty: 0,
        rejectedQty: 0,
        qualityStatus: 'Pending',
        inwardStatus: 'Pending',
        status: 'Pending QC',
        createdBy
      });

      await (session ? grn.save({ session }) : grn.save());

      po.status = 'Partially Received';
      await (session ? po.save({ session }) : po.save());

      return grn;
    });
  },

  // --- QUALITY INSPECTION & STOCK INWARD ---
  submitQualityInspection: async (data: any, createdBy: string) => {
    return await runInTransaction(async (session) => {
      const grnQuery = GRN.findById(data.grnId);
      const grn = await (session ? grnQuery.session(session) : grnQuery);
      if (!grn) throw new CustomError('GRN not found', 404);
      if (grn.qualityStatus !== 'Pending') {
        throw new CustomError('QC Audit has already been processed for this GRN', 400);
      }

      const grade = data.grade;
      const status = grade === 'Rejected' ? 'Rejected' : 'Passed';

      const qi = new QualityInspection({
        grnId: grn._id,
        grnNo: grn.grnNo,
        commodityId: grn.commodityId,
        batchNo: grn.batchNo,
        moisturePercent: data.moisturePercent,
        grade,
        damagePercent: data.damagePercent || 0,
        foreignMaterialPercent: data.foreignMaterialPercent || 0,
        color: data.color,
        purityPercent: data.purityPercent || 100,
        qualityScore: data.qualityScore,
        inspector: createdBy,
        status,
        notes: data.notes
      });
      await (session ? qi.save({ session }) : qi.save());

      const acceptedQty = grade === 'Rejected' ? 0 : grn.receivedQty - (data.rejectedQty || 0);
      const rejectedQty = grade === 'Rejected' ? grn.receivedQty : (data.rejectedQty || 0);

      grn.acceptedQty = acceptedQty;
      grn.rejectedQty = rejectedQty;
      grn.qualityStatus = status;
      grn.status = 'Completed';
      await (session ? grn.save({ session }) : grn.save());

      const poQuery = PurchaseOrder.findById(grn.poId);
      const po = await (session ? poQuery.session(session) : poQuery);

      if (status === 'Passed' && acceptedQty > 0) {
        const binQuery = Bin.findOne({
          warehouseId: grn.warehouseId,
          allowedCommodityId: grn.commodityId,
          availableMT: { $gte: acceptedQty }
        });
        const bin = await (session ? binQuery.session(session) : binQuery);

        if (!bin) {
          throw new CustomError('No available storage bins found with sufficient capacity in this warehouse facility', 400);
        }

        await inventoryService.createStockLedgerEntry(session, {
          commodityId: String(grn.commodityId),
          batchNo: grn.batchNo,
          warehouseId: String(grn.warehouseId),
          binId: String(bin._id),
          referenceType: 'QUALITY_ACCEPTANCE',
          referenceId: grn.grnNo,
          quantityIn: acceptedQty,
          quantityOut: 0,
          unitCost: po ? po.rate : 20000,
          createdBy
        });

        grn.inwardStatus = 'Completed';
        await (session ? grn.save({ session }) : grn.save());

        if (po) {
          po.status = 'Fully Received';
          await (session ? po.save({ session }) : po.save());
        }

        const purchaseValue = acceptedQty * (po ? po.rate : 20000);
        const gstTax = purchaseValue * ((po ? po.gstPercent : 5) / 100);
        const totalPayable = purchaseValue + gstTax;

        const voucherNo = `PAY-2026-${Date.now().toString().slice(-4)}`;
        const voucher = new Voucher({
          voucherNumber: voucherNo,
          date: new Date(),
          voucherType: 'Payment',
          partyType: grn.partyType,
          partyId: grn.partyId,
          amount: totalPayable,
          paymentMode: 'Bank Transfer',
          reference: grn.grnNo,
          narration: `Auto-generated payable against GRN ${grn.grnNo} for passing quality inspection.`,
          attachments: [],
          status: 'Approved',
          createdBy
        });
        await (session ? voucher.save({ session }) : voucher.save());

        let vendorAccount = '';
        if (grn.partyType === 'supplier') {
          const supplierQuery = Supplier.findById(grn.partyId);
          const supplier = await (session ? supplierQuery.session(session) : supplierQuery);
          if (supplier) {
            supplier.balance += totalPayable;
            await (session ? supplier.save({ session }) : supplier.save());
            vendorAccount = `${supplier.name} Accounts Payable`;
          }
        } else {
          const farmerQuery = Farmer.findById(grn.partyId);
          const farmer = await (session ? farmerQuery.session(session) : farmerQuery);
          if (farmer) {
            farmer.balance += totalPayable;
            await (session ? farmer.save({ session }) : farmer.save());
            vendorAccount = `${farmer.name} Accounts Payable`;
          }
        }

        const debitInventory = new LedgerEntry({
          voucherId: voucher._id,
          voucherNumber: voucherNo,
          date: new Date(),
          accountName: 'Inventory Raw Goods A/c',
          debitAmount: purchaseValue,
          creditAmount: 0,
          narration: `Inventory inwarded for batch ${grn.batchNo}`
        });
        await (session ? debitInventory.save({ session }) : debitInventory.save());

        const creditPayable = new LedgerEntry({
          voucherId: voucher._id,
          voucherNumber: voucherNo,
          date: new Date(),
          accountName: vendorAccount || 'Trade Accounts Payable',
          debitAmount: 0,
          creditAmount: totalPayable,
          narration: `Accounts payable generated for batch ${grn.batchNo}`
        });
        await (session ? creditPayable.save({ session }) : creditPayable.save());
      }

      return qi;
    });
  }
};
