import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './errorHandler';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
    companyId?: string;
    branchId?: string;
  };
}

const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_token_secret_key_secure_xyz_123';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Local development bypass
  req.user = {
    id: 'mock-user-id',
    role: 'Super Admin',
    permissions: []
  };
  return next();
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('Unauthorized access', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new CustomError('Access denied: insufficient permissions', 403));
    }
    next();
  };
};

export const checkPermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('Unauthorized access', 401));
    }
    
    // Super Admin bypasses all checks
    if (req.user.role === 'Super Admin') {
      return next();
    }

    const hasPermission = req.user.permissions.includes(requiredPermission);
    if (!hasPermission) {
      return next(new CustomError(`Permission denied: requires ${requiredPermission}`, 403));
    }
    next();
  };
};
