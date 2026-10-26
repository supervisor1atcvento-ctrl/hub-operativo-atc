import { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const limitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, limit: number, windowMs = 60000): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = limitStore.get(key);

  if (!record || record.resetAt < now) {
    limitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000)
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000)
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000)
  };
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = db.getConfig();
  const maxRequests = config.maxRequestsPerMinute || 60;
  const clientKey = req.user?.id || req.ip || 'anonymous';

  const result = checkRateLimit(clientKey, maxRequests, 60000);

  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetInSeconds.toString());

  if (!result.allowed) {
    db.addAuditLog({
      userId: req.user?.id || 'anonymous',
      username: req.user?.username || 'desconocido',
      action: 'RATE_LIMIT_EXCEEDED',
      status: 'RATE_LIMITED',
      ip: req.ip || '127.0.0.1',
      details: `Límite de solicitudes alcanzado (${maxRequests} req/min).`
    });

    res.status(429).json({
      error: 'Ha excedido el límite de solicitudes permitidas. Por favor intente más tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: result.resetInSeconds
    });
    return;
  }

  next();
}
