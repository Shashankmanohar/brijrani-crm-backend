import { Schema, model, Document, Types } from 'mongoose';

// 1. Lead
export interface ILead extends Document {
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Requirement Received' | 'Quotation Sent' | 'Negotiation' | 'Won' | 'Lost';
  source: string;
  assignedTo?: string; // Storing user email or username
  createdBy: string;
}

const leadSchema = new Schema<ILead>({
  name: { type: String, required: true },
  companyName: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Requirement Received', 'Quotation Sent', 'Negotiation', 'Won', 'Lost'],
    default: 'New',
    index: true
  },
  source: { type: String, default: 'Website Enquiry' },
  assignedTo: { type: String, index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 2. Opportunity
export interface IOpportunity extends Document {
  leadId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  name: string;
  commodityId: Types.ObjectId;
  quantity: number;
  expectedValue: number;
  probability: number; // 0 to 100
  expectedCloseDate: Date;
  stage: 'New' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  assignedTo?: string;
  createdBy: string;
}

const opportunitySchema = new Schema<IOpportunity>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  name: { type: String, required: true },
  commodityId: { type: Schema.Types.ObjectId, ref: 'Commodity', required: true },
  quantity: { type: Number, required: true },
  expectedValue: { type: Number, required: true },
  probability: { type: Number, required: true, default: 50 },
  expectedCloseDate: { type: Date, required: true },
  stage: {
    type: String,
    enum: ['New', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'New',
    index: true
  },
  assignedTo: { type: String, index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 3. Activity
export interface IActivity extends Document {
  leadId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  type: 'Call' | 'Meeting' | 'Email' | 'Site Visit' | 'Other';
  subject: string;
  description?: string;
  date: Date;
  createdBy: string;
}

const activitySchema = new Schema<IActivity>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  type: { type: String, enum: ['Call', 'Meeting', 'Email', 'Site Visit', 'Other'], required: true },
  subject: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true, default: Date.now },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 4. Follow Up
export interface IFollowUp extends Document {
  leadId?: Types.ObjectId;
  opportunityId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  followUpDate: Date;
  followUpTime: string;
  assignedTo: string;
  type: 'Call' | 'Email' | 'Meeting' | 'WhatsApp';
  notes?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed' | 'Overdue';
}

const followUpSchema = new Schema<IFollowUp>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  followUpDate: { type: Date, required: true, index: true },
  followUpTime: { type: String, required: true },
  assignedTo: { type: String, required: true, index: true },
  type: { type: String, enum: ['Call', 'Email', 'Meeting', 'WhatsApp'], required: true },
  notes: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium', index: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Overdue'], default: 'Pending', index: true }
}, { timestamps: true });

// 5. CRM Automation Rule
export interface ICrmAutomationRule extends Document {
  name: string;
  trigger: 'quotation_created' | 'quotation_sent' | 'invoice_overdue' | 'market_price_target';
  conditions: Record<string, any>;
  actions: Array<{
    type: 'create_task' | 'notify_manager' | 'send_email';
    details: Record<string, any>;
  }>;
  isActive: boolean;
}

const crmAutomationRuleSchema = new Schema<ICrmAutomationRule>({
  name: { type: String, required: true },
  trigger: { 
    type: String, 
    enum: ['quotation_created', 'quotation_sent', 'invoice_overdue', 'market_price_target'],
    required: true,
    index: true 
  },
  conditions: { type: Schema.Types.Mixed, default: {} },
  actions: {
    type: [{
      type: { type: String, enum: ['create_task', 'notify_manager', 'send_email'], required: true },
      details: { type: Schema.Types.Mixed, default: {} }
    }],
    required: true
  },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

export const Lead = model<ILead>('Lead', leadSchema);
export const Opportunity = model<IOpportunity>('Opportunity', opportunitySchema);
export const Activity = model<IActivity>('Activity', activitySchema);
export const FollowUp = model<IFollowUp>('FollowUp', followUpSchema);
export const CrmAutomationRule = model<ICrmAutomationRule>('CrmAutomationRule', crmAutomationRuleSchema);
