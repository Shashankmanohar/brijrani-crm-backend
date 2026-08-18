import mongoose from 'mongoose';
import { PurchaseOrder } from '../procurement/model';
import { SalesInvoice, SalesOrder } from '../sales/model';
import { Bin } from '../warehouse/model';
import { Commodity } from '../commodities/model';
import { Customer } from '../customers/model';
import { Supplier } from '../suppliers/model';
import { Farmer } from '../farmers/model';
import { DeliveryChallan } from '../logistics/model';
import { FollowUp } from '../crm/model';
import { PriceAlert, MarketPrice } from '../marketPrices/model';
import { inventoryService } from '../inventory/service';

export const reportsService = {
  // Centralized Dashboard Summary Engine (Section 52)
  getDashboardSummary: async () => {
    // 1. Financial totals
    const totalPurchaseAggr = await PurchaseOrder.aggregate([
      { $match: { status: { $in: ['Approved', 'Fully Received', 'Partially Received'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalPurchase = totalPurchaseAggr[0] ? totalPurchaseAggr[0].total : 0;

    const totalSalesAggr = await SalesInvoice.aggregate([
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalSales = totalSalesAggr[0] ? totalSalesAggr[0].total : 0;

    // 2. Stock valuations & Arbitrage profits (Section 17/52)
    const bins = await Bin.find({});
    let stockValue = 0;
    let potentialProfit = 0;

    for (const bin of bins) {
      for (const stockItem of bin.currentStock) {
        const comm = await Commodity.findById(stockItem.commodityId);
        if (comm) {
          const costValue = stockItem.quantity * comm.purchasePrice;
          stockValue += costValue;

          // Potential profit calculation compared to live mandi price
          const profitDiff = Math.max(0, comm.sellingPrice - comm.purchasePrice);
          potentialProfit += (profitDiff * stockItem.quantity);
        }
      }
    }

    // 3. Receivables & Payables
    const customers = await Customer.find({});
    const receivable = customers.reduce((sum, c) => sum + c.balance, 0);

    const suppliers = await Supplier.find({});
    const farmers = await Farmer.find({});
    const payable = suppliers.reduce((sum, s) => sum + s.balance, 0) + farmers.reduce((sum, f) => sum + f.balance, 0);

    // 4. Pending workflows counts
    const pendingOrders = await PurchaseOrder.countDocuments({ status: 'Approved' });
    const pendingDispatch = await SalesOrder.countDocuments({ status: 'Packed' });
    const pendingPOD = await DeliveryChallan.countDocuments({ status: 'Dispatched' });

    // 5. CRM & Alert counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFollowups = await FollowUp.countDocuments({
      followUpDate: { $gte: today, $lt: tomorrow },
      status: 'Pending'
    });

    const marketPriceAlerts = await PriceAlert.countDocuments({ status: 'Triggered' });
    const overdueInvoices = await SalesInvoice.countDocuments({
      paymentStatus: { $in: ['Unpaid', 'Partially Paid'] },
      dueDate: { $lt: new Date() }
    });

    return {
      totalPurchase,
      totalSales,
      stockValue,
      potentialProfit,
      receivable,
      payable,
      pendingOrders,
      pendingDispatch,
      pendingPOD,
      overdueInvoices,
      todayFollowups,
      marketPriceAlerts
    };
  }
};
