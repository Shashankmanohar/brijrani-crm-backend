import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  companyName: string;
  address: string;
  gstin: string;
  pan: string;
  contactPerson: string;
  poPrefix: string;
  grnPrefix: string;
  invPrefix: string;
  vchPrefix: string;
  clearedAt?: Date;
}

const settingsSchema = new Schema<ISettings>({
  companyName: { type: String, required: true, default: 'BrijRani Agro Foods' },
  address: { type: String, required: true, default: 'Didarganj, Patna, Bihar' },
  gstin: { type: String, required: true, default: '10AAACS8931M2Z1' },
  pan: { type: String, required: true, default: 'AAACS8931M' },
  contactPerson: { type: String, required: true, default: 'Deepak Kumar' },
  poPrefix: { type: String, required: true, default: 'PO/BR/2026-27/' },
  grnPrefix: { type: String, required: true, default: 'GRN/BR/2026-27/' },
  invPrefix: { type: String, required: true, default: 'INV/BR/2026-27/' },
  vchPrefix: { type: String, required: true, default: 'VCH/BR/2026-27/' },
  clearedAt: { type: Date }
}, {
  timestamps: true
});

export const Settings = model<ISettings>('Settings', settingsSchema);
