import { Schema, model, Document, Types } from 'mongoose';

// 1. Sales Enquiry
export interface ISalesEnquiry extends Document {
  enquiryNo: string;
  date: Date;
  customerId: Types.ObjectId;
  commodityId: Types.ObjectId;
  quantity: number;
  expectedRate: number;
  requiredDeliveryDate: Date;
  deliveryLocation: string;
  status: 'Draft' | 'Sent' | 'Negotiation' | 'Approved' | 'Converted' | 'Closed' | 'Cancelled';
  createdBy: string;
}

const salesEnquirySchema = new Schema<ISalesEnquiry>({
  enquiryNo: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  expectedRate: { type: Number, required: true },
  requiredDeliveryDate: { type: Date, required: true },
  deliveryLocation: { type: String, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Negotiation', 'Approved', 'Converted', 'Closed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 2. Sales Quotation
export interface ISalesQuotation extends Document {
  quotationNo: string;
  enquiryNo?: string;
  date: Date;
  customerId: Types.ObjectId;
  commodityId: Types.ObjectId;
  quantity: number;
  rate: number;
  gstPercent: number;
  freightCost: number;
  loadingCost: number;
  otherCharges: number;
  discountAmount: number;
  total: number;
  validUntil: Date;
  paymentTerms: string;
  deliveryTerms: string;
  purchaseCost: number; // Avg cost baseline
  expectedProfit: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Negotiation' | 'Accepted' | 'Rejected' | 'Expired';
  createdBy: string;
}

const salesQuotationSchema = new Schema<ISalesQuotation>({
  quotationNo: { type: String, required: true, unique: true, index: true },
  enquiryNo: { type: String },
  date: { type: Date, required: true, default: Date.now },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  gstPercent: { type: Number, default: 5 },
  freightCost: { type: Number, default: 0 },
  loadingCost: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  validUntil: { type: Date, required: true },
  paymentTerms: { type: String, default: 'Net 30' },
  deliveryTerms: { type: String, default: 'FOB' },
  purchaseCost: { type: Number, required: true },
  expectedProfit: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Viewed', 'Negotiation', 'Accepted', 'Rejected', 'Expired'],
    default: 'Draft',
    index: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 3. Sales Order
export interface ISalesOrder extends Document {
  soNo: string;
  quotationNo?: string;
  date: Date;
  customerId: Types.ObjectId;
  commodityId: Types.ObjectId;
  quantity: number;
  rate: number;
  gstPercent: number;
  freightCost: number;
  otherCharges: number;
  total: number;
  warehouseId: Types.ObjectId;
  deliveryAddress: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Picking' | 'Packed' | 'Shipped' | 'Completed' | 'Cancelled';
  createdBy: string;
}

const salesOrderSchema = new Schema<ISalesOrder>({
  soNo: { type: String, required: true, unique: true, index: true },
  quotationNo: { type: String },
  date: { type: Date, required: true, default: Date.now },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  gstPercent: { type: Number, default: 5 },
  freightCost: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  total: { type: Number, required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  deliveryAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Picking', 'Packed', 'Shipped', 'Completed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 4. Picking Task
export interface IPickingTask extends Document {
  pickingNo: string;
  soId: Types.ObjectId;
  date: Date;
  warehouseId: Types.ObjectId;
  commodityId: Types.ObjectId;
  batchNo: string;
  binId: Types.ObjectId;
  qtyToPick: number;
  qtyPicked: number;
  status: 'Pending' | 'Completed';
  createdBy: string;
}

const pickingTaskSchema = new Schema<IPickingTask>({
  pickingNo: { type: String, required: true, unique: true, index: true },
  soId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  batchNo: { type: String, required: true },
  binId: { type: Schema.Types.ObjectId, ref: 'Bin', required: true },
  qtyToPick: { type: Number, required: true },
  qtyPicked: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending', index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 5. Packing Slip
export interface IPackingSlip extends Document {
  packingNo: string;
  pickingId: Types.ObjectId;
  soId: Types.ObjectId;
  customerId: Types.ObjectId;
  commodityId: Types.ObjectId;
  batchNo: string;
  quantity: number;
  packageType: string;
  numPackages: number;
  weight: number;
  packingDate: Date;
  status: 'Pending' | 'Completed';
  createdBy: string;
}

const packingSlipSchema = new Schema<IPackingSlip>({
  packingNo: { type: String, required: true, unique: true, index: true },
  pickingId: { type: Schema.Types.ObjectId, ref: 'PickingTask', required: true },
  soId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  batchNo: { type: String, required: true },
  quantity: { type: Number, required: true },
  packageType: { type: String, required: true, default: 'PP Bags (50 Kg)' },
  numPackages: { type: Number, required: true },
  weight: { type: Number, required: true },
  packingDate: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Completed', index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 6. Sales Invoice Item
export interface ISalesInvoiceItem {
  commodityId: Types.ObjectId;
  hsn: string;
  quantity: number;
  rate: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

// 7. Sales Invoice
export interface ISalesInvoice extends Document {
  invoiceNo: string;
  soId: Types.ObjectId;
  customerId: Types.ObjectId;
  invoiceDate: Date;
  dueDate: Date;
  items: ISalesInvoiceItem[];
  taxableAmount: number;
  discountAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  freightCost: number;
  otherCharges: number;
  grandTotal: number;
  placeOfSupply: string; // State e.g. 'Bihar' or 'West Bengal'
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  ewayBillNo?: string;
  createdBy: string;
}

const salesInvoiceSchema = new Schema<ISalesInvoice>({
  invoiceNo: { type: String, required: true, unique: true, index: true },
  soId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  invoiceDate: { type: Date, required: true, default: Date.now, index: true },
  dueDate: { type: Date, required: true, index: true },
  items: {
    type: [{
      commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
      hsn: { type: String, required: true },
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      taxableAmount: { type: Number, required: true },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      total: { type: Number, required: true }
    }],
    required: true
  },
  taxableAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  freightCost: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  placeOfSupply: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Unpaid',
    index: true
  },
  ewayBillNo: { type: String },
  createdBy: { type: String, required: true }
}, { timestamps: true });

export const SalesEnquiry = model<ISalesEnquiry>('SalesEnquiry', salesEnquirySchema);
export const SalesQuotation = model<ISalesQuotation>('SalesQuotation', salesQuotationSchema);
export const SalesOrder = model<ISalesOrder>('SalesOrder', salesOrderSchema);
export const PickingTask = model<IPickingTask>('PickingTask', pickingTaskSchema);
export const PackingSlip = model<IPackingSlip>('PackingSlip', packingSlipSchema);
export const SalesInvoice = model<ISalesInvoice>('SalesInvoice', salesInvoiceSchema);
