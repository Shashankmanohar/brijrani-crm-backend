import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { procurementService } from './service';
import { sendSuccess } from '../../utils/response';

export const procurementController = {
  createEnquiry: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const pe = await procurementService.createEnquiry(req.body, email);
      sendSuccess(res, 'Purchase Enquiry created successfully', pe, 201);
    } catch (err) {
      next(err);
    }
  },

  updateEnquiry: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pe = await procurementService.updateEnquiry(req.params.id as string, req.body);
      sendSuccess(res, 'Purchase Enquiry updated successfully', pe);
    } catch (err) {
      next(err);
    }
  },

  createQuotation: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const pq = await procurementService.createQuotation(req.body, email);
      sendSuccess(res, 'Purchase Quotation logged successfully', pq, 201);
    } catch (err) {
      next(err);
    }
  },

  compareQuotations: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiryNo = req.query.enquiryNo as string;
      const comparison = await procurementService.compareQuotations(enquiryNo);
      sendSuccess(res, 'Quotation comparison generated', comparison);
    } catch (err) {
      next(err);
    }
  },

  createPO: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const po = await procurementService.createPO(req.body, email);
      sendSuccess(res, 'Purchase Order created successfully', po, 201);
    } catch (err) {
      next(err);
    }
  },

  approvePO: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.user?.id || 'admin';
      const po = await procurementService.approvePO(req.params.id as string, username);
      sendSuccess(res, 'Purchase Order approved', po);
    } catch (err) {
      next(err);
    }
  },

  createGRN: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const grn = await procurementService.createGRN(req.body, email);
      sendSuccess(res, 'Goods Receipt Note logged successfully', grn, 201);
    } catch (err) {
      next(err);
    }
  },

  submitQualityInspection: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const qi = await procurementService.submitQualityInspection(req.body, email);
      sendSuccess(res, 'Quality Inspection logged and inventory updated successfully', qi, 201);
    } catch (err) {
      next(err);
    }
  },

  createInvoice: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.user?.id || 'admin';
      const invoice = await procurementService.createInvoice(req.body, email);
      sendSuccess(res, 'Purchase Invoice created successfully', invoice, 201);
    } catch (err) {
      next(err);
    }
  },

  approveInvoice: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.user?.id || 'admin';
      const invoice = await procurementService.approveInvoice(req.params.id as string, username);
      sendSuccess(res, 'Purchase Invoice approved', invoice);
    } catch (err) {
      next(err);
    }
  },

  getEnquiries: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await procurementService.getEnquiries();
      sendSuccess(res, 'Enquiries fetched', list);
    } catch (err) {
      next(err);
    }
  },

  getQuotations: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await procurementService.getQuotations();
      sendSuccess(res, 'Quotations fetched', list);
    } catch (err) {
      next(err);
    }
  },

  getPOs: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await procurementService.getPOs();
      sendSuccess(res, 'Purchase Orders fetched', list);
    } catch (err) {
      next(err);
    }
  },

  getGRNs: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await procurementService.getGRNs();
      sendSuccess(res, 'GRNs fetched', list);
    } catch (err) {
      next(err);
    }
  },

  getQualityInspections: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await procurementService.getQualityInspections();
      sendSuccess(res, 'Quality Inspections fetched', list);
    } catch (err) {
      next(err);
    }
  },

  getInvoices: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await procurementService.getInvoices();
      sendSuccess(res, 'Invoices fetched', list);
    } catch (err) {
      next(err);
    }
  },

  updateInvoice: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await procurementService.updateInvoice(req.params.id as string, req.body);
      sendSuccess(res, 'Purchase Invoice updated successfully', invoice);
    } catch (err) {
      next(err);
    }
  },

  updatePO: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await procurementService.updatePO(req.params.id as string, req.body);
      sendSuccess(res, 'Purchase Order updated successfully', po);
    } catch (err) {
      next(err);
    }
  },

  updateGRN: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const grn = await procurementService.updateGRN(req.params.id as string, req.body);
      sendSuccess(res, 'GRN updated successfully', grn);
    } catch (err) {
      next(err);
    }
  },

  updateQualityInspection: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const qi = await procurementService.updateQualityInspection(req.params.id as string, req.body);
      sendSuccess(res, 'Quality Inspection updated successfully', qi);
    } catch (err) {
      next(err);
    }
  },

  updateQuotation: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = await procurementService.updateQuotation(req.params.id as string, req.body);
      sendSuccess(res, 'Purchase Quotation updated successfully', q);
    } catch (err) {
      next(err);
    }
  }
};
