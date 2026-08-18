import cron from 'node-cron';
import { SalesInvoice } from '../modules/sales/model';
import { FollowUp, Lead } from '../modules/crm/model';
import { sendMail } from '../config/mail';
import { crmService } from '../modules/crm/service';

export const startSchedulers = (): void => {
  console.log('[JOBS] Background schedulers active.');

  // 1. Invoice Overdue Checker (Runs Daily at 1:00 AM) - Section 44
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Checking overdue invoices...');
    const now = new Date();
    
    try {
      const unpaid = await SalesInvoice.find({
        paymentStatus: { $in: ['Unpaid', 'Partially Paid'] },
        dueDate: { $lt: now }
      });

      for (const inv of unpaid) {
        inv.paymentStatus = 'Overdue';
        await inv.save();

        console.log(`[OVERDUE ALERT] Invoice ${inv.invoiceNo} is overdue!`);

        // Trigger CRM Automation Rules (Section 22)
        await crmService.triggerAutomationRules('invoice_overdue', {
          customerId: String(inv.customerId),
          invoiceNo: inv.invoiceNo,
          grandTotal: inv.grandTotal
        });
      }
    } catch (err) {
      console.error('Overdue invoice cron error:', err);
    }
  });

  // 2. CRM Follow-up Reminders (Runs every morning at 8:00 AM) - Section 21/45
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running daily CRM follow-up checks...');
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const followUps = await FollowUp.find({
        followUpDate: { $gte: today, $lt: tomorrow },
        status: 'Pending'
      });

      console.log(`[DAILY REMINDER] Found ${followUps.length} follow-ups due today.`);

      for (const item of followUps) {
        if (item.assignedTo) {
          await sendMail(
            item.assignedTo,
            `Follow-up Reminder: Due Today`,
            `<p>Hi salesperson, you have a follow-up task scheduled for today with details: <br/> <b>Notes:</b> ${item.notes || 'None'}</p>`
          );
        }
      }
    } catch (err) {
      console.error('Follow-up cron error:', err);
    }
  });

  // 3. Customer Re-engagement automation (Runs Daily at 2:00 AM) - Section 46
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Analyzing customer buying patterns for re-engagement...');
    try {
      const customers = await Lead.find({ status: 'Won' });
      const now = Date.now();
      const cutoffDays = 45 * 24 * 60 * 60 * 1000; // 45 days (Section 46)

      for (const cust of customers) {
        const lastOrder = await SalesInvoice.findOne({ customerId: cust._id }).sort({ invoiceDate: -1 });
        const lastOrderDate = lastOrder ? new Date(lastOrder.invoiceDate).getTime() : new Date((cust as any).createdAt).getTime();

        if (now - lastOrderDate > cutoffDays) {
          // Customer has not purchased in 45 days: Create Re-engagement Follow-up task (Section 46)
          const existingFup = await FollowUp.findOne({
            leadId: cust._id,
            status: 'Pending',
            notes: { $regex: 'Re-engagement' }
          });

          if (!existingFup) {
            const reEngageTask = new FollowUp({
              leadId: cust._id,
              followUpDate: new Date(Date.now() + 86400000), // due tomorrow
              followUpTime: '11:00 AM',
              assignedTo: cust.assignedTo || 'sales-manager@brijrani.com',
              type: 'Call',
              notes: `Auto Re-engagement: Contact customer ${cust.name}. No purchase order recorded in the last 45 days.`,
              priority: 'High',
              status: 'Pending'
            });
            await reEngageTask.save();
            console.log(`[RE-ENGAGEMENT TASK] Created re-engagement call for customer ${cust.name}`);
          }
        }
      }
    } catch (err) {
      console.error('Re-engagement cron error:', err);
    }
  });
};
