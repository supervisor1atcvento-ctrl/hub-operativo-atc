import { Router } from 'express';
import { authenticate, generateToken, hashPassword } from '../auth.ts';
import { db } from '../db.ts';

const router = Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({
      error: 'Debe ingresar nombre de usuario y contraseña válidos.',
      code: 'INVALID_CREDENTIALS_FORMAT'
    });
    return;
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    db.addAuditLog({
      userId: 'anonymous',
      username: username.slice(0, 30),
      action: 'LOGIN_FAILED',
      status: 'FORBIDDEN',
      ip: req.ip || '127.0.0.1',
      details: 'Intento de inicio de sesión con usuario inexistente.'
    });

    res.status(401).json({
      error: 'Credenciales inválidas. Verifique su usuario y contraseña.',
      code: 'INVALID_CREDENTIALS'
    });
    return;
  }

  if (!user.active) {
    db.addAuditLog({
      userId: user.id,
      username: user.username,
      action: 'LOGIN_BLOCKED_INACTIVE',
      status: 'FORBIDDEN',
      ip: req.ip || '127.0.0.1',
      details: 'Intento de inicio de sesión de usuario inactivo.'
    });

    res.status(403).json({
      error: 'Esta cuenta ha sido desactivada por un administrador.',
      code: 'ACCOUNT_INACTIVE'
    });
    return;
  }

  const enteredHash = hashPassword(password);
  if (user.passwordHash !== enteredHash) {
    db.addAuditLog({
      userId: user.id,
      username: user.username,
      action: 'LOGIN_FAILED_PASSWORD',
      status: 'FORBIDDEN',
      ip: req.ip || '127.0.0.1',
      details: 'Contraseña incorrecta ingresada.'
    });

    res.status(401).json({
      error: 'Credenciales inválidas. Verifique su usuario y contraseña.',
      code: 'INVALID_CREDENTIALS'
    });
    return;
  }

  const token = generateToken(user);

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    action: 'LOGIN_SUCCESS',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Inicio de sesión exitoso. Rol: ${user.role}`
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      allowedCategories: user.allowedCategories
    }
  });
});

// Current user profile
router.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  res.json({
    id: req.user.id,
    username: req.user.username,
    name: req.user.name,
    role: req.user.role,
    allowedCategories: req.user.allowedCategories
  });
});

// Quick demo users list for easy evaluation in UI
router.get('/demo-accounts', (_req, res) => {
  const users = db.listUsers();
  res.json(users);
});

export default router;
