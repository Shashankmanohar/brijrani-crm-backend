import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  username: string;
  action: string; // e.g. "Create", "Approve", "Edit", "Delete"
  module: string; // e.g. "Procurement", "Sales", "Warehouse", "Finance"
  documentType: string; // e.g. "PurchaseOrder", "SalesInvoice"
  documentId: string;
  oldValue?: Schema.Types.Mixed;
  newValue?: Schema.Types.Mixed;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  documentType: { type: String, required: true, index: true },
  documentId: { type: String, required: true, index: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false // We use manual timestamp
});

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
