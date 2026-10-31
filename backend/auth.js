const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. Load .env if present
function loadEnv() {
  const paths = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.trim().length < 32) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing or shorter than 32 characters. Server will not start without a secure secret key.');
}

const COOKIE_NAME = 'roshd_session';

// Asynchronous password hashing and verification
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(inputPassword, storedHash) {
  if (!inputPassword || !storedHash) return false;
  // Strictly enforce bcrypt hash format ($2a$ or $2b$) - no legacy plaintext allowed
  if (!storedHash.startsWith('$2a$') && !storedHash.startsWith('$2b$') && !storedHash.startsWith('$2y$')) {
    return false;
  }
  const match = await bcrypt.compare(inputPassword, storedHash);
  if (match) return true;

  return false;
}

// Token generation with 12h lifetime and token_version
function generateToken(user, extraClaims = {}) {
  return jwt.sign(
    {
      id: user.id,
      national_id: user.national_id,
      token_version: user.token_version || 1,
      ...extraClaims
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 hours
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax'
  });
}

// Short-lived in-memory cache for user database state (2 seconds) to avoid per-request query spam
const userDbCache = new Map();

function invalidateUserCache(userId) {
  userDbCache.delete(Number(userId));
}

function getCachedUser(db, userId) {
  const id = Number(userId);
  const now = Date.now();
  const cached = userDbCache.get(id);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const user = db.prepare(`
    SELECT id, role, national_id, phone, full_name, first_name, last_name,
           grade, class_name, is_locked, fee_status,
           must_change_password, token_version, is_active
    FROM users 
    WHERE id = ?
  `).get(id);

  if (user) {
    userDbCache.set(id, { user, expiresAt: now + 2000 });
  }
  return user;
}

// Authentication Middleware with DB verification of role, active status & token_version
function createAuthMiddleware(db) {
  return (req, res, next) => {
    let token = null;

    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const dbUser = getCachedUser(db, decoded.id);

      if (!dbUser) {
        req.user = null;
        return next();
      }

      // Check if user is deactivated
      if (dbUser.is_active === 0) {
        clearAuthCookie(res);
        req.user = null;
        return res.status(401).json({ error: 'حساب کاربری شما غیرفعال شده است. با مدیر تماس بگیرید.' });
      }

      // Check if token_version was bumped (e.g. logout or password change)
      if (Number(decoded.token_version) !== Number(dbUser.token_version)) {
        clearAuthCookie(res);
        req.user = null;
        return res.status(401).json({ error: 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.' });
      }

      // User state populated directly from live DB record (not stale token payload)
      req.user = {
        id: dbUser.id,
        national_id: dbUser.national_id,
        phone: dbUser.phone,
        role: dbUser.role,
        full_name: dbUser.full_name,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        grade: dbUser.grade,
        class_name: dbUser.class_name,
        is_locked: dbUser.is_locked,
        fee_status: dbUser.fee_status,
        must_change_password: dbUser.must_change_password,
        token_version: dbUser.token_version
      };

      if (decoded.admin_id) {
        req.admin_id = Number(decoded.admin_id);
        req.user.admin_id = Number(decoded.admin_id);
        req.user.is_impersonated = true;
      }
    } catch (err) {
      req.user = null;
    }
    next();
  };
}

// Guard: Enforce password change if must_change_password is 1
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'احراز هویت الزامی است. لطفاً وارد حساب خود شوید.' });
  }

  // If password change is required, block all non-password change endpoints
  if (req.user.must_change_password === 1) {
    const allowedPaths = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/me'];
    if (!allowedPaths.includes(req.path)) {
      return res.status(403).json({
        error: 'تغییر رمز عبور در اولین ورود الزامی است.',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }
  }

  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'احراز هویت الزامی است.' });
    }
    if (req.user.must_change_password === 1) {
      return res.status(403).json({
        error: 'تغییر رمز عبور در اولین ورود الزامی است.',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'شما دسترسی لازم برای این عملیات را ندارید.' });
    }
    next();
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  delete copy.password_hash;
  return copy;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  createAuthMiddleware,
  invalidateUserCache,
  requireAuth,
  requireRole,
  sanitizeUser,
  COOKIE_NAME
};

