import { Schema, model, Document, Types } from 'mongoose';

// 1. Purchase Enquiry
export interface IPurchaseEnquiry extends Document {
  enquiryNo: string;
  date: Date;
  partyType: 'supplier' | 'farmer';
  partyId: Types.ObjectId;
  commodityId: Types.ObjectId;
  quantity: number;
  requiredDeliveryDate: Date;
  status: 'Draft' | 'Sent' | 'Negotiation' | 'Approved' | 'Converted' | 'Closed' | 'Cancelled';
  createdBy: string;
}

const purchaseEnquirySchema = new Schema<IPurchaseEnquiry>({
  enquiryNo: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.ObjectId, required: true, refPath: 'partyType' },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  requiredDeliveryDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Negotiation', 'Approved', 'Converted', 'Closed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 2. Purchase Quotation
export interface IPurchaseQuotation extends Document {
  quotationNo: string;
  enquiryId?: Types.ObjectId;
  date: Date;
  partyType: 'supplier' | 'farmer';
  partyId: Types.ObjectId;
  commodityId: Types.ObjectId;
  quantity: number;
  rate: number; // Raw rate per MT
  transportCost: number;
  loadingCost: number;
  unloadingCost: number;
  otherCharges: number;
  gstPercent: number;
  landedCostPerUnit: number; // Calculated landed cost per MT
  total: number; // Grand total
  validUntil: Date;
  status: 'Draft' | 'Sent' | 'Negotiation' | 'Approved' | 'Rejected' | 'Converted' | 'Cancelled';
  createdBy: string;
}

const purchaseQuotationSchema = new Schema<IPurchaseQuotation>({
  quotationNo: { type: String, required: true, unique: true, index: true },
  enquiryId: { type: Schema.Types.ObjectId, ref: 'PurchaseEnquiry' },
  date: { type: Date, required: true, default: Date.now },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.ObjectId, required: true, refPath: 'partyType' },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  transportCost: { type: Number, default: 0 },
  loadingCost: { type: Number, default: 0 },
  unloadingCost: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 5 },
  landedCostPerUnit: { type: Number, required: true },
  total: { type: Number, required: true },
  validUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Negotiation', 'Approved', 'Rejected', 'Converted', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 3. Purchase Order
export interface IPurchaseOrder extends Document {
  poNo: string;
  quotationNo?: string;
  date: Date;
  partyType: 'supplier' | 'farmer';
  partyId: Types.ObjectId;
  commodityId: Types.ObjectId;
  quantity: number;
  rate: number;
  transportCost: number;
  otherCharges: number;
  gstPercent: number;
  total: number;
  warehouseId: Types.ObjectId;
  expectedDelivery: Date;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Partially Received' | 'Fully Received' | 'Closed' | 'Cancelled';
  createdBy: string;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  poNo: { type: String, required: true, unique: true, index: true },
  quotationNo: { type: String },
  date: { type: Date, required: true, default: Date.now },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.ObjectId, required: true, refPath: 'partyType' },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  transportCost: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 5 },
  total: { type: Number, required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  expectedDelivery: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Partially Received', 'Fully Received', 'Closed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 4. GRN
export interface IGRN extends Document {
  grnNo: string;
  poId: Types.ObjectId;
  partyType: 'supplier' | 'farmer';
  partyId: Types.ObjectId;
  vehicleNo: string;
  driverName: string;
  commodityId: Types.ObjectId;
  batchNo: string;
  warehouseId: Types.ObjectId;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  qualityStatus: 'Pending' | 'Passed' | 'Partially Passed' | 'Rejected';
  inwardStatus: 'Pending' | 'Completed';
  status: 'Draft' | 'Pending QC' | 'Completed' | 'Cancelled';
  createdBy: string;
}

const grnSchema = new Schema<IGRN>({
  grnNo: { type: String, required: true, unique: true, index: true },
  poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
  partyType: { type: String, enum: ['supplier', 'farmer'], required: true },
  partyId: { type: Schema.Types.ObjectId, required: true, refPath: 'partyType' },
  vehicleNo: { type: String, required: true },
  driverName: { type: String, required: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  batchNo: { type: String, required: true, unique: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  orderedQty: { type: Number, required: true },
  receivedQty: { type: Number, required: true },
  acceptedQty: { type: Number, required: true },
  rejectedQty: { type: Number, default: 0 },
  qualityStatus: { type: String, enum: ['Pending', 'Passed', 'Partially Passed', 'Rejected'], default: 'Pending', index: true },
  inwardStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending', index: true },
  status: { type: String, enum: ['Draft', 'Pending QC', 'Completed', 'Cancelled'], default: 'Pending QC', index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 5. Quality Inspection
export interface IQualityInspection extends Document {
  grnId: Types.ObjectId;
  grnNo: string;
  commodityId: Types.ObjectId;
  batchNo: string;
  moisturePercent: number;
  grade: 'A' | 'B' | 'C' | 'Rejected';
  damagePercent: number;
  foreignMaterialPercent: number;
  color: string;
  purityPercent: number;
  qualityScore: number;
  inspector: string;
  status: 'Pending' | 'Passed' | 'Partially Passed' | 'Rejected';
  notes?: string;
}

const qualityInspectionSchema = new Schema<IQualityInspection>({
  grnId: { type: Schema.Types.ObjectId, ref: 'GRN', required: true, index: true },
  grnNo: { type: String, required: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  batchNo: { type: String, required: true, index: true },
  moisturePercent: { type: Number, required: true },
  grade: { type: String, enum: ['A', 'B', 'C', 'Rejected'], required: true },
  damagePercent: { type: Number, default: 0 },
  foreignMaterialPercent: { type: Number, default: 0 },
  color: { type: String, required: true },
  purityPercent: { type: Number, default: 100 },
  qualityScore: { type: Number, required: true },
  inspector: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Passed', 'Partially Passed', 'Rejected'], default: 'Passed', index: true },
  notes: { type: String }
}, { timestamps: true });

export const PurchaseEnquiry = model<IPurchaseEnquiry>('PurchaseEnquiry', purchaseEnquirySchema);
export const PurchaseQuotation = model<IPurchaseQuotation>('PurchaseQuotation', purchaseQuotationSchema);
export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
export const GRN = model<IGRN>('GRN', grnSchema);
export const QualityInspection = model<IQualityInspection>('QualityInspection', qualityInspectionSchema);
