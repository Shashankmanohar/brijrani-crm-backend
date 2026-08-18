import { Schema, model, Document, Types } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  location: string;
  capacityMT: number;
  usedCapacityMT: number;
  status: 'Active' | 'Inactive';
}

export interface IBinStock {
  commodityId: Types.ObjectId;
  batchNo: string;
  quantity: number;
}

export interface IBin extends Document {
  warehouseId: Types.ObjectId;
  binCode: string; // unique, e.g. WH01-ZA-R02-B05
  name: string; // e.g. Patna Silo Zone A Bin 5
  allowedCommodityId: Types.ObjectId;
  capacityMT: number;
  occupiedMT: number;
  availableMT: number;
  currentStock: IBinStock[];
}

const warehouseSchema = new Schema<IWarehouse>({
  name: { type: String, required: true, unique: true, index: true },
  location: { type: String, required: true },
  capacityMT: { type: Number, required: true, default: 1000 },
  usedCapacityMT: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true }
}, {
  timestamps: true
});

const binSchema = new Schema<IBin>({
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  binCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  allowedCommodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true, index: true },
  capacityMT: { type: Number, required: true, default: 50 },
  occupiedMT: { type: Number, required: true, default: 0 },
  availableMT: { type: Number, required: true, default: 50 },
  currentStock: {
    type: [{
      commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
      batchNo: { type: String, required: true },
      quantity: { type: Number, required: true }
    }],
    default: []
  }
}, {
  timestamps: true
});

// Compound indexing for bin routing checks
binSchema.index({ warehouseId: 1, allowedCommodityId: 1 });

export const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema);
export const Bin = model<IBin>('Bin', binSchema);
