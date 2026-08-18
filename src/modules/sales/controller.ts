import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { salesService } from './service';
import { sendSuccess } from '../../utils/response';

export const salesController = {
  createEnquiry: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const se = await salesService.createEnquiry(req.body, email);
      sendSuccess(res, 'Sales Enquiry logged successfully', se, 201);
    } catch (err) {
      next(err);
    }
  },

  createQuotation: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const sq = await salesService.createQuotation(req.body, email);
      sendSuccess(res, 'Sales Quotation generated successfully', sq, 201);
    } catch (err) {
      next(err);
    }
  },

  createSO: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const result = await salesService.createSO(req.body, email);
      
      if (result.status === 'INSUFFICIENT_STOCK_ALERT') {
        sendSuccess(res, 'Sales Order logged as DRAFT. Insufficient stock in storage - purchasing manager notified.', result, 200);
      } else {
        sendSuccess(res, 'Sales Order confirmed, stock reserved and picking task assigned', result, 201);
      }
    } catch (err) {
      next(err);
    }
  },

  completePicking: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const { pickingId, qtyPicked, packageType } = req.body;
      const pack = await salesService.completePicking(pickingId, qtyPicked, packageType, email);
      sendSuccess(res, 'Silo picking and package packing slips generated', pack, 200);
    } catch (err) {
      next(err);
    }
  },

  dispatchOrder: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const { soId, vehicleNo, driverName } = req.body;
      const dispatch = await salesService.dispatchOrder(soId, vehicleNo, driverName, email);
      sendSuccess(res, 'Order dispatched, tax invoice generated, and vehicle allocated', dispatch, 200);
    } catch (err) {
      next(err);
    }
  },

  submitPOD: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const pod = await salesService.submitPOD(req.body, email);
      sendSuccess(res, 'Proof of Delivery registered, active inventory decremented', pod, 201);
    } catch (err) {
      next(err);
    }
  },

  listInvoices: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await salesService.listInvoices();
      sendSuccess(res, 'Sales Invoices retrieved successfully', list, 200);
    } catch (err) {
      next(err);
    }
  }
};
