import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string; // Storing role name directly for fast lookup
  status: 'Active' | 'Inactive';
  companyId?: string;
  branchId?: string;
  refreshTokenHash?: string;
  verificationCode?: string;
  isVerified: boolean;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, index: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  companyId: { type: String, index: true },
  branchId: { type: String },
  refreshTokenHash: { type: String },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema);
