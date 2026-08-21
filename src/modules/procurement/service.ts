import mongoose from 'mongoose';
import { PurchaseEnquiry, PurchaseQuotation, PurchaseOrder, GRN, QualityInspection, PurchaseInvoice } from './model';
import { Supplier } from '../suppliers/model';
import { Farmer } from '../farmers/model';
import { Commodity } from '../commodities/model';
import { Bin } from '../warehouse/model';
import { CustomError } from '../../middlewares/errorHandler';
import { inventoryService } from '../inventory/service';
import { Voucher, LedgerEntry } from '../finance/model';
import { runInTransaction } from '../../utils/transaction';

// Safe ID helper — stores as ObjectId if valid, otherwise stores as-is (string)
// This allows frontend local IDs (CMD-001, WH-001) to be saved without crashing
const toObjectId = (id: any, fieldName: string): any => {
  if (!id) return undefined;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  // Not a valid ObjectId — return as plain string (frontend local ID)
  return id;
};

// Strict version used only where we must have a real ObjectId
const requireObjectId = (id: any, fieldName: string): mongoose.Types.ObjectId => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError(`Invalid or missing ObjectId for ${fieldName}: "${id}"`, 400);
  }
  return new mongoose.Types.ObjectId(id);
};

export const procurementService = {
  // --- ENQUIRIES ---
  createEnquiry: async (data: any, createdBy: string) => {
    const enquiryNo = `PEQ-2026-${String(await PurchaseEnquiry.countDocuments() + 1).padStart(5, '0')}`;
    
    const items = (data.items || []).map((i: any) => ({
      item: toObjectId(i.item, 'item'),
      description: i.description || 'Commodity',
      sku: i.sku || 'SKU',
      quantity: i.quantity,
      unit: i.unit || 'MT',
      estimatedRate: i.estimatedRate,
      estimatedAmount: i.estimatedAmount,
      requiredDate: new Date(i.requiredDate || Date.now()),
      remarks: i.remarks
    }));

    const pe = new PurchaseEnquiry({
      enquiryNo,
      date: new Date(data.date || Date.now()),
      requiredByDate: new Date(data.requiredByDate || Date.now()),
      department: data.department || 'Production',
      requestedBy: data.requestedBy || 'Rahul',
      priority: data.priority || 'Medium',
      warehouseId: toObjectId(data.warehouseId, 'warehouseId'),
      purpose: data.purpose,
      status: data.status || 'Draft',
      items,
      createdBy
    });
    return await pe.save();
  },

  // --- QUOTATIONS ---
  createQuotation: async (data: any, createdBy: string) => {
    const quotationNo = `PQT-2026-${String(await PurchaseQuotation.countDocuments() + 1).padStart(5, '0')}`;
    
    const items = (data.items || []).map((i: any) => ({
      item: toObjectId(i.item, 'item'),
      description: i.description,
      sku: i.sku || 'SKU',
      quantity: i.quantity,
      unit: i.unit || 'MT',
      rate: i.rate,
      discount: i.discount || 0,
      taxPercent: i.taxPercent || 5,
      taxAmount: i.taxAmount,
      lineTotal: i.lineTotal,
      deliveryDate: new Date(i.deliveryDate || Date.now())
    }));

    const pq = new PurchaseQuotation({
      quotationNo,
      enquiryNo: data.enquiryNo,
      date: new Date(data.date || Date.now()),
      partyType: data.partyType,
      partyId: toObjectId(data.partyId, 'partyId'),
      validUntil: new Date(data.validUntil || Date.now()),
      paymentTerms: data.paymentTerms || '30 Days',
      deliveryDays: Number(data.deliveryDays || 5),
      freight: Number(data.freight || 0),
      discount: Number(data.discount || 0),
      tax: Number(data.tax || 0),
      grandTotal: Number(data.grandTotal || 0),
      remarks: data.remarks,
      status: 'Sent',
      items,
      createdBy
    });

    return await pq.save();
  },

  compareQuotations: async (enquiryNo: string) => {
    const list = await PurchaseQuotation.find({
      enquiryNo,
      status: 'Sent'
    }).populate('partyId', 'name gstin state phone');

    return list.sort((a, b) => a.grandTotal - b.grandTotal);
  },

  // --- PURCHASE ORDER ---
  createPO: async (data: any, createdBy: string) => {
    const poNo = `PO-2026-${String(await PurchaseOrder.countDocuments() + 1).padStart(5, '0')}`;
    
    const items = (data.items || []).map((i: any) => ({
      item: toObjectId(i.item, 'item'),
      description: i.description || 'Commodity Description',
      quantity: i.quantity,
      unit: i.unit || 'MT',
      rate: i.rate,
      discount: i.discount || 0,
      taxPercent: i.taxPercent || 5,
      taxAmount: i.taxAmount,
      amount: i.amount,
      expectedDelivery: new Date(i.expectedDelivery || Date.now())
    }));

    const po = new PurchaseOrder({
      poNo,
      quotationNo: data.quotationNo,
      date: new Date(data.date || Date.now()),
      partyType: data.partyType,
      partyId: toObjectId(data.partyId, 'partyId'),
      supplierContact: data.supplierContact,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      expectedDelivery: new Date(data.expectedDelivery || Date.now()),
      paymentTerms: data.paymentTerms || '30 Days',
      currency: data.currency || 'INR',
      buyer: data.buyer || 'Purchase Dept',
      department: data.department || 'Purchase',
      deliveryTerms: data.deliveryTerms,
      freight: Number(data.freight || 0),
      otherCharges: Number(data.otherCharges || 0),
      discount: Number(data.discount || 0),
      tax: Number(data.tax || 0),
      total: Number(data.total || 0),
      notes: data.notes,
      status: data.total >= 500000 ? 'Pending Approval' : 'Approved',
      items,
      approvalHistory: [
        { step: 'Creation', user: createdBy, action: 'Created', date: new Date(), comment: 'Initial PO generation' }
      ],
      warehouseId: toObjectId(data.warehouseId, 'warehouseId'),
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
    po.approvalHistory.push({
      step: 'Manager Approval',
      user: username,
      action: 'Approved',
      date: new Date(),
      comment: 'Approved by manager'
    });
    return await po.save();
  },

  // --- GRN (Goods Receipt Inward) ---
  createGRN: async (data: any, createdBy: string) => {
    return await runInTransaction(async (session) => {
      // Find PO by _id if valid ObjectId, otherwise try by poNo
      let po: any = null;
      if (data.poId && mongoose.Types.ObjectId.isValid(data.poId)) {
        const poQuery = PurchaseOrder.findById(data.poId);
        po = await (session ? poQuery.session(session) : poQuery);
      }
      if (!po && data.poNo) {
        const poQuery = PurchaseOrder.findOne({ poNo: data.poNo });
        po = await (session ? poQuery.session(session) : poQuery);
      }
      if (!po) {
        // GRN submitted without a valid backend PO — save standalone
        const countQuery = GRN.countDocuments();
        const grnNo = data.grnNo || `GRN-2026-${String(await (session ? countQuery.session(session) : countQuery) + 1).padStart(5, '0')}`;
        const grn = new GRN({
          grnNo,
          poId: data.poId || 'LOCAL',
          poNo: data.poNo || 'N/A',
          date: new Date(data.date || Date.now()),
          partyType: data.partyType || 'supplier',
          partyId: data.partyId || 'N/A',
          vehicleNo: (data.vehicleNo || 'N/A').toUpperCase(),
          driverName: data.driverName || 'N/A',
          arrivalDate: new Date(data.arrivalDate || Date.now()),
          warehouseId: data.warehouseId || 'N/A',
          challanNo: data.challanNo || '',
          challanDate: new Date(data.challanDate || Date.now()),
          transporter: data.transporter || '',
          remarks: data.remarks || '',
          qualityStatus: data.qualityStatus || 'Pending',
          inwardStatus: data.inwardStatus || 'Pending',
          status: data.status || 'Pending QC',
          items: (data.items || []).map((i: any) => ({
            item: toObjectId(i.item, 'item'),
            orderedQty: i.orderedQty,
            previouslyReceived: i.previouslyReceived || 0,
            receivedNow: i.receivedNow,
            totalReceived: i.totalReceived,
            pendingQuantity: i.pendingQuantity,
            acceptedQuantity: i.acceptedQuantity || 0,
            rejectedQuantity: i.rejectedQuantity || 0,
            damagedQuantity: i.damagedQuantity || 0,
            unit: i.unit || 'MT',
            batchNo: i.batchNo || `BAT-${Date.now().toString().slice(-6)}`,
            remarks: i.remarks
          })),
          createdBy
        });
        return await (session ? grn.save({ session }) : grn.save());
      }

      const countQuery = GRN.countDocuments();
      const grnNo = data.grnNo || `GRN-2026-${String(await (session ? countQuery.session(session) : countQuery) + 1).padStart(5, '0')}`;
      
      const items = (data.items || []).map((i: any) => ({
        item: toObjectId(i.item, 'item'),
        orderedQty: i.orderedQty,
        previouslyReceived: i.previouslyReceived || 0,
        receivedNow: i.receivedNow,
        totalReceived: i.totalReceived,
        pendingQuantity: i.pendingQuantity,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        damagedQuantity: 0,
        unit: i.unit || 'MT',
        batchNo: `BAT-${po.poNo.slice(-4)}-${Date.now().toString().slice(-3)}`,
        remarks: i.remarks
      }));

      const grn = new GRN({
        grnNo,
        poId: po._id,
        poNo: po.poNo,
        date: new Date(data.date || Date.now()),
        partyType: po.partyType,
        partyId: po.partyId,
        vehicleNo: (data.vehicleNo || 'N/A').toUpperCase(),
        driverName: data.driverName,
        arrivalDate: new Date(data.arrivalDate || Date.now()),
        warehouseId: po.warehouseId,
        challanNo: data.challanNo,
        challanDate: new Date(data.challanDate || Date.now()),
        transporter: data.transporter,
        remarks: data.remarks,
        qualityStatus: 'Pending',
        inwardStatus: 'Pending',
        status: 'Pending QC',
        items,
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

      const items = (data.items || []).map((i: any) => ({
        item: toObjectId(i.item, 'item'),
        quantity: i.quantity,
        moisturePercent: i.moisturePercent,
        grade: i.grade,
        color: i.color,
        foreignMaterialPercent: i.foreignMaterialPercent || 0,
        damagePercent: i.damagePercent || 0,
        purityPercent: i.purityPercent || 100,
        qualityScore: i.qualityScore,
        status: i.status || 'Passed',
        remarks: i.remarks
      }));

      const qi = new QualityInspection({
        grnId: grn._id,
        grnNo: grn.grnNo,
        inspector: createdBy,
        date: new Date(),
        status: data.status || 'Passed',
        notes: data.notes,
        items
      });
      await (session ? qi.save({ session }) : qi.save());

      // Update GRN item details
      if (data.items) {
        data.items.forEach((qiItem: any) => {
          const grnItem = grn.items.find(i => String(i.item) === String(qiItem.item));
          if (grnItem) {
            grnItem.acceptedQuantity = qiItem.status === 'Rejected' ? 0 : grnItem.receivedNow - (qiItem.rejectedQuantity || 0) - (qiItem.damagedQuantity || 0);
            grnItem.rejectedQuantity = qiItem.rejectedQuantity || 0;
            grnItem.damagedQuantity = qiItem.damagedQuantity || 0;
            grnItem.pendingQuantity = Math.max(0, grnItem.orderedQty - grnItem.previouslyReceived - grnItem.acceptedQuantity);
            grnItem.totalReceived = grnItem.previouslyReceived + grnItem.acceptedQuantity;
          }
        });
      }

      grn.qualityStatus = data.status || 'Passed';
      grn.status = data.status === 'Passed' ? 'Completed' : 'Cancelled';
      await (session ? grn.save({ session }) : grn.save());

      const poQuery = PurchaseOrder.findById(grn.poId);
      const po = await (session ? poQuery.session(session) : poQuery);

      if (grn.qualityStatus === 'Passed') {
        // Stock allocation per item in GRN
        for (const grnItem of grn.items) {
          if (grnItem.acceptedQuantity <= 0) continue;

          const poItem = po?.items?.find(i => String(i.item) === String(grnItem.item));
          const unitRate = poItem ? poItem.rate : 20000;

          await inventoryService.createStockLedgerEntry(session, {
            commodityId: String(grnItem.item),
            batchNo: grnItem.batchNo,
            warehouseId: String(grn.warehouseId),
            binId: 'N/A',
            referenceType: 'QUALITY_ACCEPTANCE',
            referenceId: grn.grnNo,
            quantityIn: grnItem.acceptedQuantity,
            quantityOut: 0,
            unitCost: unitRate,
            createdBy
          });
        }

        grn.inwardStatus = 'Completed';
        await (session ? grn.save({ session }) : grn.save());

        if (po) {
          let allCompleted = true;
          for (const poItem of po.items) {
            const grnsForPo = await GRN.find({ poId: po._id, inwardStatus: 'Completed' });
            let totalAccepted = 0;
            grnsForPo.forEach(g => {
              const git = g.items.find(gi => String(gi.item) === String(poItem.item));
              if (git) totalAccepted += git.acceptedQuantity;
            });

            if (totalAccepted < poItem.quantity) {
              allCompleted = false;
            }
          }
          po.status = allCompleted ? 'Received' : 'Partially Received';
          await (session ? po.save({ session }) : po.save());
        }
      }

      return qi;
    });
  },

  // --- PURCHASE INVOICING ---
  createInvoice: async (data: any, createdBy: string) => {
    const invoiceNo = data.invoiceNo;
    const date = new Date(data.invoiceDate || Date.now());

    const items = (data.items || []).map((i: any) => ({
      item: toObjectId(i.item, 'item'),
      poQty: i.poQty,
      receivedQty: i.receivedQty,
      invoiceQty: i.invoiceQty,
      rate: i.rate,
      discount: i.discount || 0,
      taxPercent: i.taxPercent || 5,
      taxAmount: i.taxAmount,
      amount: i.amount
    }));

    const invoice = new PurchaseInvoice({
      invoiceNo,
      invoiceDate: date,
      supplierId: toObjectId(data.supplierId, 'supplierId'),
      partyType: data.partyType,
      poNumber: data.poNumber,
      grnNumber: data.grnNumber,
      dueDate: new Date(data.dueDate),
      paymentTerms: data.paymentTerms,
      supplierGSTIN: data.supplierGSTIN,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      taxType: data.taxType || 'GST',
      subtotal: Number(data.subtotal || 0),
      discount: Number(data.discount || 0),
      cgst: Number(data.cgst || 0),
      sgst: Number(data.sgst || 0),
      igst: Number(data.igst || 0),
      freight: Number(data.freight || 0),
      otherCharges: Number(data.otherCharges || 0),
      roundOff: Number(data.roundOff || 0),
      grandTotal: Number(data.grandTotal || 0),
      status: data.status || 'Pending Verification',
      items,
      mismatchReason: data.mismatchReason,
      createdBy
    });

    return await invoice.save();
  },

  approveInvoice: async (invoiceId: string, username: string) => {
    const invoice = await PurchaseInvoice.findById(invoiceId);
    if (!invoice) throw new CustomError('Invoice not found', 404);
    
    invoice.status = 'Approved';
    
    if (invoice.partyType === 'supplier') {
      const sup = await Supplier.findById(invoice.supplierId);
      if (sup) {
        sup.balance += invoice.grandTotal;
        await sup.save();
      }
    } else {
      const farmer = await Farmer.findById(invoice.supplierId);
      if (farmer) {
        farmer.balance += invoice.grandTotal;
        await farmer.save();
      }
    }

    return await invoice.save();
  },

  getEnquiries: async () => {
    return await PurchaseEnquiry.find().sort({ createdAt: -1 });
  },

  getQuotations: async () => {
    return await PurchaseQuotation.find().sort({ createdAt: -1 });
  },

  getPOs: async () => {
    return await PurchaseOrder.find().sort({ createdAt: -1 });
  },

  getGRNs: async () => {
    return await GRN.find().sort({ createdAt: -1 });
  },

  getQualityInspections: async () => {
    return await QualityInspection.find().sort({ createdAt: -1 });
  },

  getInvoices: async () => {
    return await PurchaseInvoice.find().sort({ createdAt: -1 });
  },

  updateInvoice: async (id: string, data: any) => {
    const invoice = await PurchaseInvoice.findByIdAndUpdate(id, data, { new: true });
    if (!invoice) throw new CustomError('Invoice not found', 404);
    return invoice;
  },

  updateEnquiry: async (id: string, data: any) => {
    const enquiry = await PurchaseEnquiry.findByIdAndUpdate(id, data, { new: true });
    if (!enquiry) throw new CustomError('Enquiry not found', 404);
    return enquiry;
  },

  updatePO: async (id: string, data: any) => {
    const po = await PurchaseOrder.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!po) throw new CustomError('PO not found', 404);
    return po;
  },

  updateGRN: async (id: string, data: any) => {
    const grn = await GRN.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!grn) throw new CustomError('GRN not found', 404);
    return grn;
  },

  updateQualityInspection: async (id: string, data: any) => {
    const qi = await QualityInspection.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!qi) throw new CustomError('Quality Inspection not found', 404);
    return qi;
  },

  updateQuotation: async (id: string, data: any) => {
    const q = await PurchaseQuotation.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!q) throw new CustomError('Quotation not found', 404);
    return q;
  }
};

