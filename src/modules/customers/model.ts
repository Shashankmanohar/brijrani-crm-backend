import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  companyName?: string;
  gstin: string;
  pan?: string;
  phone: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  state: string;
  creditLimit: number;
  paymentTerms: string;
  openingBalance: number;
  balance: number; 
  status: 'Active' | 'Inactive';
}

const customerSchema = new Schema<ICustomer>({
  customerCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, unique: true, index: true },
  companyName: { type: String },
  gstin: { type: String, required: true, index: true },
  pan: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  billingAddress: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  state: { type: String, required: true, default: 'Bihar', index: true },
  creditLimit: { type: Number, default: 0 },
  paymentTerms: { type: String, default: 'Net 30' },
  openingBalance: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true }
}, {
  timestamps: true
});

export const Customer = model<ICustomer>('Customer', customerSchema);
