import mongoose from 'mongoose';
import { SalesEnquiry, SalesQuotation, SalesOrder, PickingTask, PackingSlip, SalesInvoice } from './model';
import { Customer } from '../customers/model';
import { Commodity } from '../commodities/model';
import { Warehouse, Bin } from '../warehouse/model';
import { DeliveryChallan, EWayBill, ProofOfDelivery, Vehicle, Driver } from '../logistics/model';
import { Voucher, LedgerEntry } from '../finance/model';
import { CustomError } from '../../middlewares/errorHandler';
import { inventoryService } from '../inventory/service';
import { runInTransaction } from '../../utils/transaction';

export const salesService = {
  // --- SALES ENQUIRY ---
  createEnquiry: async (data: any, createdBy: string) => {
    const enquiryNo = `SEQ-2026-${String(await SalesEnquiry.countDocuments() + 1).padStart(5, '0')}`;
    const se = new SalesEnquiry({
      enquiryNo,
      date: new Date(data.date || Date.now()),
      customerId: new mongoose.Types.ObjectId(data.customerId),
      commodityId: new mongoose.Types.ObjectId(data.commodityId),
      quantity: data.quantity,
      expectedRate: data.expectedRate,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      deliveryLocation: data.deliveryLocation,
      status: 'Sent',
      createdBy
    });
    return await se.save();
  },

  // --- SALES QUOTATION ---
  createQuotation: async (data: any, createdBy: string) => {
    const quotationNo = `SQT-2026-${String(await SalesQuotation.countDocuments() + 1).padStart(5, '0')}`;

    const stockSummary = await inventoryService.getStockSummary(data.commodityId);
    const avgCost = stockSummary.length > 0 ? stockSummary[0].averageCost : 20000;

    const qty = data.quantity;
    const baseValue = data.rate * qty;
    const purchaseCost = avgCost * qty;
    const expectedProfit = baseValue - purchaseCost;

    const freight = data.freightCost || 0;
    const loading = data.loadingCost || 0;
    const other = data.otherCharges || 0;
    const discount = data.discountAmount || 0;
    const taxes = (baseValue + freight + loading + other - discount) * ((data.gstPercent || 5) / 100);

    const total = baseValue + freight + loading + other + taxes - discount;

    const sq = new SalesQuotation({
      quotationNo,
      enquiryNo: data.enquiryNo,
      date: new Date(data.date || Date.now()),
      customerId: new mongoose.Types.ObjectId(data.customerId),
      commodityId: new mongoose.Types.ObjectId(data.commodityId),
      quantity: qty,
      rate: data.rate,
      gstPercent: data.gstPercent || 5,
      freightCost: freight,
      loadingCost: loading,
      otherCharges: other,
      discountAmount: discount,
      total,
      validUntil: new Date(data.validUntil),
      paymentTerms: data.paymentTerms || 'Net 30',
      deliveryTerms: data.deliveryTerms || 'FOB',
      purchaseCost: avgCost,
      expectedProfit,
      status: 'Sent',
      createdBy
    });

    return await sq.save();
  },

  // --- SALES ORDER & RESERVATION ---
  createSO: async (data: any, createdBy: string) => {
    return await runInTransaction(async (session) => {
      const countQuery = SalesOrder.countDocuments();
      const soNo = `SO-2026-${String(await (session ? countQuery.session(session) : countQuery) + 1).padStart(5, '0')}`;

      const so = new SalesOrder({
        soNo,
        quotationNo: data.quotationNo,
        date: new Date(data.date || Date.now()),
        customerId: new mongoose.Types.ObjectId(data.customerId),
        commodityId: new mongoose.Types.ObjectId(data.commodityId),
        quantity: data.quantity,
        rate: data.rate,
        gstPercent: data.gstPercent || 5,
        freightCost: data.freightCost || 0,
        otherCharges: data.otherCharges || 0,
        total: data.total,
        warehouseId: new mongoose.Types.ObjectId(data.warehouseId),
        deliveryAddress: data.deliveryAddress,
        status: 'Draft',
        createdBy
      });
      await (session ? so.save({ session }) : so.save());

      const stockSummary = await inventoryService.getStockSummary(String(so.commodityId), String(so.warehouseId));
      const totalAvailable = stockSummary.reduce((sum, item) => sum + item.availableStock, 0);

      if (totalAvailable < so.quantity) {
        const shortage = so.quantity - totalAvailable;
        so.status = 'Draft';
        await (session ? so.save({ session }) : so.save());
        return { so, status: 'INSUFFICIENT_STOCK_ALERT', shortage };
      }

      await inventoryService.reserveStock(
        String(so._id),
        String(so.commodityId),
        so.quantity,
        String(so.warehouseId),
        createdBy
      );

      const pckCountQuery = PickingTask.countDocuments();
      const pickingNo = `PCK-2026-${String(await (session ? pckCountQuery.session(session) : pckCountQuery) + 1).padStart(5, '0')}`;
      
      const binQuery = Bin.findOne({
        warehouseId: so.warehouseId,
        allowedCommodityId: so.commodityId,
        'currentStock.quantity': { $gt: 0 }
      });
      const bin = await (session ? binQuery.session(session) : binQuery);

      if (!bin) throw new CustomError('Storage bin for picking task not found', 404);

      const pickTask = new PickingTask({
        pickingNo,
        soId: so._id,
        date: new Date(),
        warehouseId: so.warehouseId,
        commodityId: so.commodityId,
        batchNo: bin.currentStock[0].batchNo,
        binId: bin._id,
        qtyToPick: so.quantity,
        qtyPicked: 0,
        status: 'Pending',
        createdBy
      });
      await (session ? pickTask.save({ session }) : pickTask.save());

      so.status = 'Picking';
      await (session ? so.save({ session }) : so.save());

      if (data.quotationNo) {
        await SalesQuotation.updateOne({ quotationNo: data.quotationNo }, { status: 'Converted' });
      }

      return { so, status: 'RESERVED_AND_PICKING', pickTask };
    });
  },

  // Complete picking & packing
  completePicking: async (pickingId: string, qtyPicked: number, packageType: string, createdBy: string) => {
    return await runInTransaction(async (session) => {
      const taskQuery = PickingTask.findById(pickingId);
      const task = await (session ? taskQuery.session(session) : taskQuery);
      if (!task) throw new CustomError('Picking task not found', 404);
      if (task.status === 'Completed') throw new CustomError('Picking already completed', 400);

      task.qtyPicked = qtyPicked;
      task.status = 'Completed';
      await (session ? task.save({ session }) : task.save());

      const soQuery = SalesOrder.findById(task.soId);
      const so = await (session ? soQuery.session(session) : soQuery);
      if (!so) throw new CustomError('SO not found', 404);

      const packCountQuery = PackingSlip.countDocuments();
      const packingNo = `PKG-2026-${String(await (session ? packCountQuery.session(session) : packCountQuery) + 1).padStart(5, '0')}`;
      const numPackages = Math.ceil((qtyPicked * 1000) / 50);

      const pack = new PackingSlip({
        packingNo,
        pickingId: task._id,
        soId: so._id,
        customerId: so.customerId,
        commodityId: so.commodityId,
        batchNo: task.batchNo,
        quantity: qtyPicked,
        packageType: packageType || 'PP Bags (50 Kg)',
        numPackages,
        weight: qtyPicked,
        packingDate: new Date(),
        status: 'Completed',
        createdBy
      });
      await (session ? pack.save({ session }) : pack.save());

      so.status = 'Packed';
      await (session ? so.save({ session }) : so.save());

      return pack;
    });
  },

  // --- DISPATCH, TAX INVOICE & E-WAY BILL ---
  dispatchOrder: async (soId: string, vehicleNo: string, driverName: string, createdBy: string) => {
    return await runInTransaction(async (session) => {
      const soQuery = SalesOrder.findById(soId);
      const so = await (session ? soQuery.session(session) : soQuery);
      if (!so) throw new CustomError('SO not found', 404);

      const custQuery = Customer.findById(so.customerId);
      const customer = await (session ? custQuery.session(session) : custQuery);
      if (!customer) throw new CustomError('Customer not found', 404);

      await Vehicle.updateOne({ registrationNo: vehicleNo.toUpperCase() }, { status: 'In Transit' });
      await Driver.updateOne({ name: driverName }, { status: 'On Trip' });

      const dcCountQuery = DeliveryChallan.countDocuments();
      const dcNo = `DC-2026-${String(await (session ? dcCountQuery.session(session) : dcCountQuery) + 1).padStart(5, '0')}`;
      const dc = new DeliveryChallan({
        dcNo,
        soId: so._id,
        soNo: so.soNo,
        customerId: so.customerId,
        warehouseId: so.warehouseId,
        vehicleNo: vehicleNo.toUpperCase(),
        driverName,
        commodityId: so.commodityId,
        quantity: so.quantity,
        deliveryAddress: so.deliveryAddress,
        dispatchDate: new Date(),
        status: 'Dispatched'
      });
      await (session ? dc.save({ session }) : dc.save());

      const ewayBillNo = `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 3);

      const ewb = new EWayBill({
        ewayBillNo,
        invoiceNo: `INV-2026-${dcNo.slice(-5)}`,
        vehicleNo: vehicleNo.toUpperCase(),
        transporterName: 'Mithila Transports Patna',
        distance: 120,
        validFrom: new Date(),
        validUntil,
        status: 'Active'
      });
      await (session ? ewb.save({ session }) : ewb.save());

      const invCountQuery = SalesInvoice.countDocuments();
      const invoiceNo = `INV-2026-${String(await (session ? invCountQuery.session(session) : invCountQuery) + 1).padStart(5, '0')}`;
      
      const commQuery = Commodity.findById(so.commodityId);
      const comm = await (session ? commQuery.session(session) : commQuery);
      const hsn = comm ? comm.hsn : '1001';

      const baseValue = so.rate * so.quantity;
      const isIntrastate = customer.state.toLowerCase() === 'bihar';
      
      let cgst = 0, sgst = 0, igst = 0;
      const gstRate = so.gstPercent || 5;

      if (isIntrastate) {
        cgst = baseValue * ((gstRate / 2) / 100);
        sgst = baseValue * ((gstRate / 2) / 100);
      } else {
        igst = baseValue * (gstRate / 100);
      }

      const invoiceItem = {
        commodityId: so.commodityId,
        hsn,
        quantity: so.quantity,
        rate: so.rate,
        discount: 0,
        taxableAmount: baseValue,
        cgst,
        sgst,
        igst,
        total: baseValue + cgst + sgst + igst
      };

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = new SalesInvoice({
        invoiceNo,
        soId: so._id,
        customerId: so.customerId,
        invoiceDate: new Date(),
        dueDate,
        items: [invoiceItem],
        taxableAmount: baseValue,
        discountAmount: 0,
        cgst,
        sgst,
        igst,
        freightCost: so.freightCost,
        otherCharges: so.otherCharges,
        grandTotal: baseValue + cgst + sgst + igst + so.freightCost + so.otherCharges,
        placeOfSupply: customer.state,
        paymentStatus: 'Unpaid',
        ewayBillNo,
        createdBy
      });
      await (session ? invoice.save({ session }) : invoice.save());

      so.status = 'Shipped';
      await (session ? so.save({ session }) : so.save());

      const voucherNo = `REC-2026-${Date.now().toString().slice(-4)}`;
      const voucher = new Voucher({
        voucherNumber: voucherNo,
        date: new Date(),
        voucherType: 'Journal',
        partyType: 'customer',
        partyId: customer._id,
        amount: invoice.grandTotal,
        paymentMode: 'Bank Transfer',
        reference: invoice.invoiceNo,
        narration: `Sales invoice ledger entries for invoice ${invoice.invoiceNo}`,
        attachments: [],
        status: 'Approved',
        createdBy
      });
      await (session ? voucher.save({ session }) : voucher.save());

      customer.balance += invoice.grandTotal;
      await (session ? customer.save({ session }) : customer.save());

      const debitCustomer = new LedgerEntry({
        voucherId: voucher._id,
        voucherNumber: voucherNo,
        date: new Date(),
        accountName: `${customer.name} Accounts Receivable`,
        debitAmount: invoice.grandTotal,
        creditAmount: 0,
        narration: `Accounts receivable debited for invoice ${invoice.invoiceNo}`
      });
      await (session ? debitCustomer.save({ session }) : debitCustomer.save());

      const creditRevenue = new LedgerEntry({
        voucherId: voucher._id,
        voucherNumber: voucherNo,
        date: new Date(),
        accountName: 'Sales Revenue A/c',
        debitAmount: 0,
        creditAmount: baseValue,
        narration: `Sales revenue credited for invoice ${invoice.invoiceNo}`
      });
      await (session ? creditRevenue.save({ session }) : creditRevenue.save());

      return { dc, invoice, ewb };
    });
  },

  // --- PROOF OF DELIVERY (POD) ---
  submitPOD: async (data: any, createdBy: string) => {
    return await runInTransaction(async (session) => {
      const dcQuery = DeliveryChallan.findOne({ dcNo: data.dcNo });
      const dc = await (session ? dcQuery.session(session) : dcQuery);
      if (!dc) throw new CustomError('Delivery Challan not found', 404);
      if (dc.status === 'Delivered') throw new CustomError('POD has already been recorded', 400);

      const podCountQuery = ProofOfDelivery.countDocuments();
      const podNo = `POD-2026-${String(await (session ? podCountQuery.session(session) : podCountQuery) + 1).padStart(5, '0')}`;
      
      const invQuery = SalesInvoice.findOne({ soId: dc.soId });
      const invoice = await (session ? invQuery.session(session) : invQuery);
      const invoiceNo = invoice ? invoice.invoiceNo : 'Unknown';

      const custQuery = Customer.findById(dc.customerId);
      const customer = await (session ? custQuery.session(session) : custQuery);

      const pod = new ProofOfDelivery({
        podNo,
        dcNo: dc.dcNo,
        invoiceNo,
        customerName: customer ? customer.name : 'Unknown',
        deliveredQty: data.deliveredQty,
        receivedBy: data.receivedBy,
        deliveryDate: new Date(data.deliveryDate || Date.now()),
        status: data.status || 'Delivered',
        signaturePhotoUrl: data.signaturePhotoUrl,
        deliveryPhotoUrl: data.deliveryPhotoUrl,
        remarks: data.remarks
      });
      await (session ? pod.save({ session }) : pod.save());

      dc.status = 'Delivered';
      await (session ? dc.save({ session }) : dc.save());

      const soQuery = SalesOrder.findById(dc.soId);
      const so = await (session ? soQuery.session(session) : soQuery);
      if (so) {
        so.status = 'Completed';
        await (session ? so.save({ session }) : so.save());
      }

      await Vehicle.updateOne({ registrationNo: dc.vehicleNo }, { status: 'Available' });
      await Driver.updateOne({ name: dc.driverName }, { status: 'Active' });

      await inventoryService.releaseStockReservation(String(dc.soId), 'Released', session);

      const pickQuery = PickingTask.findOne({ soId: dc.soId });
      const pickTask = await (session ? pickQuery.session(session) : pickQuery);
      if (pickTask) {
        await inventoryService.createStockLedgerEntry(session, {
          commodityId: String(dc.commodityId),
          batchNo: pickTask.batchNo,
          warehouseId: String(dc.warehouseId),
          binId: String(pickTask.binId),
          referenceType: 'GOODS_OUTWARD',
          referenceId: dc.dcNo,
          quantityIn: 0,
          quantityOut: dc.quantity,
          unitCost: so ? so.rate : 22000,
          createdBy
        });
      }

      return pod;
    });
  },

  listInvoices: async () => {
    return await SalesInvoice.find({}).sort({ invoiceDate: -1 });
  }
};
