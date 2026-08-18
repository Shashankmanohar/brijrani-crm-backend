import { Schema, model, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
}

const roleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  permissions: { type: [String], default: [] }
}, {
  timestamps: true
});

export const Role = model<IRole>('Role', roleSchema);
