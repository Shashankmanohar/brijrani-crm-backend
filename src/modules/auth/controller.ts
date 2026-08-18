import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { authService } from './service';
import { registerSchema, loginSchema } from './validation';
import { sendSuccess } from '../../utils/response';
import { Role } from '../roles/model';
import { User } from '../users/model';
import { Commodity } from '../commodities/model';
import { Warehouse, Bin } from '../warehouse/model';
import { Customer } from '../customers/model';
import { Supplier } from '../suppliers/model';
import { Farmer } from '../farmers/model';
import { Vehicle, Driver } from '../logistics/model';
import { CrmAutomationRule } from '../crm/model';
import { PurchaseOrder } from '../procurement/model';
import { SalesInvoice, SalesOrder } from '../sales/model';
import { Voucher } from '../finance/model';
import bcrypt from 'bcrypt';

export const authController = {
  register: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData);
      
      sendSuccess(res, 'User registered successfully. Check email for verification code.', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }, 201);
    } catch (err) {
      next(err);
    }
  },

  verifyEmail: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, code } = req.body;
      await authService.verifyEmail(email, code);
      sendSuccess(res, 'Email verified successfully. You can now log in.');
    } catch (err) {
      next(err);
    }
  },

  login: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.login(validatedData);

      sendSuccess(res, 'Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          branchId: user.branchId
        },
        accessToken,
        refreshToken
      });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      sendSuccess(res, 'Tokens refreshed successfully', tokens);
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (userId) {
        await authService.logout(userId);
      }
      sendSuccess(res, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  seed: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear collections
      await Role.deleteMany({});
      await User.deleteMany({});
      await Commodity.deleteMany({});
      await Warehouse.deleteMany({});
      await Bin.deleteMany({});
      await Customer.deleteMany({});
      await Supplier.deleteMany({});
      await Farmer.deleteMany({});
      await Vehicle.deleteMany({});
      await Driver.deleteMany({});
      await CrmAutomationRule.deleteMany({});
      await PurchaseOrder.deleteMany({});
      await SalesOrder.deleteMany({});
      await SalesInvoice.deleteMany({});
      await Voucher.deleteMany({});

      // Seed Roles
      const allPermissions = [
        'auth.manage',
        'masters.manage',
        'procurement.read', 'procurement.create', 'procurement.approve', 'procurement.cancel',
        'sales.read', 'sales.create', 'sales.approve', 'sales.cancel',
        'warehouse.read', 'warehouse.inward', 'warehouse.transfer', 'warehouse.adjust',
        'logistics.read', 'logistics.dispatch', 'logistics.pod',
        'crm.read', 'crm.leads', 'crm.automation',
        'finance.read', 'finance.voucher', 'finance.ledger', 'finance.aging'
      ];

      const adminRole = new Role({
        name: 'Super Admin',
        description: 'Super Administrator with access to all modules.',
        permissions: allPermissions
      });
      await adminRole.save();

      const buyerRole = new Role({
        name: 'Purchase Manager',
        description: 'Manager of procurement and QC.',
        permissions: ['procurement.read', 'procurement.create', 'procurement.approve', 'masters.manage']
      });
      await buyerRole.save();

      const whRole = new Role({
        name: 'Warehouse Manager',
        description: 'Manager of silo space and picking.',
        permissions: ['warehouse.read', 'warehouse.inward', 'warehouse.transfer', 'logistics.read', 'logistics.pod']
      });
      await whRole.save();

      const acctRole = new Role({
        name: 'Accountant',
        description: 'Reconciles books and payables.',
        permissions: ['finance.read', 'finance.voucher', 'finance.ledger', 'finance.aging']
      });
      await acctRole.save();

      // Seed Admin User
      const passwordHash = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@brijrani.com',
        passwordHash,
        role: 'Super Admin',
        status: 'Active',
        companyId: 'company-001',
        branchId: 'branch-001',
        isVerified: true
      });
      await adminUser.save();

      // Seed Commodities
      const wheat = new Commodity({
        commodityCode: 'CMD-001',
        name: 'Wheat (Gehun)',
        category: 'Grains',
        unit: 'MT',
        hsn: '10019910',
        gstRate: 5,
        purchasePrice: 22000,
        sellingPrice: 24500,
        minimumStock: 20,
        maximumStock: 1000,
        batchTracking: true,
        qualityParameters: [
          { name: 'Moisture Percent', minLimit: 9, maxLimit: 12.5 },
          { name: 'Foreign Material Percent', minLimit: 0, maxLimit: 1.5 }
        ]
      });
      await wheat.save();

      const paddy = new Commodity({
        commodityCode: 'CMD-002',
        name: 'Paddy (Dhan)',
        category: 'Grains',
        unit: 'MT',
        hsn: '10061010',
        gstRate: 5,
        purchasePrice: 19500,
        sellingPrice: 21800,
        minimumStock: 30,
        maximumStock: 1500,
        batchTracking: true
      });
      await paddy.save();

      const mustard = new Commodity({
        commodityCode: 'CMD-003',
        name: 'Mustard Seeds (Sarso)',
        category: 'Oilseeds',
        unit: 'MT',
        hsn: '12075000',
        gstRate: 5,
        purchasePrice: 52000,
        sellingPrice: 56500,
        minimumStock: 10,
        maximumStock: 500,
        batchTracking: true
      });
      await mustard.save();

      // Seed Warehouses
      const whPatna = new Warehouse({
        name: 'Patna Central Silos',
        location: 'Didarganj Industrial Area, Patna Bypass Road',
        capacityMT: 1000
      });
      await whPatna.save();

      const whBihta = new Warehouse({
        name: 'Bihta Grain Terminal',
        location: 'Bihta Dry Port Highway, Patna Rural',
        capacityMT: 800
      });
      await whBihta.save();

      // Silo Bins
      const bin1 = new Bin({
        warehouseId: whPatna._id,
        binCode: 'BIN-PA-S01',
        name: 'Patna Silo 1 - Wheat Exclusive',
        allowedCommodityId: wheat._id,
        capacityMT: 200,
        occupiedMT: 0,
        availableMT: 200
      });
      await bin1.save();

      const bin2 = new Bin({
        warehouseId: whPatna._id,
        binCode: 'BIN-PA-S02',
        name: 'Patna Silo 2 - Paddy Storage',
        allowedCommodityId: paddy._id,
        capacityMT: 300,
        occupiedMT: 0,
        availableMT: 300
      });
      await bin2.save();

      // Seed Partners
      const cust1 = new Customer({
        customerCode: 'CUS-1001',
        name: 'Bihar Roller Flour Mills',
        companyName: 'Roller Grain Processing Group',
        gstin: '10AAACR0912K1Z8',
        phone: '+91 9988776655',
        email: 'procurement@biharflour.com',
        billingAddress: 'Fatuha Industrial Estate, Patna, Bihar, 803201',
        shippingAddress: 'Fatuha Industrial Estate, Patna, Bihar, 803201',
        creditLimit: 5000000,
        paymentTerms: 'Net 30',
        openingBalance: 0,
        balance: 0
      });
      await cust1.save();

      const sup1 = new Supplier({
        supplierCode: 'SUP-2001',
        name: 'Chhapra Grain Sourcing Agency',
        companyName: 'Chhapra Agricultural Wholesale',
        gstin: '10AAACS8931M2Z1',
        phone: '+91 9988112233',
        email: 'sourcing@chhapragrain.com',
        billingAddress: 'Mandi Road, Chhapra, Saran, Bihar',
        shippingAddress: 'Mandi Road, Chhapra, Saran, Bihar',
        paymentTerms: 'Net 15',
        openingBalance: 0,
        balance: 0
      });
      await sup1.save();

      const farmer1 = new Farmer({
        farmerCode: 'FRM-3001',
        name: 'Ramesh Singh (Mokama)',
        phone: '+91 9431020304',
        village: 'Mokama Diara',
        district: 'Patna',
        state: 'Bihar',
        farmSizeAcres: 12,
        soilType: 'Alluvial Clay',
        bankName: 'State Bank of India',
        bankAccountNo: '30489201932',
        bankIfsc: 'SBIN0001053',
        openingBalance: 0,
        balance: 0
      });
      await farmer1.save();

      // Seed Logistics Fleet
      const truck1 = new Vehicle({
        registrationNo: 'BR-01-GB-1234',
        type: 'Tata 1613 Multi-axle Truck',
        capacityMT: 16,
        owner: 'Mithila Transports',
        status: 'Available'
      });
      await truck1.save();

      const driver1 = new Driver({
        name: 'Satish Yadav',
        phone: '+91 8877665544',
        licenseNo: 'DL-10202611989',
        status: 'Active'
      });
      await driver1.save();

      // Seed CRM rules
      const rule1 = new CrmAutomationRule({
        name: 'Quotation Follow-up Rule',
        trigger: 'quotation_sent',
        conditions: { total: { $gt: 500000 } },
        actions: [{
          type: 'create_task',
          details: {
            taskType: 'Call',
            notes: 'Quotation sent over 2 days ago. Follow up with client regarding price approvals.',
            daysOffset: 2,
            priority: 'High'
          }
        }],
        isActive: true
      });
      await rule1.save();

      const rule2 = new CrmAutomationRule({
        name: 'High-Value Invoice Alert Rule',
        trigger: 'quotation_created',
        conditions: { total: { $gt: 1000000 } },
        actions: [{
          type: 'notify_manager',
          details: { notes: 'High-value quotation created. Super Admin approval requested.' }
        }],
        isActive: true
      });
      await rule2.save();

      // Seed Transactional Data
      const po1 = new PurchaseOrder({
        poNo: 'PO/BR/2026-27/001',
        date: new Date('2026-08-02'),
        partyType: 'supplier',
        partyId: sup1._id,
        commodityId: wheat._id,
        quantity: 100,
        rate: 22000,
        transportCost: 15000,
        otherCharges: 5000,
        gstPercent: 5,
        total: 2315000,
        warehouseId: whPatna._id,
        expectedDelivery: new Date('2026-08-15'),
        status: 'Approved',
        createdBy: 'admin@brijrani.com'
      });
      await po1.save();

      // Seed a Sales Order first
      const so1 = new SalesOrder({
        soNo: 'SO/BR/2026-27/001',
        date: new Date('2026-08-03'),
        customerId: cust1._id,
        commodityId: wheat._id,
        quantity: 20,
        rate: 27500,
        total: 550000,
        warehouseId: whPatna._id,
        deliveryAddress: 'Fatuha Industrial Estate, Patna, Bihar, 803201',
        status: 'Completed',
        createdBy: 'admin@brijrani.com'
      });
      await so1.save();

      // Seed a Sales Invoice linked to the Sales Order
      const inv1 = new SalesInvoice({
        invoiceNo: 'INV/BR/2026-27/001',
        soId: so1._id,
        invoiceDate: new Date('2026-08-04'),
        customerId: cust1._id,
        items: [{
          commodityId: wheat._id,
          hsn: '10019910',
          quantity: 20,
          rate: 27500,
          discount: 0,
          taxableAmount: 550000,
          cgst: 13750,
          sgst: 13750,
          igst: 0,
          total: 577500
        }],
        taxableAmount: 550000,
        cgst: 13750,
        sgst: 13750,
        igst: 0,
        freightCost: 0,
        otherCharges: 0,
        grandTotal: 577500,
        dueDate: new Date('2026-09-04'),
        placeOfSupply: 'Bihar',
        paymentStatus: 'Paid',
        createdBy: 'admin@brijrani.com'
      });
      await inv1.save();

      const v1 = new Voucher({
        voucherNumber: 'EXP/2026-27/001',
        date: new Date('2026-08-05'),
        voucherType: 'Expense',
        partyType: 'other',
        amount: 45000,
        paymentMode: 'Bank Transfer',
        reference: 'TXN-8293029',
        narration: 'Monthly rental for grain silo structures',
        status: 'Approved',
        createdBy: 'admin@brijrani.com'
      });
      await v1.save();

      const v2 = new Voucher({
        voucherNumber: 'EXP/2026-27/002',
        date: new Date('2026-08-08'),
        voucherType: 'Expense',
        partyType: 'other',
        amount: 18500,
        paymentMode: 'Cash',
        reference: 'CASH-9921',
        narration: 'Wages for truck loading and unloading helpers',
        status: 'Approved',
        createdBy: 'admin@brijrani.com'
      });
      await v2.save();

      sendSuccess(res, 'Database seeded successfully with all transactional records!', null);
    } catch (err) {
      next(err);
    }
  }
};
