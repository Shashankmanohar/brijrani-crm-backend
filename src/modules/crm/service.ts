import { Lead, Opportunity, Activity, FollowUp, CrmAutomationRule } from './model';
import { User } from '../users/model';
import { sendMail } from '../../config/mail';
import { CustomError } from '../../middlewares/errorHandler';
import mongoose from 'mongoose';

export const crmService = {
  // --- LEAD CRUD & AUTO ASSIGNMENT ---
  createLead: async (data: any, createdBy: string) => {
    // 1. Automated Lead Assignment (Round Robin) - Section 20
    const salesExecs = await User.find({ role: 'Sales Executive', status: 'Active' });
    let assignedTo = undefined;

    if (salesExecs.length > 0) {
      // Find the last assigned lead to calculate next index
      const lastLead = await Lead.findOne({ assignedTo: { $exists: true } }).sort({ createdAt: -1 });
      let nextIndex = 0;
      if (lastLead) {
        const lastExecIndex = salesExecs.findIndex(e => e.email === lastLead.assignedTo);
        nextIndex = (lastExecIndex + 1) % salesExecs.length;
      }
      assignedTo = salesExecs[nextIndex].email;
    }

    const lead = new Lead({
      name: data.name,
      companyName: data.companyName,
      phone: data.phone,
      email: data.email,
      status: 'New',
      source: data.source || 'Website Form',
      assignedTo,
      createdBy
    });
    await lead.save();

    // 2. Automatically create Follow-up Task & trigger rules (Section 20/21)
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1); // Follow up next day default
    
    const task = new FollowUp({
      leadId: lead._id,
      followUpDate,
      followUpTime: '10:00 AM',
      assignedTo: assignedTo || createdBy,
      type: 'Call',
      notes: `Introductory call with newly assigned lead: ${lead.name}`,
      priority: 'High',
      status: 'Pending'
    });
    await task.save();

    // Trigger Notification / Email mock
    if (assignedTo) {
      await sendMail(
        assignedTo,
        'New Lead Assigned',
        `<p>You have been assigned a new lead: <b>${lead.name}</b> from ${lead.companyName || 'Unknown Company'}. A follow-up task has been scheduled for tomorrow.</p>`
      );
    }

    return { lead, task };
  },

  listLeads: async (assignedTo?: string): Promise<any[]> => {
    const query = assignedTo ? { assignedTo } : {};
    return await Lead.find(query);
  },

  // --- OPPORTUNITY & WEIGHTED PIPELINE ---
  createOpportunity: async (data: any, createdBy: string) => {
    const opp = new Opportunity({
      leadId: data.leadId ? new mongoose.Types.ObjectId(data.leadId) : undefined,
      customerId: data.customerId ? new mongoose.Types.ObjectId(data.customerId) : undefined,
      name: data.name,
      commodityId: new mongoose.Types.ObjectId(data.commodityId),
      quantity: data.quantity,
      expectedValue: data.expectedValue,
      probability: data.probability || 50,
      expectedCloseDate: new Date(data.expectedCloseDate),
      stage: 'New',
      assignedTo: data.assignedTo,
      createdBy
    });
    return await opp.save();
  },

  listOpportunities: async (): Promise<any[]> => {
    return await Opportunity.find({}).populate('commodityId', 'name');
  },

  // Calculate Weighted Pipeline (Opportunity Value * Probability) - Section 47
  getWeightedPipeline: async () => {
    const list = await Opportunity.find({ stage: { $ne: 'Lost' } });
    const totalPipelineValue = list.reduce((sum, o) => sum + o.expectedValue, 0);
    const weightedPipelineValue = list.reduce((sum, o) => sum + (o.expectedValue * (o.probability / 100)), 0);

    return {
      totalOpportunities: list.length,
      totalPipelineValue,
      weightedPipelineValue
    };
  },

  // --- FOLLOW UPS ---
  createFollowUp: async (data: any) => {
    const fup = new FollowUp({
      leadId: data.leadId ? new mongoose.Types.ObjectId(data.leadId) : undefined,
      opportunityId: data.opportunityId ? new mongoose.Types.ObjectId(data.opportunityId) : undefined,
      customerId: data.customerId ? new mongoose.Types.ObjectId(data.customerId) : undefined,
      followUpDate: new Date(data.followUpDate),
      followUpTime: data.followUpTime || '11:00 AM',
      assignedTo: data.assignedTo,
      type: data.type || 'Call',
      notes: data.notes,
      priority: data.priority || 'Medium',
      status: 'Pending'
    });
    return await fup.save();
  },

  listFollowUps: async (assignedTo?: string): Promise<any[]> => {
    const query = assignedTo ? { assignedTo } : {};
    return await FollowUp.find(query).sort({ followUpDate: 1 });
  },

  // --- CRM AUTOMATION ENGINE RUNNER (Section 22) ---
  triggerAutomationRules: async (
    trigger: 'quotation_created' | 'quotation_sent' | 'invoice_overdue' | 'market_price_target',
    context: Record<string, any>
  ): Promise<void> => {
    const activeRules = await CrmAutomationRule.find({ trigger, isActive: true });
    
    for (const rule of activeRules) {
      // Evaluate conditions
      let conditionsMet = true;
      
      for (const [key, expectedVal] of Object.entries(rule.conditions)) {
        const actualVal = context[key];
        
        // Simple comparison operators
        if (typeof expectedVal === 'object' && expectedVal !== null) {
          if (expectedVal.$gt !== undefined && actualVal <= expectedVal.$gt) conditionsMet = false;
          if (expectedVal.$lt !== undefined && actualVal >= expectedVal.$lt) conditionsMet = false;
          if (expectedVal.$eq !== undefined && actualVal !== expectedVal.$eq) conditionsMet = false;
        } else if (actualVal !== expectedVal) {
          conditionsMet = false;
        }
      }

      if (conditionsMet) {
        console.log(`[CRM AUTOMATION RULE TRIGGERED] Rule: ${rule.name}`);
        
        for (const action of rule.actions) {
          if (action.type === 'create_task') {
            const task = new FollowUp({
              customerId: context.customerId ? new mongoose.Types.ObjectId(context.customerId) : undefined,
              followUpDate: new Date(Date.now() + (action.details.daysOffset || 1) * 86400000),
              followUpTime: '10:00 AM',
              assignedTo: action.details.assignedTo || 'sales-manager@brijrani.com',
              type: action.details.taskType || 'Call',
              notes: action.details.notes || `Auto task generated by rule: ${rule.name}`,
              priority: action.details.priority || 'Medium',
              status: 'Pending'
            });
            await task.save();
          } 
          else if (action.type === 'send_email') {
            const toEmail = action.details.to || context.customerEmail || 'sales-manager@brijrani.com';
            await sendMail(
              toEmail,
              action.details.subject || 'Automated CRM Alert',
              `<p>${action.details.body || 'Alert conditions satisfied.'}</p>`
            );
          }
        }
      }
    }
  }
};
