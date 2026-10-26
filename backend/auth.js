const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'roshd_secure_educational_platform_jwt_secret_key_2026';
const COOKIE_NAME = 'roshd_session';

// Compare password with support for automatic migration from legacy plaintext
function verifyAndMigratePassword(inputPassword, storedPassword, onMigrate) {
  if (!inputPassword || !storedPassword) return false;

  // If already hashed with bcrypt ($2a$ or $2b$)
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    return bcrypt.compareSync(inputPassword, storedPassword);
  }

  // Legacy plaintext match
  if (inputPassword === storedPassword) {
    if (typeof onMigrate === 'function') {
      const newHash = bcrypt.hashSync(inputPassword, 10);
      onMigrate(newHash);
    }
    return true;
  }

  return false;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      national_id: user.national_id,
      role: user.role,
      full_name: user.full_name,
      grade: user.grade,
      class_name: user.class_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd, // true in production HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax'
  });
}

// Extract authenticated user from Cookie or Authorization header
function authMiddleware(req, res, next) {
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
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
}

// Guard: Must be authenticated
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'احراز هویت الزامی است. لطفاً وارد حساب خود شوید.' });
  }
  next();
}

// Guard: Must have one of the required roles
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'احراز هویت الزامی است.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'شما دسترسی لازم برای این عملیات را ندارید.' });
    }
    next();
  };
}

// Sanitize user object to prevent password disclosure
function sanitizeUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  return copy;
}

module.exports = {
  verifyAndMigratePassword,
  hashPassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  authMiddleware,
  requireAuth,
  requireRole,
  sanitizeUser,
  COOKIE_NAME
};
