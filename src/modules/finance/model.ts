import { Schema, model, Document, Types } from 'mongoose';

// 1. Financial Voucher (Payment, Receipt, Contra, Journal, Expense)
export interface IVoucher extends Document {
  voucherNumber: string;
  date: Date;
  voucherType: 'Receipt' | 'Payment' | 'Contra' | 'Journal' | 'Expense' | 'Income';
  partyType: 'customer' | 'supplier' | 'farmer' | 'other';
  partyId?: Types.ObjectId;
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI';
  reference?: string; // Cheque number / UPI ID / invoice ref
  narration?: string;
  attachments: string[]; // Uploaded URLs
  status: 'Draft' | 'Approved' | 'Cancelled';
  createdBy: string;
}

const voucherSchema = new Schema<IVoucher>({
  voucherNumber: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, default: Date.now, index: true },
  voucherType: { 
    type: String, 
    enum: ['Receipt', 'Payment', 'Contra', 'Journal', 'Expense', 'Income'], 
    required: true,
    index: true 
  },
  partyType: { type: String, enum: ['customer', 'supplier', 'farmer', 'other'], required: true },
  partyId: { type: Schema.Types.ObjectId, refPath: 'partyType' },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI'], required: true },
  reference: { type: String },
  narration: { type: String },
  attachments: { type: [String], default: [] },
  status: { type: String, enum: ['Draft', 'Approved', 'Cancelled'], default: 'Approved', index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 2. Accounting Ledger Entry (Immutable double entry log)
export interface ILedgerEntry extends Document {
  voucherId: Types.ObjectId;
  voucherNumber: string;
  date: Date;
  accountName: string; // e.g. "HDFC Bank Main A/c", "Sales Revenue A/c"
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

const ledgerEntrySchema = new Schema<ILedgerEntry>({
  voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher', required: true, index: true },
  voucherNumber: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  accountName: { type: String, required: true, index: true },
  debitAmount: { type: Number, default: 0 },
  creditAmount: { type: Number, default: 0 },
  narration: { type: String }
}, { timestamps: true });

export const Voucher = model<IVoucher>('Voucher', voucherSchema);
export const LedgerEntry = model<ILedgerEntry>('LedgerEntry', ledgerEntrySchema);
