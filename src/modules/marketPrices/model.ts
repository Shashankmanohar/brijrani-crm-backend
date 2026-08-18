import { Schema, model, Document, Types } from 'mongoose';

// 1. Market Price History
export interface IMarketPrice extends Document {
  commodityId: Types.ObjectId;
  market: string;
  date: Date;
  pricePerUnit: number; // e.g. Price per MT
  unit: string;
  source: string;
}

const marketPriceSchema = new Schema<IMarketPrice>({
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true, index: true },
  market: { type: String, required: true, index: true },
  date: { type: Date, required: true, default: Date.now, index: true },
  pricePerUnit: { type: Number, required: true },
  unit: { type: String, required: true, default: 'MT' },
  source: { type: String, default: 'Government Mandi Portal' }
}, { timestamps: true });

// 2. Price Alert
export interface IPriceAlert extends Document {
  commodityId: Types.ObjectId;
  targetPrice: number;
  minProfitPercent?: number;
  maxLossPercent?: number;
  createdBy: string;
  status: 'Pending' | 'Triggered' | 'Expired';
}

const priceAlertSchema = new Schema<IPriceAlert>({
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true, index: true },
  targetPrice: { type: Number, required: true },
  minProfitPercent: { type: Number },
  maxLossPercent: { type: Number },
  createdBy: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Triggered', 'Expired'], default: 'Pending', index: true }
}, { timestamps: true });

export const MarketPrice = model<IMarketPrice>('MarketPrice', marketPriceSchema);
export const PriceAlert = model<IPriceAlert>('PriceAlert', priceAlertSchema);
