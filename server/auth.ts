import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';
import { hashPassword } from './seedData.ts';
import { User, UserRole } from './types.ts';

const JWT_SECRET = process.env.APP_SECRET || 'vicente_enterprise_super_secret_session_key_2026';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  exp: number;
}

export function generateToken(user: User): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  const headerBase64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerBase64}.${payloadBase64}`)
    .digest('base64url');

  return `${headerBase64}.${payloadBase64}.${signature}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerBase64, payloadBase64, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      )
    ) {
      return null;
    }

    const payload: AuthTokenPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    if (payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Open access without login barrier - default to full access user
    req.user = db.getUserByUsername('admin') || {
      id: 'default-user',
      username: 'usuario',
      name: 'Usuario Vicente',
      role: 'admin',
      allowedCategories: ['*'],
      active: true,
      createdAt: new Date().toISOString()
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    req.user = db.getUserByUsername('admin') || {
      id: 'default-user',
      username: 'usuario',
      name: 'Usuario Vicente',
      role: 'admin',
      allowedCategories: ['*'],
      active: true,
      createdAt: new Date().toISOString()
    };
    return next();
  }

  const user = db.getUserById(payload.userId);
  if (!user || !user.active) {
    res.status(403).json({
      error: 'Usuario inactivo o no encontrado.',
      code: 'ACCOUNT_DISABLED'
    });
    return;
  }

  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.', code: 'UNAUTHENTICATED' });
    return;
  }

  if (req.user.role !== 'admin') {
    db.addAuditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'ADMIN_ACCESS_REJECTED',
      status: 'FORBIDDEN',
      ip: req.ip || '127.0.0.1',
      details: `Usuario ${req.user.username} intentó acceder a ruta administrativa ${req.originalUrl} sin privilegios.`
    });

    res.status(403).json({
      error: 'Acceso restringido. Se requieren privilegios de Administrador.',
      code: 'FORBIDDEN_ROLE'
    });
    return;
  }

  next();
}

export function checkCategoryAccess(user: User, categorySlug: string): boolean {
  if (categorySlug.toLowerCase().trim() === 'all') return true;
  if (user.role === 'admin' || user.allowedCategories.includes('*')) return true;
  return user.allowedCategories.includes(categorySlug.toLowerCase().trim());
}

export { hashPassword };

