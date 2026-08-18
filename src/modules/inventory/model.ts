import { Schema, model, Document, Types } from 'mongoose';

export interface IStockLedgerEntry extends Document {
  commodityId: Types.ObjectId;
  batchNo: string;
  warehouseId: Types.ObjectId;
  binId: Types.ObjectId;
  referenceType: 
    | 'PURCHASE_RECEIPT'
    | 'QUALITY_ACCEPTANCE'
    | 'GOODS_INWARD'
    | 'SALES_RESERVATION'
    | 'PICKING'
    | 'GOODS_OUTWARD'
    | 'STOCK_TRANSFER'
    | 'STOCK_ADJUSTMENT'
    | 'PURCHASE_RETURN'
    | 'SALES_RETURN'
    | 'DAMAGE'
    | 'LOSS'
    | 'OPENING_STOCK';
  referenceId: string; // Document ID / Invoice number
  quantityIn: number;
  quantityOut: number;
  unitCost: number;
  runningBalance: number;
  createdBy: string;
}

export interface IStockReservation extends Document {
  salesOrderId: Types.ObjectId;
  commodityId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  binId: Types.ObjectId;
  batchNo: string;
  reservedQty: number;
  status: 'Active' | 'Released' | 'Cancelled';
  createdBy: string;
}

const stockLedgerEntrySchema = new Schema<IStockLedgerEntry>({
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true, index: true },
  batchNo: { type: String, required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  binId: { type: Schema.Types.ObjectId, ref: 'Bin', required: true, index: true },
  referenceType: { 
    type: String, 
    enum: [
      'PURCHASE_RECEIPT', 'QUALITY_ACCEPTANCE', 'GOODS_INWARD', 'SALES_RESERVATION',
      'PICKING', 'GOODS_OUTWARD', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT',
      'PURCHASE_RETURN', 'SALES_RETURN', 'DAMAGE', 'LOSS', 'OPENING_STOCK'
    ], 
    required: true,
    index: true
  },
  referenceId: { type: String, required: true, index: true },
  quantityIn: { type: Number, default: 0 },
  quantityOut: { type: Number, default: 0 },
  unitCost: { type: Number, required: true, default: 0 },
  runningBalance: { type: Number, required: true },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

const stockReservationSchema = new Schema<IStockReservation>({
  salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true, index: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  binId: { type: Schema.Types.ObjectId, ref: 'Bin', required: true, index: true },
  batchNo: { type: String, required: true, index: true },
  reservedQty: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Released', 'Cancelled'], default: 'Active', index: true },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Indexes for valuation queries
stockLedgerEntrySchema.index({ commodityId: 1, batchNo: 1 });

export const StockLedgerEntry = model<IStockLedgerEntry>('StockLedgerEntry', stockLedgerEntrySchema);
export const StockReservation = model<IStockReservation>('StockReservation', stockReservationSchema);
