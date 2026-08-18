import { Request, Response, NextFunction } from 'express';
import { getRedisConnection } from '../config/redis';

const cache = new Map<string, { status: number; body: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

// Cleanup memory cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (now - val.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000);

export const idempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = req.headers['idempotency-key'] as string;
  if (!key) {
    return next();
  }

  // Check memory cache first
  const cached = cache.get(key);
  if (cached) {
    res.status(cached.status).json(cached.body);
    return;
  }

  // Intercept response to store it
  const originalJson = res.json;
  res.json = function (body: any) {
    cache.set(key, {
      status: res.statusCode,
      body,
      timestamp: Date.now()
    });
    return originalJson.call(this, body);
  };

  next();
};
