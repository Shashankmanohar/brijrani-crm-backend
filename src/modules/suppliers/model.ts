import { Schema, model, Document } from 'mongoose';

export interface ISupplier extends Document {
  supplierCode: string;
  name: string;
  companyName?: string;
  gstin: string;
  pan?: string;
  phone: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  state: string;
  paymentTerms: string;
  openingBalance: number;
  balance: number; // Current outstanding payable
  status: 'Active' | 'Inactive';
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

const supplierSchema = new Schema<ISupplier>({
  supplierCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, unique: true, index: true },
  companyName: { type: String },
  gstin: { type: String, required: true, index: true },
  pan: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  billingAddress: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  state: { type: String, required: true, default: 'Bihar', index: true },
  paymentTerms: { type: String, default: 'Net 30' },
  openingBalance: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String }
}, {
  timestamps: true
});

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
