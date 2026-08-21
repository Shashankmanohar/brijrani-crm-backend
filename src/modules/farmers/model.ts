import { Schema, model, Document } from 'mongoose';

export interface IFarmerQualityLog {
  poNo: string;
  moisturePercent: number;
  qualityScore: number;
  grade: string;
  date: string;
}

export interface IFarmer extends Document {
  farmerCode: string;
  name: string;
  phone: string;
  email?: string;
  village: string;
  district: string;
  state: string;
  farmSizeAcres?: number;
  soilType?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  openingBalance: number;
  balance: number; // Current payable / advance
  qualityHistory: IFarmerQualityLog[];
  status: 'Active' | 'Inactive';
  pan?: string;
  aadhar?: string;
}

const farmerSchema = new Schema<IFarmer>({
  farmerCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  email: { type: String },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true, default: 'Bihar', index: true },
  farmSizeAcres: { type: Number },
  soilType: { type: String },
  bankName: { type: String },
  bankAccountNo: { type: String },
  bankIfsc: { type: String },
  pan: { type: String },
  aadhar: { type: String },
  openingBalance: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  qualityHistory: {
    type: [{
      poNo: { type: String, required: true },
      moisturePercent: { type: Number, required: true },
      qualityScore: { type: Number, required: true },
      grade: { type: String, required: true },
      date: { type: String, required: true }
    }],
    default: []
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true }
}, {
  timestamps: true
});

export const Farmer = model<IFarmer>('Farmer', farmerSchema);
