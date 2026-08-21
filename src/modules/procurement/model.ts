import { Schema, model, Document, Types } from 'mongoose';

// 1. Purchase Enquiry
export interface IPurchaseEnquiryItem {
  item: any;
  description: string;
  sku: string;
  quantity: number;
  unit: string;
  estimatedRate: number;
  estimatedAmount: number;
  requiredDate: Date;
  remarks?: string;
}

export interface IPurchaseEnquiry extends Document {
  enquiryNo: string;
  date: Date;
  requiredByDate: Date;
  department: string;
  requestedBy: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  warehouseId: any;
  purpose?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'RFQ Created' | 'Closed' | 'Cancelled';
  items: IPurchaseEnquiryItem[];
  createdBy: string;
}

const purchaseEnquiryItemSchema = new Schema<IPurchaseEnquiryItem>({
  item: { type: Schema.Types.Mixed, required: true },
  description: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  estimatedRate: { type: Number, required: true },
  estimatedAmount: { type: Number, required: true },
  requiredDate: { type: Date, required: true },
  remarks: { type: String }
});

const purchaseEnquirySchema = new Schema<IPurchaseEnquiry>({
  enquiryNo: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  requiredByDate: { type: Date, required: true },
  department: { type: String, required: true },
  requestedBy: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], required: true, default: 'Medium' },
  warehouseId: { type: Schema.Types.Mixed, required: true },
  purpose: { type: String },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'RFQ Created', 'Closed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  items: [purchaseEnquiryItemSchema],
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 2. Purchase Quotation
export interface IPurchaseQuotationItem {
  item: any;
  description?: string;
  sku: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  deliveryDate: Date;
}

export interface IPurchaseQuotation extends Document {
  quotationNo: string;
  enquiryNo?: string;
  date: Date;
  partyType: 'supplier' | 'farmer';
  partyId: any;
  validUntil: Date;
  paymentTerms: string;
  deliveryDays: number;
  freight: number;
  discount: number;
  tax: number;
  grandTotal: number;
  remarks?: string;
  status: 'Draft' | 'Sent' | 'Under Negotiation' | 'Approved' | 'Rejected' | 'Converted' | 'Completed' | 'Pending Approval';
  items: IPurchaseQuotationItem[];
  createdBy: string;
}

const purchaseQuotationItemSchema = new Schema<IPurchaseQuotationItem>({
  item: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 5 },
  taxAmount: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  deliveryDate: { type: Date, required: true }
});

const purchaseQuotationSchema = new Schema<IPurchaseQuotation>({
  quotationNo: { type: String, required: true, unique: true, index: true },
  enquiryNo: { type: String },
  date: { type: Date, required: true, default: Date.now },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.Mixed, required: true },
  validUntil: { type: Date, required: true },
  paymentTerms: { type: String, default: '30 Days' },
  deliveryDays: { type: Number, default: 5 },
  freight: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  remarks: { type: String },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Under Negotiation', 'Approved', 'Rejected', 'Converted', 'Completed', 'Pending Approval'],
    default: 'Sent',
    index: true
  },
  items: [purchaseQuotationItemSchema],
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 3. Purchase Order
export interface IPurchaseOrderItem {
  item: any;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
  expectedDelivery: Date;
}

export interface IApprovalHistoryItem {
  step: string;
  user: string;
  action: 'Created' | 'Approved' | 'Rejected' | 'Changes Requested';
  date: Date;
  comment?: string;
}

export interface IPurchaseOrder extends Document {
  poNo: string;
  quotationNo?: string;
  date: Date;
  partyType: 'supplier' | 'farmer';
  partyId: any;
  supplierContact?: string;
  billingAddress?: string;
  shippingAddress?: string;
  expectedDelivery: Date;
  paymentTerms: string;
  currency: string;
  buyer: string;
  department: string;
  deliveryTerms?: string;
  freight: number;
  otherCharges: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  attachment?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  items: IPurchaseOrderItem[];
  approvalHistory: IApprovalHistoryItem[];
  warehouseId: any;
  createdBy: string;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  item: { type: Schema.Types.Mixed, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 5 },
  taxAmount: { type: Number, required: true },
  amount: { type: Number, required: true },
  expectedDelivery: { type: Date, required: true }
});

const approvalHistoryItemSchema = new Schema<IApprovalHistoryItem>({
  step: { type: String, required: true },
  user: { type: String, required: true },
  action: { type: String, enum: ['Created', 'Approved', 'Rejected', 'Changes Requested'], required: true },
  date: { type: Date, required: true, default: Date.now },
  comment: { type: String }
});

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  poNo: { type: String, required: true, unique: true, index: true },
  quotationNo: { type: String },
  date: { type: Date, required: true, default: Date.now },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.Mixed, required: true },
  supplierContact: { type: String },
  billingAddress: { type: String },
  shippingAddress: { type: String },
  expectedDelivery: { type: Date, required: true },
  paymentTerms: { type: String, default: '30 Days' },
  currency: { type: String, default: 'INR' },
  buyer: { type: String, required: true },
  department: { type: String, required: true },
  deliveryTerms: { type: String },
  freight: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  notes: { type: String },
  attachment: { type: String },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Partially Received', 'Received', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  items: [purchaseOrderItemSchema],
  approvalHistory: [approvalHistoryItemSchema],
  warehouseId: { type: Schema.Types.Mixed, required: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 4. GRN
export interface IGRNItem {
  item: any;
  orderedQty: number;
  previouslyReceived: number;
  receivedNow: number;
  totalReceived: number;
  pendingQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  damagedQuantity: number;
  unit: string;
  batchNo: string;
  serialNo?: string;
  expiryDate?: Date;
  storageLocation?: string;
  remarks?: string;
}

export interface IGRN extends Document {
  grnNo: string;
  poId: any;
  poNo: string;
  date: Date;
  partyType: 'supplier' | 'farmer';
  partyId: any;
  vehicleNo: string;
  driverName: string;
  arrivalDate: Date;
  warehouseId: any;
  challanNo: string;
  challanDate: Date;
  transporter?: string;
  remarks?: string;
  attachment?: string;
  qualityStatus: 'Pending' | 'Passed' | 'Rejected' | 'Partially Passed';
  inwardStatus: 'Pending' | 'Completed';
  status: 'Draft' | 'Pending QC' | 'Completed' | 'Cancelled' | 'Accepted' | 'Rejected';
  items: IGRNItem[];
  createdBy: string;
}

const grnItemSchema = new Schema<IGRNItem>({
  item: { type: Schema.Types.Mixed, required: true },
  orderedQty: { type: Number, required: true },
  previouslyReceived: { type: Number, default: 0 },
  receivedNow: { type: Number, required: true },
  totalReceived: { type: Number, required: true },
  pendingQuantity: { type: Number, required: true },
  acceptedQuantity: { type: Number, required: true },
  rejectedQuantity: { type: Number, default: 0 },
  damagedQuantity: { type: Number, default: 0 },
  unit: { type: String, required: true },
  batchNo: { type: String, required: true },
  serialNo: { type: String },
  expiryDate: { type: Date },
  storageLocation: { type: String },
  remarks: { type: String }
});

const grnSchema = new Schema<IGRN>({
  grnNo: { type: String, required: true, unique: true, index: true },
  poId: { type: Schema.Types.Mixed, required: true, index: true },
  poNo: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.Mixed, required: true },
  vehicleNo: { type: String, required: true },
  driverName: { type: String, required: true },
  arrivalDate: { type: Date, required: true, default: Date.now },
  warehouseId: { type: Schema.Types.Mixed, required: true, index: true },
  challanNo: { type: String, required: true },
  challanDate: { type: Date, required: true },
  transporter: { type: String },
  remarks: { type: String },
  attachment: { type: String },
  qualityStatus: { type: String, enum: ['Pending', 'Passed', 'Rejected', 'Partially Passed'], default: 'Pending', index: true },
  inwardStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending', index: true },
  status: { type: String, enum: ['Draft', 'Pending QC', 'Completed', 'Cancelled', 'Accepted', 'Rejected'], default: 'Pending QC', index: true },
  items: [grnItemSchema],
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 5. Quality Inspection
export interface IQualityInspectionItem {
  item: any;
  quantity: number;
  moisturePercent: number;
  grade: 'A' | 'B' | 'C' | 'Rejected';
  color: string;
  foreignMaterialPercent: number;
  damagePercent: number;
  purityPercent: number;
  qualityScore: number;
  status: 'Pending' | 'Passed' | 'Partially Passed' | 'Rejected';
  remarks?: string;
}

export interface IQualityInspection extends Document {
  grnId: any;
  grnNo: string;
  inspector: string;
  date: Date;
  status: 'Pending' | 'Passed' | 'Partially Passed' | 'Rejected';
  notes?: string;
  items: IQualityInspectionItem[];
}

const qualityInspectionItemSchema = new Schema<IQualityInspectionItem>({
  item: { type: Schema.Types.Mixed, required: true },
  quantity: { type: Number, required: true },
  moisturePercent: { type: Number, required: true },
  grade: { type: String, enum: ['A', 'B', 'C', 'Rejected'], required: true },
  color: { type: String, required: true },
  foreignMaterialPercent: { type: Number, default: 0 },
  damagePercent: { type: Number, default: 0 },
  purityPercent: { type: Number, default: 100 },
  qualityScore: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Passed', 'Partially Passed', 'Rejected'], required: true },
  remarks: { type: String }
});

const qualityInspectionSchema = new Schema<IQualityInspection>({
  grnId: { type: Schema.Types.Mixed, required: true, index: true },
  grnNo: { type: String, required: true },
  inspector: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['Pending', 'Passed', 'Partially Passed', 'Rejected'], default: 'Passed', index: true },
  notes: { type: String },
  items: [qualityInspectionItemSchema]
}, { timestamps: true });

// 6. Purchase Invoice
export interface IPurchaseInvoiceItem {
  item: any;
  poQty: number;
  receivedQty: number;
  invoiceQty: number;
  rate: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
}

export interface IPurchaseInvoice extends Document {
  invoiceNo: string;
  invoiceDate: Date;
  supplierId: any;
  partyType: 'supplier' | 'farmer';
  poNumber: string;
  grnNumber: string;
  dueDate: Date;
  paymentTerms: string;
  supplierGSTIN?: string;
  billingAddress?: string;
  shippingAddress?: string;
  taxType: string;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  freight: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  status: 'Draft' | 'Pending Verification' | 'Matched' | 'Mismatch' | 'Approved' | 'Partially Paid' | 'Paid' | 'Disputed' | 'Cancelled';
  items: IPurchaseInvoiceItem[];
  mismatchReason?: string;
  createdBy: string;
}

const purchaseInvoiceItemSchema = new Schema<IPurchaseInvoiceItem>({
  item: { type: Schema.Types.Mixed, required: true },
  poQty: { type: Number, required: true },
  receivedQty: { type: Number, required: true },
  invoiceQty: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 5 },
  taxAmount: { type: Number, required: true },
  amount: { type: Number, required: true }
});

const purchaseInvoiceSchema = new Schema<IPurchaseInvoice>({
  invoiceNo: { type: String, required: true, unique: true, index: true },
  invoiceDate: { type: Date, required: true, default: Date.now },
  supplierId: { type: Schema.Types.Mixed, required: true },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  poNumber: { type: String, required: true },
  grnNumber: { type: String, required: true },
  dueDate: { type: Date, required: true },
  paymentTerms: { type: String, required: true },
  supplierGSTIN: { type: String },
  billingAddress: { type: String },
  shippingAddress: { type: String },
  taxType: { type: String, default: 'GST' },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Pending Verification', 'Matched', 'Mismatch', 'Approved', 'Partially Paid', 'Paid', 'Disputed', 'Cancelled'],
    default: 'Pending Verification',
    index: true
  },
  items: [purchaseInvoiceItemSchema],
  mismatchReason: { type: String },
  createdBy: { type: String, required: true }
}, { timestamps: true });

export const PurchaseEnquiry = model<IPurchaseEnquiry>('PurchaseEnquiry', purchaseEnquirySchema);
export const PurchaseQuotation = model<IPurchaseQuotation>('PurchaseQuotation', purchaseQuotationSchema);
export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
export const GRN = model<IGRN>('GRN', grnSchema);
export const QualityInspection = model<IQualityInspection>('QualityInspection', qualityInspectionSchema);
export const PurchaseInvoice = model<IPurchaseInvoice>('PurchaseInvoice', purchaseInvoiceSchema);
