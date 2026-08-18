import { Schema, model, Document, Types } from 'mongoose';

// 1. Vehicle
export interface IVehicle extends Document {
  registrationNo: string;
  type: string;
  capacityMT: number;
  owner: string;
  status: 'Available' | 'In Transit' | 'Maintenance';
}

const vehicleSchema = new Schema<IVehicle>({
  registrationNo: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  capacityMT: { type: Number, required: true },
  owner: { type: String, required: true },
  status: { type: String, enum: ['Available', 'In Transit', 'Maintenance'], default: 'Available', index: true }
}, { timestamps: true });

// 2. Driver
export interface IDriver extends Document {
  name: string;
  phone: string;
  licenseNo: string;
  status: 'Active' | 'On Trip' | 'Inactive';
}

const driverSchema = new Schema<IDriver>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  licenseNo: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['Active', 'On Trip', 'Inactive'], default: 'Active', index: true }
}, { timestamps: true });

// 3. Delivery Challan
export interface IDeliveryChallan extends Document {
  dcNo: string;
  soId: Types.ObjectId;
  soNo: string;
  customerId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  vehicleNo: string;
  driverName: string;
  commodityId: Types.ObjectId;
  quantity: number;
  deliveryAddress: string;
  dispatchDate: Date;
  status: 'Draft' | 'Dispatched' | 'Delivered' | 'Cancelled';
}

const deliveryChallanSchema = new Schema<IDeliveryChallan>({
  dcNo: { type: String, required: true, unique: true, index: true },
  soId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true, index: true },
  soNo: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  vehicleNo: { type: String, required: true },
  driverName: { type: String, required: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  dispatchDate: { type: Date, required: true, default: Date.now, index: true },
  status: { type: String, enum: ['Draft', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Draft', index: true }
}, { timestamps: true });

// 4. E-Way Bill
export interface IEWayBill extends Document {
  ewayBillNo: string;
  invoiceNo: string;
  vehicleNo: string;
  transporterName: string;
  distance: number;
  validFrom: Date;
  validUntil: Date;
  status: 'Active' | 'Expired' | 'Cancelled';
}

const ewayBillSchema = new Schema<IEWayBill>({
  ewayBillNo: { type: String, required: true, unique: true, index: true },
  invoiceNo: { type: String, required: true, index: true },
  vehicleNo: { type: String, required: true },
  transporterName: { type: String, required: true },
  distance: { type: Number, required: true },
  validFrom: { type: Date, required: true, default: Date.now },
  validUntil: { type: Date, required: true, index: true },
  status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active', index: true }
}, { timestamps: true });

// 5. POD
export interface IProofOfDelivery extends Document {
  podNo: string;
  dcNo: string;
  invoiceNo: string;
  customerName: string;
  deliveredQty: number;
  receivedBy: string;
  deliveryDate: Date;
  status: 'Delivered' | 'Partially Delivered' | 'Rejected';
  signaturePhotoUrl?: string;
  deliveryPhotoUrl?: string;
  remarks?: string;
}

const proofOfDeliverySchema = new Schema<IProofOfDelivery>({
  podNo: { type: String, required: true, unique: true, index: true },
  dcNo: { type: String, required: true, index: true },
  invoiceNo: { type: String, required: true },
  customerName: { type: String, required: true },
  deliveredQty: { type: Number, required: true },
  receivedBy: { type: String, required: true },
  deliveryDate: { type: Date, required: true, default: Date.now, index: true },
  status: { type: String, enum: ['Delivered', 'Partially Delivered', 'Rejected'], default: 'Delivered', index: true },
  signaturePhotoUrl: { type: String },
  deliveryPhotoUrl: { type: String },
  remarks: { type: String }
}, { timestamps: true });

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
export const Driver = model<IDriver>('Driver', driverSchema);
export const DeliveryChallan = model<IDeliveryChallan>('DeliveryChallan', deliveryChallanSchema);
export const EWayBill = model<IEWayBill>('EWayBill', ewayBillSchema);
export const ProofOfDelivery = model<IProofOfDelivery>('ProofOfDelivery', proofOfDeliverySchema);
