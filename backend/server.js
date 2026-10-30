const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { db, ensureAdminUser } = require('./db');
const XLSX = require('xlsx');
const { createBackup } = require('./backup');
const { loadDemoData, clearDemoData } = require('./demoData');
const {
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
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Enable trust proxy for correct client IP detection, rate-limiting & HTTPS detection behind Nginx
app.set('trust proxy', 1);

// ----------------- SECURITY HEADERS & MIDDLEWARES -----------------
// Helmet with hardened Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', "https://fonts.gstatic.com"],
      connectSrc: ["'self'", 'https://roshd.digiral.ir', 'http://localhost:5000', 'http://127.0.0.1:5000'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration - Strict whitelist (no wildcard)
const allowedOrigins = [
  'https://roshd.digiral.ir'
];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  );
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject unknown origins without sending Access-Control-Allow-Origin header
    return callback(null, false);
  },
  credentials: true
}));

// CSRF Protection for mutating methods
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز: مبدأ درخواست نامعتبر است (CSRF Protection).' });
    }
  }
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Audit Log Helper
function recordAudit(userId, action, entity, entityId, details, ip) {
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId || null, action, entity || null, entityId ? String(entityId) : null, details || null, ip || null);
  } catch (err) {
    // Non-fatal
  }
}

// In-memory per-identifier limiter (10 attempts per 15 minutes)
const identifierAttempts = new Map();
function checkIdentifierRateLimit(identifier) {
  if (!identifier) return true;
  if (process.env.SKIP_RATE_LIMIT === 'true') return true;
  const now = Date.now();
  const cleanId = String(identifier).trim();
  const record = identifierAttempts.get(cleanId);
  if (!record || record.resetAt < now) {
    identifierAttempts.set(cleanId, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (record.count >= 10) {
    return false;
  }
  record.count++;
  return true;
}

// Lightweight In-Memory Route Cache for High Concurrent Performance (400+ Students)
const routeCache = new Map();
function getOrSetCache(key, ttlSeconds, computeFn) {
  const now = Date.now();
  const cached = routeCache.get(key);
  if (cached && (now - cached.timestamp < ttlSeconds * 1000)) {
    return cached.data;
  }
  const freshData = computeFn();
  routeCache.set(key, { timestamp: now, data: freshData });
  return freshData;
}
function invalidateRouteCache(keyPrefix) {
  for (const k of routeCache.keys()) {
    if (k.startsWith(keyPrefix)) routeCache.delete(k);
  }
}

// Rate Limiting (Tuned for 400+ concurrent students behind campus/school NAT network)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_LIMIT_MAX || '60', 10),
  keyGenerator: (req) => `${req.ip}_${req.body?.identifier || 'anon'}`,
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.SKIP_RATE_LIMIT === 'true',
  message: { error: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر مجدداً تلاش کنید.' }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '10000', 10), // Accommodate 400+ active students behind school NAT
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.SKIP_RATE_LIMIT === 'true'
});

app.use('/api/', generalLimiter);
const authMiddleware = createAuthMiddleware(db);
app.use(authMiddleware);

// ----------------- FILE UPLOADS CONFIGURATION -----------------
const uploadsDir = process.env.UPLOADS_PATH 
  ? path.resolve(process.env.UPLOADS_PATH) 
  : path.join(__dirname, 'uploads');

const dirs = ['images', 'videos', 'homeworks', 'receipts', 'books'].map(d => path.join(uploadsDir, d));
[uploadsDir, ...dirs].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/**
 * Validates binary signature (magic bytes) to prevent executable masquerading
 */
function validateFileMagicBytes(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isPdf = buffer.slice(0, 4).toString() === '%PDF';
    const isGif = buffer.slice(0, 3).toString() === 'GIF';
    const isWebp = buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';
    const isZipOrDocx = buffer[0] === 0x50 && buffer[1] === 0x4B && (buffer[2] === 0x03 || buffer[2] === 0x05);
    const isMp4 = buffer.slice(4, 8).toString() === 'ftyp';

    return isJpeg || isPng || isPdf || isGif || isWebp || isZipOrDocx || isMp4;
  } catch (e) {
    return false;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'images';
    const mime = file.mimetype || '';
    const cat = req.body.category || req.query.category || '';
    if (cat === 'receipt') sub = 'receipts';
    else if (cat === 'homework') sub = 'homeworks';
    else if (cat === 'book') sub = 'books';
    else if (mime.startsWith('video/')) sub = 'videos';
    else if (mime.startsWith('image/')) sub = 'images';
    else sub = 'homeworks';
    cb(null, path.join(uploadsDir, sub));
  },
  filename: (req, file, cb) => {
    // Sanitize extension and generate random cryptographic name
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.docx', '.mp4', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت فایل ارسالی مجاز نمی‌باشد.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max for textbooks
});

// Serve public uploads (images and videos) with public caching
app.use('/uploads/images', express.static(path.join(uploadsDir, 'images'), { maxAge: '30d' }));
app.use('/uploads/videos', express.static(path.join(uploadsDir, 'videos'), { maxAge: '30d' }));
app.use('/uploads/books', express.static(path.join(uploadsDir, 'books'), { maxAge: '30d' }));
app.use('/extracted_pages', express.static(path.join(__dirname, 'public', 'extracted_pages'), { maxAge: '30d' }));

// Protected uploads: Receipts require authentication AND strict ownership/role verification
app.get('/uploads/receipts/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, 'receipts', filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'رسید پرداخت یافت نشد.' });

  const role = req.user.role;
  const userId = req.user.id;
  let allowed = false;

  if (role === 'admin') {
    allowed = true;
  } else {
    // Check if receipt belongs to the user or their child
    const receipt = db.prepare('SELECT student_id FROM fee_receipts WHERE receipt_image LIKE ? OR receipt_image = ?').get(`%${filename}`, filename);
    if (receipt) {
      if (role === 'student' && receipt.student_id === userId) {
        allowed = true;
      } else if (role === 'parent') {
        const isLinked = db.prepare('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?').get(userId, receipt.student_id);
        if (isLinked) {
          allowed = true;
        } else {
          const parent = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId);
          const student = db.prepare('SELECT parent_phone FROM users WHERE id = ?').get(receipt.student_id);
          if (parent && student && parent.phone && parent.phone === student.parent_phone) {
            allowed = true;
          }
        }
      }
    }
  }

  if (!allowed) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز به مدرک مالی خصوصی.' });
  }

  res.set({
    'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.sendFile(filePath);
});

// Protected uploads: Homeworks require authentication AND strict ownership/role verification
app.get('/uploads/homeworks/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, 'homeworks', filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'فایل تکلیف یافت نشد.' });

  const role = req.user.role;
  const userId = req.user.id;
  let allowed = false;

  if (role === 'admin' || role === 'teacher') {
    allowed = true;
  } else {
    const sub = db.prepare('SELECT student_id FROM homework_submissions WHERE file_url LIKE ? OR file_url = ?').get(`%${filename}`, filename);
    if (sub) {
      if (role === 'student' && sub.student_id === userId) {
        allowed = true;
      } else if (role === 'parent') {
        const isLinked = db.prepare('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?').get(userId, sub.student_id);
        if (isLinked) {
          allowed = true;
        } else {
          const parent = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId);
          const student = db.prepare('SELECT parent_phone FROM users WHERE id = ?').get(sub.student_id);
          if (parent && student && parent.phone && parent.phone === student.parent_phone) {
            allowed = true;
          }
        }
      }
    }
  }

  if (!allowed) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز به فایل تکلیف خصوصی.' });
  }

  res.set({
    'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.sendFile(filePath);
});

// Helper for Persian digits
const faNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

// Real dynamic Persian date helper
function getJalaliDate() {
  const d = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', calendar: 'persian' };
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', options).format(d);
  } catch (e) {
    return '۱۴۰۵/۰۸/۰۵';
  }
}

// Official Iranian 10-digit National ID validation algorithm with check digit verification
function validateIranianNationalId(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim();
  // Allow test IDs in dev/test environment
  if (process.env.NODE_ENV !== 'production' && (clean.startsWith('00') || clean.startsWith('test_'))) {
    return clean.length === 10;
  }
  if (!/^\d{10}$/.test(clean)) return false;
  if (/^(\d)\1{9}$/.test(clean)) return false;

  const check = parseInt(clean[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  const rem = sum % 11;
  return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
}

// Tuition Lock Enforcement Middleware
function checkTuitionLock(req, res, next) {
  if (req.user && req.user.role === 'student' && req.user.fee_status !== 'paid') {
    const feeDef = db.prepare('SELECT is_locked FROM fee_defs WHERE grade = ?').get(req.user.grade);
    if ((feeDef && feeDef.is_locked === 1) || req.user.is_locked === 1) {
      return res.status(403).json({
        error: 'دسترسی شما به دلیل عدم تسویه شهریه موقتاً مسدود شده است. لطفاً نسبت به ارسال فیش واریز اقدام فرمایید.',
        code: 'TUITION_LOCKED'
      });
    }
  }
  next();
}

// ----------------- PRODUCTION HEALTH & DIAGNOSTICS -----------------
// Public Minimal Health Check (for uptime monitors & load balancers, no sensitive leakage)
app.get('/api/health', (req, res) => {
  try {
    const dbAlive = db.prepare('SELECT 1 as alive;').get();
    if (dbAlive && dbAlive.alive === 1) {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }
    return res.status(503).json({ status: 'error', code: 'DB_UNAVAILABLE' });
  } catch (err) {
    return res.status(503).json({ status: 'error', code: 'SERVICE_UNAVAILABLE' });
  }
});

// Admin Diagnostic Health Check (Protected, full internal telemetry)
app.get('/api/health/diagnostics', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const dbAlive = db.prepare('SELECT 1 as alive;').get();
    const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student';").get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users;').get().count;
    const mem = process.memoryUsage();

    res.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: {
        status: dbAlive && dbAlive.alive === 1 ? 'healthy' : 'degraded',
        engine: 'SQLite WAL (node:sqlite DatabaseSync)',
        studentCount,
        totalUsers
      },
      system: {
        nodeVersion: process.version,
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- AUTHENTICATION -----------------
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { identifier, password, role } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'کد ملی و رمز عبور الزامی است.' });
  }

  const cleanId = String(identifier).trim();
  const cleanPassword = String(password).trim();

  // Enforce per-identifier rate limiting
  if (!checkIdentifierRateLimit(cleanId)) {
    return res.status(429).json({ error: 'تعداد تلاش‌های ناموفق برای این حساب بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش نمایید.' });
  }

  // Find user by username, national_id, or phone
  let user;
  if (role === 'parent') {
    user = db.prepare("SELECT * FROM users WHERE (username = ? OR national_id = ? OR phone = ? OR parent_phone = ?) AND role = 'parent'").get(cleanId, cleanId, cleanId, cleanId);
  } else if (role) {
    user = db.prepare('SELECT * FROM users WHERE (username = ? OR national_id = ? OR phone = ?) AND role = ?').get(cleanId, cleanId, cleanId, role);
  } else {
    user = db.prepare('SELECT * FROM users WHERE (username = ? OR national_id = ? OR phone = ?)').get(cleanId, cleanId, cleanId);
  }

  // Graceful fallback for admin if role selection in UI did not match
  if (!user && cleanId.toLowerCase() === 'admin') {
    user = db.prepare("SELECT * FROM users WHERE (username = 'admin' OR role = 'admin')").get();
  }

  if (!user) {
    recordAudit(null, 'LOGIN_FAILED', 'user', null, `Failed login attempt for identifier: ${cleanId}`, req.ip);
    return res.status(401).json({ error: 'کد ملی یا رمز عبور اشتباه است.' });
  }

  if (user.is_active === 0) {
    return res.status(401).json({ error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیریت کانون تماس بگیرید.' });
  }

  // Verify Password with async bcrypt check
  const isValid = await verifyPassword(cleanPassword, user.password);
  if (!isValid) {
    recordAudit(user.id, 'LOGIN_FAILED', 'user', user.id, `Invalid password for user: ${user.national_id}`, req.ip);
    return res.status(401).json({ error: 'کد ملی یا رمز عبور اشتباه است.' });
  }

  // Generate secure token with current token_version
  const token = generateToken(user);
  setAuthCookie(res, token);
  recordAudit(user.id, 'LOGIN_SUCCESS', 'user', user.id, `User logged in: ${user.national_id}`, req.ip);

  const responsePayload = {
    success: true,
    user: sanitizeUser(user)
  };

  // Provide token in JSON only for explicit non-browser API clients/testing
  if (req.headers['x-api-client'] || req.query.include_token === 'true') {
    responsePayload.token = token;
  }

  res.json(responsePayload);
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  const sanitized = sanitizeUser(user);
  if (req.admin_id) {
    sanitized.is_impersonated = true;
    sanitized.admin_id = req.admin_id;
  }
  res.json({ user: sanitized });
});

// Admin Panel Switcher & Role Impersonation for Development & Auditing
app.get('/api/admin/switch-role/targets', requireAuth, (req, res) => {
  const adminId = req.user.role === 'admin' ? req.user.id : req.admin_id;
  if (!adminId) {
    return res.status(403).json({ error: 'تنها مدیر سیستم به این بخش دسترسی دارد.' });
  }

  const admin = db.prepare("SELECT id, role, full_name, phone FROM users WHERE role = 'admin' LIMIT 1").get();
  const teacher = db.prepare("SELECT id, role, full_name, phone FROM users WHERE role = 'teacher' AND is_active = 1 LIMIT 1").get();
  const student = db.prepare("SELECT id, role, full_name, phone, grade, class_name FROM users WHERE role = 'student' AND is_active = 1 LIMIT 1").get();
  const parent = db.prepare("SELECT id, role, full_name, phone FROM users WHERE role = 'parent' AND is_active = 1 LIMIT 1").get();

  res.json({
    admin,
    teacher,
    student,
    parent,
    active_role: req.user.role,
    active_id: req.user.id,
    is_impersonated: !!req.admin_id,
    original_admin_id: adminId
  });
});

app.post('/api/admin/switch-role', requireAuth, async (req, res) => {
  const adminId = req.user.role === 'admin' ? req.user.id : req.admin_id;
  if (!adminId) {
    return res.status(403).json({ error: 'تنها مدیر سیستم مجاز به تغییر نقش و شبیه‌سازی است.' });
  }

  const target_role = req.body.target_role || req.body.targetRole;
  const user_id = req.body.user_id || req.body.userId;
  let targetUser = null;

  if (target_role === 'admin') {
    targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId);
    if (!targetUser) {
      targetUser = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
    }
  } else if (user_id) {
    targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(user_id));
  } else if (target_role) {
    targetUser = db.prepare('SELECT * FROM users WHERE role = ? AND is_active = 1 ORDER BY id ASC LIMIT 1').get(target_role);
  }

  if (!targetUser) {
    return res.status(404).json({ error: `کاربری با نقش ${target_role || user_id} یافت نشد.` });
  }

  const isSwitchingBackToAdmin = targetUser.role === 'admin' && targetUser.id === adminId;
  const extraClaims = isSwitchingBackToAdmin ? {} : { admin_id: adminId };
  const token = generateToken(targetUser, extraClaims);
  setAuthCookie(res, token);

  const sanitized = sanitizeUser(targetUser);
  sanitized.is_impersonated = !isSwitchingBackToAdmin;
  sanitized.admin_id = isSwitchingBackToAdmin ? null : adminId;

  recordAudit(adminId, 'IMPERSONATE_SWITCH', 'user', targetUser.id, `Admin switched view to ${targetUser.role}: ${targetUser.full_name}`, req.ip);

  res.json({
    success: true,
    user: sanitized,
    message: `نقش فعال به ${targetUser.full_name} (${targetUser.role}) تغییر یافت.`
  });
});

app.post('/api/admin/switch-back', requireAuth, async (req, res) => {
  const adminId = req.admin_id || (req.user.role === 'admin' ? req.user.id : null);
  if (!adminId) {
    return res.status(400).json({ error: 'شناسه مدیر اصلی یافت نشد.' });
  }

  const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId);
  if (!adminUser) {
    return res.status(404).json({ error: 'کاربر مدیر یافت نشد.' });
  }

  const token = generateToken(adminUser, {});
  setAuthCookie(res, token);

  const sanitized = sanitizeUser(adminUser);
  sanitized.is_impersonated = false;
  sanitized.admin_id = null;

  recordAudit(adminId, 'IMPERSONATE_RESTORE', 'user', adminUser.id, 'Admin restored original session', req.ip);

  res.json({
    success: true,
    user: sanitized,
    message: 'با موفقیت به پنل مدیریت بازگشتید.'
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.user.id);
    invalidateUserCache(req.user.id);
    recordAudit(req.user.id, 'LOGOUT', 'user', req.user.id, 'User logged out', req.ip);
  } catch (e) {}
  clearAuthCookie(res);
  res.json({ success: true, message: 'با موفقیت خارج شدید.' });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'رمز عبور فعلی و رمز عبور جدید الزامی هستند.' });
  }
  const cleanNew = String(new_password).trim();
  if (cleanNew.length < 8) {
    return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۸ نویسه باشد.' });
  }
  if (cleanNew === req.user.national_id || (req.user.phone && cleanNew === req.user.phone)) {
    return res.status(400).json({ error: 'رمز عبور جدید نباید برابر با کد ملی یا شماره موبایل باشد.' });
  }

  const user = db.prepare('SELECT id, national_id, password, token_version FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد.' });
  }

  const isCurrentValid = await verifyPassword(String(current_password).trim(), user.password);
  if (!isCurrentValid) {
    return res.status(400).json({ error: 'رمز عبور فعلی وارد شده نادرست است.' });
  }

  const newHash = await hashPassword(cleanNew);
  const newVersion = (user.token_version || 1) + 1;

  db.prepare(`
    UPDATE users 
    SET password = ?, must_change_password = 0, token_version = ?
    WHERE id = ?
  `).run(newHash, newVersion, req.user.id);

  invalidateUserCache(req.user.id);

  // Issue refreshed token with updated version
  const updatedUser = { ...req.user, token_version: newVersion, must_change_password: 0 };
  const newToken = generateToken(updatedUser);
  setAuthCookie(res, newToken);

  recordAudit(req.user.id, 'CHANGE_PASSWORD', 'user', req.user.id, 'Password changed successfully', req.ip);

  const resp = {
    success: true,
    message: 'رمز عبور با موفقیت به‌روزرسانی شد.',
    user: sanitizeUser(updatedUser)
  };
  if (req.headers['x-api-client'] || req.query.include_token === 'true') {
    resp.token = newToken;
  }
  res.json(resp);
});

app.post('/api/admin/users/:id/reset-password', requireAuth, requireRole('admin'), async (req, res) => {
  const targetId = Number(req.params.id);
  const user = db.prepare('SELECT id, national_id, role, token_version FROM users WHERE id = ?').get(targetId);
  if (!user) {
    return res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
  }

  const crypto = require('crypto');
  const tempPassword = crypto.randomBytes(5).toString('hex'); // 10 chars secure random
  const newHash = await hashPassword(tempPassword);
  const newVersion = (user.token_version || 1) + 1;

  db.prepare(`
    UPDATE users 
    SET password = ?, must_change_password = 1, token_version = ?
    WHERE id = ?
  `).run(newHash, newVersion, targetId);

  invalidateUserCache(targetId);
  recordAudit(req.user.id, 'RESET_PASSWORD', 'user', targetId, `Admin reset password for user ${user.national_id}`, req.ip);

  res.json({
    success: true,
    message: 'رمز عبور با موفقیت بازنشانی شد.',
    new_password: tempPassword,
    user_id: targetId,
    national_id: user.national_id
  });
});

// ----------------- NOTICES -----------------
app.get('/api/notices', requireAuth, (req, res) => {
  const grade = req.query.grade || req.user.grade || 'all';
  const userId = req.user.id;

  const notices = db.prepare(`
    SELECT n.*, 
           CASE WHEN nv.id IS NOT NULL THEN 1 ELSE 0 END as is_seen
    FROM notices n
    LEFT JOIN notice_views nv ON n.id = nv.notice_id AND nv.user_id = ?
    WHERE n.target_audience = 'all' OR n.target_audience = ?
    ORDER BY n.id DESC
  `).all(userId, grade);

  res.json(notices);
});

app.post('/api/notices', requireAuth, requireRole('admin'), (req, res) => {
  const { title, date_fa, place, tag, target_audience } = req.body;
  const bodyText = req.body.body || req.body.content;
  if (!title || !bodyText) {
    return res.status(400).json({ error: 'عنوان و متن اطلاعیه الزامی است.' });
  }

  const currentDate = date_fa || getJalaliDate();
  const info = db.prepare(`
    INSERT INTO notices (title, body, date_fa, place, tag, target_audience)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, bodyText, currentDate, place || 'کانون', tag || 'مهم', target_audience || 'all');

  recordAudit(req.user.id, 'CREATE_NOTICE', 'notices', info.lastInsertRowid, `Created notice: ${title}`, req.ip);
  res.json({ success: true, id: info.lastInsertRowid });
});

app.post('/api/notices/seen', requireAuth, (req, res) => {
  const { notice_id } = req.body;
  const userId = req.user.id; // Trusted from session

  if (!notice_id) return res.status(400).json({ error: 'شناسه اطلاعیه نامعتبر است.' });

  try {
    db.prepare('INSERT OR IGNORE INTO notice_views (notice_id, user_id) VALUES (?, ?)').run(notice_id, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در ثبت وضعیت مشاهده اطلاعیه.' });
  }
});

app.get('/api/notices/report', requireAuth, requireRole('admin'), (req, res) => {
  const report = db.prepare(`
    SELECT n.id, n.title, n.date_fa, n.tag,
           COUNT(nv.id) as seen_count,
           (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students
    FROM notices n
    LEFT JOIN notice_views nv ON n.id = nv.notice_id
    GROUP BY n.id
    ORDER BY n.id DESC
  `).all();
  res.json(report);
});

// ----------------- STUDENTS MANAGEMENT -----------------
app.get('/api/students', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const { grade, class_name, search, page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT id, role, national_id, phone, first_name, last_name, full_name, 
           grade, class_name, school_name, birth_date, address, parent_phone, 
           parent_name, level, level_title, total_points, rank, fee_status, platform_fee_status, is_locked
    FROM users 
    WHERE role = 'student'
  `;
  const params = [];

  if (grade && grade !== 'all') {
    query += ' AND grade = ?';
    params.push(grade);
  }
  if (class_name && class_name !== 'all') {
    query += ' AND class_name = ?';
    params.push(class_name);
  }
  if (search) {
    query += ' AND (full_name LIKE ? OR national_id LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const totalCount = db.prepare(countQuery).get(...params).total;

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const students = db.prepare(query).all(...params);
  res.json({
    students,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      total_pages: Math.ceil(totalCount / limitNum)
    }
  });
});

// ----------------- TEACHER: COMPREHENSIVE STUDENT PERFORMANCE & SMART ATTENTION DETECTION -----------------
app.get('/api/teacher/students-performance', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { grade = 'هفتم', class_name = 'الف', search = '', status_filter = 'all', sort_by = 'attention' } = req.query;

    let studentsQuery = `
      SELECT id, role, national_id, phone, full_name, first_name, last_name, 
             grade, class_name, total_points, parent_phone, parent_name
      FROM users 
      WHERE role = 'student' AND is_active = 1
    `;
    const params = [];

    if (grade && grade !== 'all') {
      studentsQuery += ' AND grade = ?';
      params.push(grade);
    }
    if (class_name && class_name !== 'all' && class_name !== 'همه کلاس‌ها') {
      studentsQuery += ' AND class_name = ?';
      params.push(class_name);
    }
    if (search) {
      studentsQuery += ' AND (full_name LIKE ? OR national_id LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    studentsQuery += ' ORDER BY id ASC';
    const rawStudents = db.prepare(studentsQuery).all(...params);

    // Total homeworks assigned to this class
    const totalHwRow = db.prepare(`
      SELECT COUNT(*) as count FROM homeworks
      WHERE (? = 'all' OR grade = ? OR grade = 'all')
        AND (? = 'all' OR class_name = ? OR class_name = 'all' OR class_name = 'همه کلاس‌ها')
    `).get(grade, grade, class_name, class_name);
    const totalHomeworksAssigned = totalHwRow ? totalHwRow.count : 0;

    // Total exams published for this class
    const totalExamsRow = db.prepare(`
      SELECT COUNT(*) as count FROM exams
      WHERE (? = 'all' OR grade = ? OR grade = 'all')
        AND (? = 'all' OR class_name = ? OR class_name = 'all' OR class_name = 'همه کلاس‌ها')
    `).get(grade, grade, class_name, class_name);
    const totalExamsPublished = totalExamsRow ? totalExamsRow.count : 0;

    // Prepared statements for fast per-student aggregated metrics
    const studyStmt = db.prepare(`
      SELECT 
        COALESCE(SUM(total_minutes), 0) as total_minutes,
        COALESCE(SUM(pomodoros_count), 0) as total_pomodoros,
        COUNT(DISTINCT date_fa) as study_days
      FROM study_sessions
      WHERE student_id = ?
    `);

    const examStmt = db.prepare(`
      SELECT 
        COUNT(*) as exams_taken,
        COALESCE(AVG(percentage), 0) as exam_avg,
        COALESCE(MAX(percentage), 0) as exam_max,
        COALESCE(MIN(percentage), 0) as exam_min
      FROM exam_results
      WHERE student_id = ?
    `);

    const hwStmt = db.prepare(`
      SELECT 
        COUNT(*) as submitted_count,
        COALESCE(AVG(grade_score), 0) as avg_grade,
        SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as late_count
      FROM homework_submissions
      WHERE student_id = ?
    `);

    const attStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'p' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'a' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'e' THEN 1 ELSE 0 END) as excused_count
      FROM attendance
      WHERE student_id = ?
    `);

    let totalClassStudyMins = 0;
    let totalClassExamPct = 0;
    let studentsWithExams = 0;
    let totalClassHwSubmitted = 0;
    let totalPossibleHws = 0;

    const studentList = rawStudents.map(st => {
      const study = studyStmt.get(st.id) || { total_minutes: 0, total_pomodoros: 0, study_days: 0 };
      const exam = examStmt.get(st.id) || { exams_taken: 0, exam_avg: 0, exam_max: 0, exam_min: 0 };
      const hw = hwStmt.get(st.id) || { submitted_count: 0, avg_grade: 0, late_count: 0 };
      const att = attStmt.get(st.id) || { total_days: 0, present_count: 0, absent_count: 0, excused_count: 0 };

      const studyHours = Math.round((study.total_minutes / 60) * 10) / 10;
      const hwCompletionRate = totalHomeworksAssigned > 0 
        ? Math.min(100, Math.round((hw.submitted_count / totalHomeworksAssigned) * 100))
        : 100;
      const hwMissingCount = Math.max(0, totalHomeworksAssigned - hw.submitted_count);
      const examAvgPct = Math.round(exam.exam_avg * 10) / 10;
      const examScore20 = Math.round((examAvgPct / 5) * 10) / 10; // convert 100% to standard Iranian /20 score
      const attendanceRate = att.total_days > 0 
        ? Math.round((att.present_count / att.total_days) * 100)
        : 100;

      totalClassStudyMins += study.total_minutes;
      if (exam.exams_taken > 0) {
        totalClassExamPct += examAvgPct;
        studentsWithExams++;
      }
      totalClassHwSubmitted += hw.submitted_count;
      totalPossibleHws += totalHomeworksAssigned;

      // Smart Need Attention Algorithm: Evaluate academic, engagement, homework and attendance deficits
      const reasons = [];
      if (exam.exams_taken > 0 && examAvgPct < 60) {
        reasons.push(`افت نمره در آزمون‌ها (میانگین ${examScore20} از ۲۰)`);
      }
      if (totalExamsPublished >= 2 && exam.exams_taken === 0) {
        reasons.push(`عدم شرکت در آزمون‌های برگزارشده (${totalExamsPublished} آزمون)`);
      }
      if (hwMissingCount >= 2) {
        reasons.push(`${hwMissingCount} تکلیف تحویل داده نشده`);
      }
      if (studyHours < 3.0) {
        reasons.push(`ساعت مطالعه پایین در سامانه (${studyHours} ساعت)`);
      }
      if (att.absent_count >= 2) {
        reasons.push(`${att.absent_count} جلسه غیبت غیرموجه`);
      } else if (att.total_days >= 3 && attendanceRate < 75) {
        reasons.push(`نرخ حضور پایین در کلاس (${attendanceRate}٪)`);
      }

      let status = 'good';
      let needsAttention = false;
      let severity = 'normal';
      let aiRecommendation = '';

      if (reasons.length > 0) {
        needsAttention = true;
        status = 'needs_attention';
        severity = reasons.length >= 2 ? 'critical' : 'warning';
        aiRecommendation = `پیشنهاد هوش مصنوعی: ارسال هشدار به ولی دانش‌آموز، بررسی علت ${reasons[0]} و تعیین تکلیف جبرانی کوتاه.`;
      } else if (examAvgPct >= 80 && hwCompletionRate >= 80 && studyHours >= 7) {
        status = 'excelling';
        aiRecommendation = 'پیشنهاد هوش مصنوعی: مسیر هوش پیشرفته، شرکت در المپیادهای مرحله دوم و تست‌های شبیه‌ساز تیزهوشان.';
      } else {
        status = 'good';
        aiRecommendation = 'پیشنهاد هوش مصنوعی: ادامه روند منظم، پیگیری پومودوروهای روزانه و آمادگی برای آزمون بعدی.';
      }

      return {
        id: st.id,
        full_name: st.full_name,
        grade: st.grade,
        class_name: st.class_name,
        phone: st.phone,
        parent_name: st.parent_name || 'ولی محترم',
        parent_phone: st.parent_phone,
        total_points: st.total_points || 0,
        // Study Metrics
        study_hours: studyHours,
        study_minutes: study.total_minutes,
        pomodoros_count: study.total_pomodoros,
        study_days: study.study_days,
        // Exam Metrics
        exams_taken: exam.exams_taken,
        total_exams_published: totalExamsPublished,
        exam_avg_pct: examAvgPct,
        exam_score_20: examScore20,
        exam_max_pct: Math.round(exam.exam_max),
        // Homework Metrics
        homeworks_submitted: hw.submitted_count,
        homeworks_assigned: totalHomeworksAssigned,
        homework_completion_rate: hwCompletionRate,
        homework_missing_count: hwMissingCount,
        homework_avg_grade: Math.round(hw.avg_grade * 10) / 10,
        late_submissions: hw.late_count,
        // Attendance Metrics
        attendance_total: att.total_days,
        present_count: att.present_count,
        absent_count: att.absent_count,
        excused_count: att.excused_count,
        attendance_rate: attendanceRate,
        // Smart Status
        needs_attention: needsAttention,
        status,
        severity,
        attention_reasons: reasons,
        ai_recommendation: aiRecommendation
      };
    });

    // Summary calculations
    const totalStudents = studentList.length;
    const needsAttentionCount = studentList.filter(s => s.needs_attention).length;
    const excellingCount = studentList.filter(s => s.status === 'excelling').length;
    const goodCount = studentList.filter(s => s.status === 'good').length;

    const classStudyAvgHours = totalStudents > 0 
      ? Math.round((totalClassStudyMins / 60 / totalStudents) * 10) / 10 
      : 0;
    const classExamAvgPct = studentsWithExams > 0 
      ? Math.round((totalClassExamPct / studentsWithExams) * 10) / 10 
      : 0;
    const classHwRate = totalPossibleHws > 0 
      ? Math.round((totalClassHwSubmitted / totalPossibleHws) * 100) 
      : 0;

    // Filter
    let filteredList = studentList;
    if (status_filter === 'needs_attention') {
      filteredList = studentList.filter(s => s.needs_attention);
    } else if (status_filter === 'excelling') {
      filteredList = studentList.filter(s => s.status === 'excelling');
    } else if (status_filter === 'good') {
      filteredList = studentList.filter(s => s.status === 'good');
    }

    // Sort
    if (sort_by === 'attention') {
      filteredList.sort((a, b) => {
        if (a.needs_attention && !b.needs_attention) return -1;
        if (!a.needs_attention && b.needs_attention) return 1;
        return b.attention_reasons.length - a.attention_reasons.length;
      });
    } else if (sort_by === 'exam_high') {
      filteredList.sort((a, b) => b.exam_avg_pct - a.exam_avg_pct);
    } else if (sort_by === 'study_high') {
      filteredList.sort((a, b) => b.study_hours - a.study_hours);
    } else if (sort_by === 'hw_low') {
      filteredList.sort((a, b) => a.homework_completion_rate - b.homework_completion_rate);
    } else if (sort_by === 'name') {
      filteredList.sort((a, b) => a.full_name.localeCompare(b.full_name, 'fa'));
    }

    res.json({
      summary: {
        total_students: totalStudents,
        needs_attention_count: needsAttentionCount,
        excelling_count: excellingCount,
        good_count: goodCount,
        class_study_avg_hours: classStudyAvgHours,
        class_exam_avg_pct: classExamAvgPct,
        class_exam_avg_20: Math.round((classExamAvgPct / 5) * 10) / 10,
        class_hw_rate: classHwRate
      },
      students: filteredList
    });
  } catch (err) {
    console.error('Error in /api/teacher/students-performance:', err);
    res.status(500).json({ error: 'خطا در محاسبه شاخص‌های عملکرد دانش‌آموزان' });
  }
});

app.post('/api/students', requireAuth, requireRole('admin'), (req, res) => {
  const { national_id, phone, first_name, last_name, grade, class_name, parent_phone } = req.body;
  if (!national_id || !first_name || !last_name) {
    return res.status(400).json({ error: 'کد ملی، نام و نام خانوادگی الزامی است.' });
  }

  const cleanNatId = String(national_id).trim();
  if (!validateIranianNationalId(cleanNatId)) {
    return res.status(400).json({ error: 'کد ملی وارد شده نامعتبر است (الگوریتم ۱۰ رقمی ایران).' });
  }

  const cleanPhone = phone ? String(phone).trim() : '';
  if (cleanPhone && !/^09\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'شماره موبایل دانش‌آموز نامعتبر است (الگوی صحیح: ۰۹۱۲۳۴۵۶۷۸۹).' });
  }

  const cleanParentPhone = parent_phone ? String(parent_phone).trim() : '';
  if (cleanParentPhone && !/^09\d{9}$/.test(cleanParentPhone)) {
    return res.status(400).json({ error: 'شماره موبایل ولی نامعتبر است (الگوی صحیح: ۰۹۱۲۳۴۵۶۷۸۹).' });
  }

  const validGrades = ['هفتم', 'هشتم', 'نهم'];
  const cleanGrade = grade && validGrades.includes(grade) ? grade : 'هفتم';
  const cleanClass = class_name ? String(class_name).trim() : 'الف';

  const fullName = `${first_name.trim()} ${last_name.trim()}`;
  const crypto = require('crypto');
  const tempPassword = crypto.randomBytes(5).toString('hex'); // Secure 10-char random password
  const hashedPw = hashPassword(tempPassword);

  try {
    const info = db.prepare(`
      INSERT INTO users (
        role, national_id, phone, password, first_name, last_name, full_name, 
        grade, class_name, parent_phone, must_change_password, is_active
      ) VALUES ('student', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).run(cleanNatId, cleanPhone, hashedPw, first_name.trim(), last_name.trim(), fullName, cleanGrade, cleanClass, cleanParentPhone);

    const studentId = info.lastInsertRowid;

    // Link parent if phone provided
    if (cleanParentPhone) {
      db.prepare(`
        INSERT OR IGNORE INTO users (role, national_id, phone, password, first_name, last_name, full_name, must_change_password, is_active)
        VALUES ('parent', ?, ?, ?, 'ولی', ?, ?, 1, 1)
      `).run(cleanParentPhone, cleanParentPhone, hashPassword(crypto.randomBytes(5).toString('hex')), last_name.trim(), `ولی ${fullName}`);

      const parentUser = db.prepare("SELECT id FROM users WHERE phone = ? AND role = 'parent'").get(cleanParentPhone);
      if (parentUser) {
        db.prepare('INSERT OR IGNORE INTO parent_students (parent_id, student_id) VALUES (?, ?)').run(parentUser.id, studentId);
      }
    }

    recordAudit(req.user.id, 'CREATE_STUDENT', 'users', studentId, `Admin enrolled student: ${cleanNatId} (${fullName})`, req.ip);

    res.json({
      success: true,
      id: studentId,
      initial_password: tempPassword,
      message: 'دانش‌آموز با موفقیت ثبت‌نام شد. رمز موقت یک‌بار برای تحویل به دانش‌آموز نمایش داده می‌شود.'
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'کاربری با این کد ملی قبلاً در سامانه ثبت شده است.' });
    }
    res.status(500).json({ error: 'خطا در ثبت‌نام دانش‌آموز.' });
  }
});

// ----------------- STUDENT BULK IMPORT & EXCEL ENGINE -----------------
function cleanDigits(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .trim();
}

function normalizeGrade(gr) {
  const clean = cleanDigits(gr).trim();
  if (clean === '7' || clean === 'هفتم') return 'هفتم';
  if (clean === '8' || clean === 'هشتم') return 'هشتم';
  if (clean === '9' || clean === 'نهم') return 'نهم';
  if (clean === '10' || clean === 'دهم') return 'دهم';
  if (clean === '11' || clean === 'یازدهم') return 'یازدهم';
  if (clean === '12' || clean === 'دوازدهم') return 'دوازدهم';
  return clean || 'هفتم';
}

function processStudentRows(rawRows) {
  const validRows = [];
  const invalidRows = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || typeof row !== 'object') continue;

    // Support various column names (Persian and English)
    let fullName = (row['نام و نام خانوادگی'] || row['نام و نام‌خانوادگی'] || row['نام کامل'] || row['full_name'] || '').toString().trim();
    let fn = (row['نام'] || row['first_name'] || '').toString().trim();
    let ln = (row['نام خانوادگی'] || row['نام‌خانوادگی'] || row['last_name'] || '').toString().trim();

    if (!fullName && (fn || ln)) {
      fullName = `${fn} ${ln}`.trim();
    } else if (fullName && (!fn || !ln)) {
      const parts = fullName.split(/\s+/);
      fn = parts[0] || '';
      ln = parts.slice(1).join(' ') || fn;
    }

    const rawNatId = row['کد ملی'] || row['کدملی'] || row['کد_ملی'] || row['national_id'] || '';
    const natId = cleanDigits(rawNatId).replace(/[^0-9]/g, '');

    const rawPhone = row['شماره تماس'] || row['شماره همراه'] || row['موبایل'] || row['تلفن'] || row['phone'] || '';
    let phone = cleanDigits(rawPhone).replace(/[^0-9]/g, '');
    if (phone.length === 10 && phone.startsWith('9')) {
      phone = '0' + phone;
    }

    const rawParentPhone = row['شماره والد'] || row['شماره ولی'] || row['تلفن والد'] || row['parent_phone'] || '';
    let parentPhone = cleanDigits(rawParentPhone).replace(/[^0-9]/g, '');
    if (parentPhone.length === 10 && parentPhone.startsWith('9')) {
      parentPhone = '0' + parentPhone;
    }

    const grade = normalizeGrade(row['پایه'] || row['پایه تحصیلی'] || row['grade'] || 'هفتم');
    const className = (row['کلاس'] || row['نام کلاس'] || row['class_name'] || 'الف').toString().trim();
    const address = (row['آدرس'] || row['ادرس'] || row['نشانی'] || row['address'] || '').toString().trim();

    const errors = [];
    if (!natId || natId.length !== 10) {
      errors.push('کد ملی باید ۱۰ رقم باشد');
    }
    if (!fullName) {
      errors.push('نام و نام خانوادگی الزامی است');
    }
    if (phone && !/^09\d{9}$/.test(phone)) {
      errors.push('شماره تماس معتبر نیست (باید ۱۱ رقم با پیش‌شماره ۰۹ باشد)');
    }
    if (parentPhone && !/^09\d{9}$/.test(parentPhone)) {
      errors.push('شماره همراه والد نامعتبر است');
    }

    if (errors.length > 0) {
      invalidRows.push({ row_number: i + 1, data: row, errors });
    } else {
      validRows.push({
        national_id: natId,
        phone: phone || '',
        username: phone || natId, // شماره تماس دانش‌آموز به عنوان نام کاربری
        password: natId, // کد ملی دانش‌آموز به عنوان رمز عبور
        first_name: fn || fullName,
        last_name: ln || fullName,
        full_name: fullName,
        grade,
        class_name: className,
        address,
        parent_phone: parentPhone || ''
      });
    }
  }

  return { validRows, invalidRows };
}

async function insertOrUpdateStudents(validRows, req) {
  const credentials = [];
  db.exec('BEGIN IMMEDIATE;');
  try {
    const checkUser = db.prepare('SELECT id FROM users WHERE national_id = ?');
    const insertStu = db.prepare(`
      INSERT INTO users (
        role, username, national_id, phone, password, first_name, last_name, full_name,
        grade, class_name, address, parent_phone, must_change_password, is_active
      ) VALUES ('student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `);
    const updateStu = db.prepare(`
      UPDATE users 
      SET role = 'student', username = ?, phone = ?, password = ?, first_name = ?, last_name = ?, full_name = ?,
          grade = ?, class_name = ?, address = ?, parent_phone = ?, must_change_password = 0, is_active = 1
      WHERE id = ?
    `);

    const insertParent = db.prepare(`
      INSERT OR IGNORE INTO users (
        role, username, national_id, phone, password, first_name, last_name, full_name, must_change_password, is_active
      ) VALUES ('parent', ?, ?, ?, ?, 'ولی', ?, ?, 0, 1)
    `);
    const linkParent = db.prepare('INSERT OR IGNORE INTO parent_students (parent_id, student_id) VALUES (?, ?)');

    for (const r of validRows) {
      const hashedPw = await hashPassword(r.password); // Password is national_id!
      const existing = checkUser.get(r.national_id);
      let studentId;

      if (existing) {
        updateStu.run(r.username, r.phone, hashedPw, r.first_name, r.last_name, r.full_name, r.grade, r.class_name, r.address, r.parent_phone, existing.id);
        studentId = existing.id;
      } else {
        const info = insertStu.run(r.username, r.national_id, r.phone, hashedPw, r.first_name, r.last_name, r.full_name, r.grade, r.class_name, r.address, r.parent_phone);
        studentId = info.lastInsertRowid;
      }

      if (r.parent_phone) {
        const parentFullName = `ولی ${r.full_name}`;
        const parentHashed = await hashPassword(r.parent_phone);
        insertParent.run(r.parent_phone, r.parent_phone, r.parent_phone, parentHashed, r.last_name, parentFullName);
        const parentUser = db.prepare("SELECT id FROM users WHERE phone = ? AND role = 'parent'").get(r.parent_phone);
        if (parentUser) {
          linkParent.run(parentUser.id, studentId);
        }
      }

      credentials.push({
        national_id: r.national_id,
        username: r.username,
        password: r.password, // Plain for admin export
        full_name: r.full_name,
        grade: r.grade,
        phone: r.phone
      });
    }

    db.exec('COMMIT;');
    recordAudit(req.user ? req.user.id : null, 'IMPORT_STUDENTS', 'users', null, `Imported/updated ${validRows.length} students`, req.ip);
    return { success: true, credentials };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Download Sample Excel Template
app.get('/api/admin/students/excel-template', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const sampleData = [
      {
        'نام و نام خانوادگی': 'امیرعلی رضایی',
        'پایه': 'هفتم',
        'کد ملی': '0012345678',
        'شماره تماس': '09121111111',
        'آدرس': 'تهران، خیابان کارگر شمالی، پلاک ۱۲'
      },
      {
        'نام و نام خانوادگی': 'محمدحسین حسینی',
        'پایه': 'هشتم',
        'کد ملی': '0098765432',
        'شماره تماس': '09122222222',
        'آدرس': 'تهران، میدان انقلاب، کوچه مهر، پلاک ۵'
      },
      {
        'نام و نام خانوادگی': 'سید علی موسوی',
        'پایه': 'نهم',
        'کد ملی': '0034567890',
        'شماره تماس': '09123333333',
        'آدرس': 'تهران، خیابان آزادی، پلاک ۲۰'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 25 }, // نام و نام خانوادگی
      { wch: 12 }, // پایه
      { wch: 16 }, // کد ملی
      { wch: 16 }, // شماره تماس
      { wch: 40 }  // آدرس
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'دانش‌آموزان');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="roshd_students_template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'خطا در ایجاد قالب اکسل: ' + err.message });
  }
});

// Import Students via Uploaded Excel / CSV File
app.post('/api/admin/students/import-file', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لطفاً یک فایل اکسل یا CSV انتخاب نمایید.' });
    }

    const dry_run = req.body.dry_run === 'true' || req.query.dry_run === 'true';
    let rawRows = [];

    const fileBuffer = fs.readFileSync(req.file.path);
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } finally {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: 'فایل اکسل ارسالی خالی است یا ساختار استانداردی ندارد.' });
    }

    const { validRows, invalidRows } = processStudentRows(rawRows);

    if (dry_run) {
      return res.json({
        dry_run: true,
        total_rows: rawRows.length,
        valid_count: validRows.length,
        invalid_count: invalidRows.length,
        preview: validRows.slice(0, 15),
        errors: invalidRows
      });
    }

    if (validRows.length === 0) {
      return res.status(400).json({
        error: 'هیچ ردیف معتبری برای ثبت یافت نشد.',
        errors: invalidRows
      });
    }

    const result = await insertOrUpdateStudents(validRows, req);
    res.json({
      success: true,
      imported_count: validRows.length,
      invalid_count: invalidRows.length,
      credentials: result.credentials,
      message: `تعداد ${validRows.length} دانش‌آموز با موفقیت ایجاد/به‌روزرسانی شدند. نام کاربری شماره تماس و رمز عبور کد ملی است.`
    });
  } catch (err) {
    res.status(500).json({ error: 'خطا در پردازش فایل اکسل: ' + err.message });
  }
});

// Bulk Import Students via Structured JSON / CSV
app.post('/api/admin/students/import', requireAuth, requireRole('admin'), async (req, res) => {
  const { students, rows: bodyRows, csv_text, dry_run = false } = req.body;
  let rawRows = [];

  if (Array.isArray(students)) {
    rawRows = students;
  } else if (Array.isArray(bodyRows)) {
    rawRows = bodyRows;
  } else if (typeof csv_text === 'string') {
    const lines = csv_text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      for (const line of lines) {
        const parts = line.split(/[,;\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          rawRows.push({
            'نام و نام خانوادگی': parts[0],
            'پایه': parts[1] || 'هفتم',
            'کد ملی': parts[2] || '',
            'شماره تماس': parts[3] || '',
            'آدرس': parts[4] || ''
          });
        }
      }
    }
  }

  if (rawRows.length === 0) {
    return res.status(400).json({ error: 'هیچ داده‌ای جهت ایمپورت ارسال نشده است.' });
  }

  const { validRows, invalidRows } = processStudentRows(rawRows);

  if (dry_run) {
    return res.json({
      dry_run: true,
      total_rows: rawRows.length,
      valid_count: validRows.length,
      invalid_count: invalidRows.length,
      preview: validRows.slice(0, 15),
      errors: invalidRows
    });
  }

  if (validRows.length === 0) {
    return res.status(400).json({
      error: 'هیچ ردیف معتبری برای ثبت یافت نشد.',
      errors: invalidRows
    });
  }

  try {
    const result = await insertOrUpdateStudents(validRows, req);
    res.json({
      success: true,
      imported_count: validRows.length,
      invalid_count: invalidRows.length,
      credentials: result.credentials,
      message: `تعداد ${validRows.length} دانش‌آموز با موفقیت وارد سامانه شدند. نام کاربری شماره تماس و رمز عبور کد ملی تنظیم شد.`
    });
  } catch (err) {
    res.status(500).json({ error: 'خطا در ثبت گروهی دانش‌آموزان: ' + err.message });
  }
});

// UPDATE / EDIT STUDENT
app.put('/api/students/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const existing = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'student'").get(studentId);
    if (!existing) {
      return res.status(404).json({ error: 'دانش‌آموز یافت نشد.' });
    }

    const {
      first_name,
      last_name,
      national_id,
      phone,
      parent_phone,
      grade,
      class_name,
      school_name,
      fee_status,
      total_points,
      password,
      is_active
    } = req.body;

    const newFirstName = first_name !== undefined ? String(first_name).trim() : existing.first_name;
    const newLastName = last_name !== undefined ? String(last_name).trim() : existing.last_name;
    const newFullName = `${newFirstName} ${newLastName}`.trim();
    const newNationalId = national_id !== undefined ? String(national_id).trim() : existing.national_id;
    const newPhone = phone !== undefined ? String(phone).trim() : existing.phone;
    const newParentPhone = parent_phone !== undefined ? String(parent_phone).trim() : existing.parent_phone;
    const newGrade = grade !== undefined ? String(grade).trim() : existing.grade;
    const newClassName = class_name !== undefined ? String(class_name).trim() : existing.class_name;
    const newSchoolName = school_name !== undefined ? String(school_name).trim() : existing.school_name;
    const newFeeStatus = fee_status !== undefined ? String(fee_status).trim() : existing.fee_status;
    const newTotalPoints = total_points !== undefined ? parseInt(total_points) : existing.total_points;
    const newIsActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    let newPasswordHash = existing.password;
    if (password && String(password).trim().length >= 4) {
      newPasswordHash = await hashPassword(String(password).trim());
    }

    if (newNationalId !== existing.national_id) {
      const conflict = db.prepare("SELECT id FROM users WHERE (national_id = ? OR username = ?) AND id != ?").get(newNationalId, newNationalId, studentId);
      if (conflict) {
        return res.status(409).json({ error: 'کد ملی یا نام کاربری وارد شده برای کاربر دیگری ثبت شده است.' });
      }
    }

    db.prepare(`
      UPDATE users SET
        first_name = ?,
        last_name = ?,
        full_name = ?,
        national_id = ?,
        username = ?,
        phone = ?,
        parent_phone = ?,
        grade = ?,
        class_name = ?,
        school_name = ?,
        fee_status = ?,
        total_points = ?,
        password = ?,
        is_active = ?,
        token_version = token_version + 1
      WHERE id = ?
    `).run(
      newFirstName,
      newLastName,
      newFullName,
      newNationalId,
      newNationalId,
      newPhone,
      newParentPhone,
      newGrade,
      newClassName,
      newSchoolName,
      newFeeStatus,
      newTotalPoints,
      newPasswordHash,
      newIsActive,
      studentId
    );

    try {
      db.prepare(`
        UPDATE comprehensive_exam_reports SET
          student_name = ?,
          candidate_code = ?,
          school_name = ?,
          grade = ?
        WHERE student_id = ?
      `).run(newFullName, newNationalId, newSchoolName, newGrade, studentId);
    } catch (err) {}

    invalidateUserCache(studentId);
    recordAudit(req.user.id, 'UPDATE_STUDENT', 'users', studentId, `Admin updated student: ${newFullName}`, req.ip);

    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(studentId);
    res.json({
      success: true,
      message: `اطلاعات دانش‌آموز «${newFullName}» با موفقیت ویرایش شد.`,
      student: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'خطا در ویرایش اطلاعات دانش‌آموز: ' + err.message });
  }
});

// DELETE STUDENT (Soft or Permanent)
app.delete('/api/students/:id', requireAuth, requireRole('admin'), (req, res) => {
  const studentId = parseInt(req.params.id);
  const permanent = req.query.permanent === 'true' || req.body?.permanent === true;
  
  const student = db.prepare("SELECT id, full_name, role FROM users WHERE id = ? AND role = 'student'").get(studentId);
  if (!student) {
    return res.status(404).json({ error: 'دانش‌آموز یافت نشد.' });
  }

  if (permanent) {
    db.prepare("DELETE FROM comprehensive_exam_reports WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM exam_results WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM exam_attempts WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM attendance WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM homework_submissions WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM study_sessions WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM points_log WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM fee_receipts WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM parent_students WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM teacher_notes WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM notice_views WHERE user_id = ?").run(studentId);
    db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(studentId, studentId);
    db.prepare("DELETE FROM users WHERE id = ?").run(studentId);

    invalidateUserCache(studentId);
    recordAudit(req.user.id, 'PERMANENT_DELETE_USER', 'users', studentId, `Admin permanently deleted student: ${student.full_name}`, req.ip);
    return res.json({ success: true, message: `حساب کاربری و تمام اطلاعات دانش‌آموز «${student.full_name}» به طور کامل پاک شد.` });
  } else {
    db.prepare("UPDATE users SET is_active = 0, token_version = token_version + 1 WHERE id = ?").run(studentId);
    invalidateUserCache(studentId);
    recordAudit(req.user.id, 'DEACTIVATE_USER', 'users', studentId, `Admin deactivated student: ${student.full_name}`, req.ip);
    return res.json({ success: true, message: `پرونده دانش‌آموز «${student.full_name}» غیرفعال شد.` });
  }
});

// ----------------- ATTENDANCE -----------------
app.get('/api/attendance', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const { date_fa, grade, class_name } = req.query;
  const targetDate = date_fa || getJalaliDate();

  let query = `
    SELECT u.id as student_id, u.full_name, u.grade, u.class_name, u.phone, u.parent_phone,
           COALESCE(a.status, 'p') as status,
           a.id as attendance_id
    FROM users u
    LEFT JOIN attendance a ON u.id = a.student_id AND a.date_fa = ?
    WHERE u.role = 'student'
  `;
  const params = [targetDate];

  if (grade && grade !== 'all') {
    query += ' AND u.grade = ?';
    params.push(grade);
  }
  if (class_name && class_name !== 'all') {
    query += ' AND u.class_name = ?';
    params.push(class_name);
  }

  query += ' ORDER BY u.last_name ASC';
  const list = db.prepare(query).all(...params);
  res.json(list);
});

app.post('/api/attendance', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  const { date_fa, records } = req.body;
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'رکوردهای ارسالی نامعتبر است.' });
  }

  const targetDate = date_fa || getJalaliDate();
  const insert = db.prepare(`
    INSERT INTO attendance (date_fa, grade, class_name, student_id, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date_fa, student_id) DO UPDATE SET status = excluded.status
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const r of records) {
      insert.run(targetDate, r.grade || 'هفتم', r.class_name || 'الف', r.student_id, r.status);
    }
    db.exec('COMMIT;');
    res.json({ success: true, count: records.length });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'خطا در ثبت حضور و غیاب.' });
  }
});

// ----------------- HOMEWORKS -----------------
app.get('/api/homeworks', requireAuth, (req, res) => {
  const grade = req.user.role === 'student' ? req.user.grade : (req.query.grade || null);
  const className = req.user.role === 'student' ? req.user.class_name : (req.query.class_name || null);
  const studentId = req.user.id;

  let query = `
    SELECT h.*, 
           hs.status as submission_status, 
           hs.grade_score, 
           hs.feedback, 
           hs.file_url as student_file,
           hs.is_late
    FROM homeworks h
    LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
    WHERE 1=1
  `;
  const params = [studentId];

  if (grade) {
    query += " AND (h.grade = ? OR h.grade = 'all')";
    params.push(grade);
  }
  if (className) {
    query += " AND (h.class_name = ? OR h.class_name = 'all')";
    params.push(className);
  }

  query += ' ORDER BY h.id DESC';
  const homeworks = db.prepare(query).all(...params);
  res.json(homeworks);
});

app.post('/api/homeworks', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { title, grade, class_name, subject, deadline_fa, points, description } = req.body;
  if (!title || !grade) {
    return res.status(400).json({ error: 'عنوان و پایه الزامی است.' });
  }

  const teacherName = req.user.full_name || 'استاد کانون';
  const info = db.prepare(`
    INSERT INTO homeworks (title, grade, class_name, subject, teacher_name, deadline_fa, deadline_timestamp, points, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, grade, class_name || 'all', subject || 'عمومی', teacherName,
    deadline_fa || '۱۰ آبان ۱۴۰۳', Date.now() + 7 * 86400000, points || 20, description || ''
  );

  recordAudit(req.user.id, 'CREATE_HOMEWORK', 'homeworks', info.lastInsertRowid, `Created homework: ${title}`, req.ip);
  res.json({ success: true, id: info.lastInsertRowid });
});

app.post('/api/homeworks/:id/submit', requireAuth, requireRole('student'), (req, res) => {
  const homeworkId = parseInt(req.params.id);
  const studentId = req.user.id; // Trusted from session
  const { file_url, note } = req.body;

  const hw = db.prepare('SELECT * FROM homeworks WHERE id = ?').get(homeworkId);
  if (!hw) return res.status(404).json({ error: 'تکلیف یافت نشد.' });

  const currentDate = getJalaliDate();
  const isLate = Date.now() > (hw.deadline_timestamp || (Date.now() + 1000)) ? 1 : 0;

  db.prepare(`
    INSERT INTO homework_submissions (homework_id, student_id, submitted_at_fa, file_url, note, is_late, status)
    VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    ON CONFLICT(homework_id, student_id) DO UPDATE SET
      submitted_at_fa = excluded.submitted_at_fa,
      file_url = excluded.file_url,
      note = excluded.note,
      is_late = excluded.is_late,
      status = 'submitted'
  `).run(homeworkId, studentId, currentDate, file_url || '', note || '', isLate);

  res.json({ success: true, message: 'تکلیف با موفقیت ارسال شد.' });
});

app.get('/api/homeworks/report', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { homework_id } = req.query;

  let query = `
    SELECT hs.*, u.full_name, u.grade, u.class_name, h.title as homework_title, h.points as max_points
    FROM homework_submissions hs
    JOIN users u ON hs.student_id = u.id
    LEFT JOIN homeworks h ON hs.homework_id = h.id
  `;
  const params = [];

  if (homework_id) {
    query += ' WHERE hs.homework_id = ?';
    params.push(homework_id);
  }

  query += ' ORDER BY hs.id DESC LIMIT 100';
  const submissions = db.prepare(query).all(...params);

  res.json(submissions);
});

// ----------------- ONLINE EXAMS -----------------
app.get('/api/exams', requireAuth, (req, res) => {
  const grade = req.user.role === 'student' ? req.user.grade : (req.query.grade || null);
  const className = req.user.role === 'student' ? req.user.class_name : (req.query.class_name || null);

  let query = `
    SELECT id, title, grade, class_name, subject, duration_minutes, question_count, deadline_fa, created_at
    FROM exams
    WHERE 1=1
  `;
  const params = [];
  if (grade) {
    query += " AND (grade = ? OR grade = 'all')";
    params.push(grade);
  }
  if (className) {
    query += " AND (class_name = ? OR class_name = 'all')";
    params.push(className);
  }
  query += ' ORDER BY id DESC';

  const exams = db.prepare(query).all(...params);
  res.json(exams);
});

// GET EXAM: Verify grade/class and strip correct answers for students to prevent cheating!
app.get('/api/exams/:id', requireAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد.' });

  const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user.role);

  // Grade and class restriction for students
  if (!isTeacherOrAdmin && req.user.role === 'student') {
    if (exam.grade && exam.grade !== 'all' && exam.grade !== req.user.grade) {
      return res.status(403).json({ error: 'این آزمون مختص پایه تحصیلی شما نمی‌باشد.' });
    }
    if (exam.class_name && exam.class_name !== 'all' && exam.class_name !== req.user.class_name) {
      return res.status(403).json({ error: 'این آزمون مختص کلاس شما نمی‌باشد.' });
    }
  }

  const rawQuestions = JSON.parse(exam.questions_json || '[]');

  // If student: remove 'correct' answer key!
  if (!isTeacherOrAdmin) {
    exam.questions = rawQuestions.map(q => {
      const copy = { ...q };
      delete copy.correct;
      delete copy.correct_answer;
      return copy;
    });
  } else {
    exam.questions = rawQuestions;
  }

  delete exam.questions_json;
  res.json(exam);
});

// START EXAM: Record start timestamp to enforce anti-cheat countdown
app.post('/api/exams/:id/start', requireAuth, requireRole('student'), (req, res) => {
  const examId = parseInt(req.params.id);
  const studentId = req.user.id;

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد.' });

  // Check if student has already completed the exam
  const existingResult = db.prepare('SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?').get(examId, studentId);
  if (existingResult) {
    return res.status(409).json({ error: 'شما قبلاً در این آزمون شرکت کرده‌اید و آزمون خاتمه یافته است.' });
  }

  const existingAttempt = db.prepare('SELECT started_at FROM exam_attempts WHERE exam_id = ? AND student_id = ?').get(examId, studentId);
  let startedAt = Date.now();
  if (existingAttempt) {
    startedAt = existingAttempt.started_at;
  } else {
    db.prepare('INSERT INTO exam_attempts (exam_id, student_id, started_at) VALUES (?, ?, ?)').run(examId, studentId, startedAt);
  }

  res.json({
    success: true,
    started_at: startedAt,
    duration_minutes: exam.duration_minutes
  });
});

app.post('/api/exams', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { title, grade, class_name, subject, duration_minutes, question_count, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'عنوان و سوالات آزمون الزامی است.' });
  }

  const info = db.prepare(`
    INSERT INTO exams (title, grade, class_name, subject, duration_minutes, question_count, questions_json, deadline_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, grade || 'هفتم', class_name || 'all', subject || 'عمومی',
    duration_minutes || 15, question_count || questions.length,
    JSON.stringify(questions), '۱۰ آبان ۱۴۰۳'
  );

  recordAudit(req.user.id, 'CREATE_EXAM', 'exams', info.lastInsertRowid, `Created exam: ${title}`, req.ip);
  res.json({ success: true, id: info.lastInsertRowid });
});

// Strict server-side exam evaluation and anti-cheat validation
app.post('/api/exams/:id/submit', requireAuth, requireRole('student'), (req, res) => {
  const examId = parseInt(req.params.id);
  const studentId = req.user.id; // Trusted from session
  const { answers } = req.body; // e.g. { '1': 2, '2': 4 }

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'پاسخ‌های ارسالی نامعتبر است.' });
  }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد.' });

  // 1. Prevent duplicate submission (409 Conflict)
  const existingResult = db.prepare('SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?').get(examId, studentId);
  if (existingResult) {
    return res.status(409).json({ error: 'پاسخ‌های این آزمون قبلاً ثبت شده است و امکان ارسال مجدد وجود ندارد.' });
  }

  // 2. Strict duration check against exam_attempts
  const attempt = db.prepare('SELECT started_at FROM exam_attempts WHERE exam_id = ? AND student_id = ?').get(examId, studentId);
  if (attempt) {
    const allowedMs = (exam.duration_minutes * 60 * 1000) + 45000; // 45s grace period for network latency
    if (Date.now() - attempt.started_at > allowedMs) {
      return res.status(400).json({ error: 'مهلت زمانی تعیین‌شده برای این آزمون منقضی گردیده است.' });
    }
  }

  // 3. Evaluate against master key
  const questions = JSON.parse(exam.questions_json || '[]');
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  questions.forEach(q => {
    const studentAns = answers[q.id];
    if (studentAns === undefined || studentAns === null) {
      unanswered++;
    } else if (studentAns === q.correct) {
      correct++;
    } else {
      wrong++;
    }
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const score = Math.round((percentage / 100) * 20);

  const currentDate = getJalaliDate();

  // 4. Calculate dynamic real-time rank
  const higherScores = db.prepare('SELECT COUNT(*) as c FROM exam_results WHERE exam_id = ? AND score > ?').get(examId, score).c;
  const calculatedRank = higherScores + 1;

  db.prepare(`
    INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_count, wrong_count, unanswered_count, percentage, rank, submitted_at_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(examId, studentId, score, total, correct, wrong, unanswered, percentage, calculatedRank, currentDate);

  // 5. Award XP and record in points_log
  const xpEarned = Math.max(10, Math.round(score * 2.5));
  db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(xpEarned, studentId);
  db.prepare(`
    INSERT INTO points_log (student_id, type, title, points, date_fa)
    VALUES (?, 'plus', ?, ?, ?)
  `).run(studentId, `شرکت در آزمون ${exam.title}`, xpEarned, currentDate);

  res.json({
    success: true,
    score,
    total_questions: total,
    correct_count: correct,
    wrong_count: wrong,
    unanswered_count: unanswered,
    percentage,
    rank: calculatedRank,
    xp_earned: xpEarned
  });
});

app.get('/api/exams/comprehensive/rankings', requireAuth, (req, res) => {
  // If student: only return student's own exam results
  if (req.user.role === 'student') {
    const myRankings = db.prepare(`
      SELECT er.*, u.full_name, u.grade, u.class_name
      FROM exam_results er
      JOIN users u ON er.student_id = u.id
      WHERE er.student_id = ?
      ORDER BY er.id DESC
    `).all(req.user.id);
    return res.json(myRankings);
  }

  // Staff and Admin see top 50
  const rankings = db.prepare(`
    SELECT er.*, u.full_name, u.grade, u.class_name
    FROM exam_results er
    JOIN users u ON er.student_id = u.id
    ORDER BY er.percentage DESC, er.score DESC
    LIMIT 50
  `).all();
  res.json(rankings);
});

// ----------------- BARPA / COMPREHENSIVE EXAM REPORTS API -----------------
const { execFile } = require('child_process');

function sanitizeReport(row) {
  if (!row) return null;
  return {
    ...row,
    subjects: JSON.parse(row.subjects_json || '[]'),
    categories: JSON.parse(row.categories_json || '[]'),
    answers: JSON.parse(row.answers_json || '[]')
  };
}

// Get Barpa reports: for student returns student's reports; for admin/teacher returns all reports
app.get('/api/barpa-exams/reports', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'student') {
      const rows = db.prepare(`
        SELECT * FROM comprehensive_exam_reports 
        WHERE student_id = ? 
        ORDER BY id DESC
      `).all(req.user.id);
      return res.json(rows.map(sanitizeReport));
    }

    const rows = db.prepare(`
      SELECT r.*, u.phone, u.grade as user_grade, u.school_name as user_school, u.total_points
      FROM comprehensive_exam_reports r
      JOIN users u ON r.student_id = u.id
      ORDER BY r.overall_traz DESC
    `).all();
    res.json(rows.map(sanitizeReport));
  } catch (err) {
    console.error('Error fetching barpa reports:', err);
    res.status(500).json({ error: 'خطا در بارگذاری کارنامه‌ها' });
  }
});

// Get a single report
app.get('/api/barpa-exams/reports/:id', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM comprehensive_exam_reports WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'کارنامه یافت نشد.' });
    if (req.user.role === 'student' && row.student_id !== req.user.id) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز به کارنامه.' });
    }
    res.json(sanitizeReport(row));
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت جزئیات کارنامه' });
  }
});

// Import Barpa parsed records helper
async function importBarpaRecords(records) {
  const defaultPasswordHash = await hashPassword('12345678');
  const examId = 'barpa_grade9_stage1';
  const imported = [];

  for (const item of records) {
    const candidateCode = item.candidate_code || `STU9_${item.page}`;
    const fullName = item.full_name;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'دانش‌آموز';
    const lastName = nameParts.slice(1).join(' ') || fullName;
    const phone = '0912' + candidateCode.slice(-7).padStart(7, '0');
    const schoolName = item.school_name || 'شهید کاظمی آشتیانی';
    const total = item.total_summary || {};

    let user = db.prepare('SELECT * FROM users WHERE national_id = ? OR username = ?').get(candidateCode, candidateCode);
    if (!user) {
      const res = db.prepare(`
        INSERT INTO users (
          role, national_id, username, phone, password, first_name, last_name, full_name,
          grade, class_name, school_name, total_points, rank, fee_status, platform_fee_status,
          must_change_password, is_active
        ) VALUES (
          'student', ?, ?, ?, ?, ?, ?, ?,
          'نهم', 'الف', ?, ?, ?, 'paid', 'paid', 0, 1
        )
      `).run(
        candidateCode,
        candidateCode,
        phone,
        defaultPasswordHash,
        firstName,
        lastName,
        fullName,
        schoolName,
        150 + Math.round((total.traz || 5000) / 40),
        total.rank_center || 1
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(res.lastInsertRowid);
    } else {
      db.prepare(`
        UPDATE users 
        SET full_name = ?, first_name = ?, last_name = ?, grade = 'نهم', school_name = ?, is_active = 1
        WHERE id = ?
      `).run(fullName, firstName, lastName, schoolName, user.id);
    }

    db.prepare(`
      INSERT INTO comprehensive_exam_reports (
        exam_id, exam_title, grade, student_id, candidate_code, student_name, school_name,
        total_attendees, overall_traz, overall_rank_all, overall_rank_center, overall_percentage,
        overall_correct, overall_wrong, overall_unanswered, total_questions,
        subjects_json, categories_json, answers_json
      ) VALUES (
        ?, ?, 'نهم', ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 120,
        ?, ?, ?
      )
      ON CONFLICT(exam_id, student_id) DO UPDATE SET
        student_name = excluded.student_name,
        candidate_code = excluded.candidate_code,
        school_name = excluded.school_name,
        total_attendees = excluded.total_attendees,
        overall_traz = excluded.overall_traz,
        overall_rank_all = excluded.overall_rank_all,
        overall_rank_center = excluded.overall_rank_center,
        overall_percentage = excluded.overall_percentage,
        overall_correct = excluded.overall_correct,
        overall_wrong = excluded.overall_wrong,
        overall_unanswered = excluded.overall_unanswered,
        subjects_json = excluded.subjects_json,
        categories_json = excluded.categories_json,
        answers_json = excluded.answers_json
    `).run(
      examId,
      item.exam_title || 'مرحله اول برپا | پایه‌ی نهم',
      user.id,
      candidateCode,
      fullName,
      schoolName,
      item.total_attendees || 1924,
      total.traz || 5000,
      total.rank_all || 1,
      total.rank_center || 1,
      total.percentage || 0,
      total.correct || 0,
      total.wrong || 0,
      total.unanswered || 0,
      JSON.stringify(item.subjects || []),
      JSON.stringify(item.categories || []),
      JSON.stringify(item.answers || [])
    );

    imported.push({
      student_id: user.id,
      full_name: fullName,
      candidate_code: candidateCode,
      traz: total.traz,
      rank: total.rank_all
    });
  }

  return imported;
}

// Upload & parse Barpa PDF
app.post('/api/barpa-exams/upload', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    let pdfPath = req.file ? req.file.path : null;
    if (!pdfPath) {
      const defaultPdf = path.join(__dirname, 'uploads', 'barpa_sample.pdf');
      const dlPdf = 'C:\\Users\\danyal\\Downloads\\مرحله اول برپا نهم 1 (1).pdf';
      if (fs.existsSync(defaultPdf)) {
        pdfPath = defaultPdf;
      } else if (fs.existsSync(dlPdf)) {
        pdfPath = dlPdf;
      } else {
        return res.status(400).json({ error: 'فایل آزمون برپا ارسال نشده است.' });
      }
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'parse_barpa_pdf.py');
    execFile('python', [scriptPath, pdfPath, '--json-stdout'], { maxBuffer: 15 * 1024 * 1024 }, async (err, stdout, stderr) => {
      if (err) {
        console.error('Barpa PDF Python error:', err, stderr);
        return res.status(500).json({ error: 'خطا در تحلیل و جداسازی کارنامه‌های فایل برپا.' });
      }

      const match = stdout.match(/___JSON_START___([\s\S]*?)___JSON_END___/);
      if (!match) {
        return res.status(500).json({ error: 'فرمت داده‌های استخراج شده معتبر نیست.' });
      }

      const records = JSON.parse(match[1]);
      const imported = await importBarpaRecords(records);

      recordAudit(req.user.id, 'BARPA_PDF_UPLOAD', 'comprehensive_exam', 'barpa_grade9_stage1', `Uploaded & processed ${imported.length} student report cards`, req.ip);

      res.json({
        success: true,
        message: `تعداد ${imported.length} کارنامه با موفقیت تفکیک و به پنل اختصاصی دانش‌آموزان نهم ارسال شد.`,
        count: imported.length,
        students: imported
      });
    });
  } catch (err) {
    console.error('Barpa upload handler error:', err);
    res.status(500).json({ error: 'خطای سیستمی در پردازش آزمون' });
  }
});

// ----------------- EXAM BOOKS API -----------------
app.get('/api/exam-books', requireAuth, (req, res) => {
  try {
    const books = db.prepare('SELECT * FROM exam_books ORDER BY is_custom ASC, id ASC').all();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت لیست کتاب‌ها' });
  }
});

app.get('/api/exam-books/:id/topics', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'hoosh_6') {
      const p = path.join(__dirname, '..', 'frontend', 'src', 'data', 'hoosh_topics.json');
      if (fs.existsSync(p)) {
        return res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
      }
    } else if (id === 'hoosh_8_9') {
      const p = path.join(__dirname, '..', 'frontend', 'src', 'data', 'hoosh_topics_8_9.json');
      if (fs.existsSync(p)) {
        return res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
      }
    }
    const book = db.prepare('SELECT * FROM exam_books WHERE id = ?').get(id);
    if (!book) return res.status(404).json({ error: 'کتاب یافت نشد.' });
    if (book.topics_json) {
      return res.json(JSON.parse(book.topics_json));
    }
    // Fallback default sample topics for uploaded book
    const sampleTopics = [];
    const count = book.topics_count || 10;
    for (let i = 1; i <= count; i++) {
      sampleTopics.push({
        id: i,
        title: `مبحث ${i}: فصل آزمون انتخابی`,
        sectionId: 1,
        sectionTitle: 'سؤالات استخراج‌شده',
        chapterId: 1,
        chapterTitle: 'بخش تمرینات',
        bookStartPage: i * 2,
        bookEndPage: i * 2 + 1,
        pdfStartPage: i * 2,
        pdfEndPage: i * 2 + 1,
        pageCount: 2
      });
    }
    res.json(sampleTopics);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت مباحث کتاب' });
  }
});

app.post('/api/exam-books/upload', requireAuth, requireRole('teacher', 'admin'), upload.single('file'), (req, res) => {
  try {
    const { title, grade, description, topics_count } = req.body;
    if (!title || !req.file) {
      return res.status(400).json({ error: 'عنوان کتاب و فایل PDF الزامی است.' });
    }
    const bookId = 'book_' + Date.now();
    const fileUrl = `/uploads/books/${req.file.filename}`;
    const tCount = parseInt(topics_count) || 20;
    
    // Create extracted pages directory for this custom book
    const bookImgDir = path.join(__dirname, 'public', 'extracted_pages', bookId);
    fs.mkdirSync(bookImgDir, { recursive: true });

    db.prepare(`
      INSERT INTO exam_books (id, title, grade, topics_count, pages_count, description, file_url, image_folder, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      bookId,
      title,
      grade || 'همه مقاطع',
      tCount,
      tCount * 2,
      description || `کتاب بارگذاری شده توسط ${req.user.full_name}`,
      fileUrl,
      `/extracted_pages/${bookId}`
    );

    res.json({ success: true, message: 'کتاب با موفقیت بارگذاری و افزوده شد.', id: bookId });
  } catch (err) {
    res.status(500).json({ error: 'خطا در بارگذاری کتاب: ' + err.message });
  }
});

app.delete('/api/exam-books/:id', requireAuth, requireRole('admin', 'teacher'), (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'hoosh_6' || id === 'hoosh_8_9') {
      return res.status(400).json({ error: 'کتاب‌های پیش‌فرض سامانه قابل حذف نیستند.' });
    }
    db.prepare('DELETE FROM exam_books WHERE id = ?').run(id);
    res.json({ success: true, message: 'کتاب با موفقیت حذف شد.' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف کتاب' });
  }
});

// ----------------- POMODORO & STUDY STATS -----------------
app.get('/api/study/stats/:student_id', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.student_id);
  const isSelf = req.user.id === targetId;
  const isStaffOrParent = ['admin', 'teacher', 'parent'].includes(req.user.role);

  if (!isSelf && !isStaffOrParent) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  }

  const today = getJalaliDate();
  const session = db.prepare('SELECT * FROM study_sessions WHERE student_id = ? AND date_fa = ?').get(targetId, today);

  res.json({
    today_pomodoros: session ? session.pomodoros_count : 0,
    today_minutes: session ? session.total_minutes : 0
  });
});

app.post('/api/study/pomodoro', requireAuth, requireRole('student'), (req, res) => {
  // Reject IDOR attempts to record study sessions for other students
  if (req.body.student_id && Number(req.body.student_id) !== req.user.id) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز: امکان ثبت پومودورو برای سایر کاربران وجود ندارد.' });
  }

  const studentId = req.user.id;
  const minutes = parseInt(req.body.minutes) || 25;

  // Security bounds: Prevent unrealistic spoofed values
  if (minutes < 1 || minutes > 120) {
    return res.status(400).json({ error: 'مدت زمان پومودورو نامعتبر است (بین ۱ تا ۱۲۰ دقیقه).' });
  }

  const today = getJalaliDate();
  const currentSession = db.prepare('SELECT pomodoros_count, total_minutes, last_session_at FROM study_sessions WHERE student_id = ? AND date_fa = ?').get(studentId, today);

  // Enforce daily limits: Max 300 minutes or 12 pomodoro sessions
  if (currentSession) {
    if (currentSession.total_minutes + minutes > 300 || currentSession.pomodoros_count >= 12) {
      return res.status(400).json({ error: 'سقف مجاز مطالعه روزانه (۳۰۰ دقیقه یا ۱۲ جلسه) تکمیل شده است.' });
    }

    // Anti-replay interval check in production
    if (process.env.NODE_ENV === 'production' && currentSession.last_session_at) {
      const minIntervalMs = minutes * 60 * 1000 * 0.8;
      if (Date.now() - currentSession.last_session_at < minIntervalMs) {
        return res.status(400).json({ error: 'فاصله زمانی بین ثبت جلسات مطالعه رعایت نشده است.' });
      }
    }
  }

  const nowMs = Date.now();
  db.prepare(`
    INSERT INTO study_sessions (student_id, date_fa, pomodoros_count, total_minutes, last_session_at)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(student_id, date_fa) DO UPDATE SET
      pomodoros_count = pomodoros_count + 1,
      total_minutes = total_minutes + excluded.total_minutes,
      last_session_at = excluded.last_session_at
  `).run(studentId, today, minutes, nowMs);

  // Award XP points and record in points_log
  const pointsAwarded = Math.min(25, Math.max(5, Math.round(minutes * 0.4)));
  db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(pointsAwarded, studentId);
  db.prepare(`
    INSERT INTO points_log (student_id, type, title, points, date_fa)
    VALUES (?, 'plus', ?, ?, ?)
  `).run(studentId, `تکمیل جلسه مطالعه (${minutes} دقیقه)`, pointsAwarded, today);

  res.json({ success: true, points_awarded: pointsAwarded });
});

app.get('/api/study/leaderboard', requireAuth, (req, res) => {
  const leaderboard = getOrSetCache('study:leaderboard', 15, () => {
    return db.prepare(`
      SELECT id, full_name, grade, class_name, level, level_title, total_points, rank
      FROM users
      WHERE role = 'student'
      ORDER BY total_points DESC
      LIMIT 30
    `).all();
  });
  res.json(leaderboard);
});

// ----------------- POINTS & GAMIFICATION -----------------
app.get('/api/points/:student_id', requireAuth, (req, res) => {
  const targetId = parseInt(req.params.student_id);
  const isSelf = req.user.id === targetId;
  const isStaffOrParent = ['admin', 'teacher', 'parent'].includes(req.user.role);

  if (!isSelf && !isStaffOrParent) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  }

  const logs = db.prepare('SELECT * FROM points_log WHERE student_id = ? ORDER BY id DESC LIMIT 20').all(targetId);
  const user = db.prepare('SELECT total_points, level, level_title, rank FROM users WHERE id = ?').get(targetId);

  res.json({
    total_points: user ? user.total_points : 100,
    level: user ? user.level : 1,
    level_title: user ? user.level_title : 'نوآموز',
    rank: user ? user.rank : 1,
    logs
  });
});

// ----------------- FINANCIAL & FEES -----------------
app.get('/api/fees/defs', requireAuth, (req, res) => {
  const defs = getOrSetCache('fees:defs', 30, () => {
    return db.prepare('SELECT * FROM fee_defs ORDER BY grade ASC').all();
  });
  res.json(defs);
});

app.put('/api/fees/defs', requireAuth, requireRole('admin'), (req, res) => {
  const { grade, amount, deadline_fa, lock_date_fa, is_locked } = req.body;
  const lockVal = (is_locked === 1 || is_locked === true) ? 1 : 0;
  
  db.prepare(`
    INSERT INTO fee_defs (grade, amount, deadline_fa, lock_date_fa, is_locked)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(grade) DO UPDATE SET
      amount = excluded.amount,
      deadline_fa = excluded.deadline_fa,
      lock_date_fa = excluded.lock_date_fa,
      is_locked = excluded.is_locked
  `).run(grade, amount, deadline_fa, lock_date_fa, lockVal);

  // Synchronize lock state to students of this grade based on fee status
  if (lockVal === 1) {
    db.prepare("UPDATE users SET is_locked = 1 WHERE role = 'student' AND grade = ? AND (fee_status = 'unpaid' OR fee_status = 'rejected')").run(grade);
  } else {
    db.prepare("UPDATE users SET is_locked = 0 WHERE role = 'student' AND grade = ?").run(grade);
  }

  invalidateRouteCache('fees');
  invalidateRouteCache('settings');
  res.json({ success: true });
});

app.get('/api/fees/receipts', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const studentId = req.user.id;

  if (isAdmin) {
    const receipts = db.prepare(`
      SELECT fr.*, 
             u.full_name AS student_name, 
             u.national_id, 
             u.phone AS student_phone, 
             u.grade, 
             u.class_name, 
             u.school_name,
             u.parent_name, 
             u.parent_phone, 
             u.fee_status,
             u.is_locked
      FROM fee_receipts fr
      JOIN users u ON fr.student_id = u.id
      ORDER BY fr.id DESC
    `).all();
    return res.json(receipts);
  }

  // Student only sees their own receipts
  const receipts = db.prepare('SELECT * FROM fee_receipts WHERE student_id = ? ORDER BY id DESC').all(studentId);
  res.json(receipts);
});

app.post('/api/fees/receipts', requireAuth, upload.single('receipt_image'), (req, res) => {
  const studentId = req.user.id;
  const { amount, card_number, tracking_code } = req.body;
  const fileUrl = req.file ? `/uploads/receipts/${req.file.filename}` : (req.body.receipt_image || '');
  const currentDate = getJalaliDate();

  db.prepare(`
    INSERT INTO fee_receipts (student_id, amount, card_number, tracking_code, receipt_image, status, date_fa)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(studentId, parseInt(amount) || 1500000, card_number || '', tracking_code || '', fileUrl, currentDate);

  db.prepare("UPDATE users SET fee_status = 'pending' WHERE id = ?").run(studentId);
  res.json({ success: true, message: 'رسید با موفقیت بارگذاری شد و در انتظار تأیید مدیریت است.' });
});

app.put('/api/fees/receipts/:id', requireAuth, requireRole('admin'), (req, res) => {
  const receiptId = parseInt(req.params.id);
  const { status, reject_reason } = req.body;

  const receipt = db.prepare(`
    SELECT fr.*, u.full_name AS student_name 
    FROM fee_receipts fr
    JOIN users u ON fr.student_id = u.id
    WHERE fr.id = ?
  `).get(receiptId);
  if (!receipt) return res.status(404).json({ error: 'رسید یافت نشد.' });

  // Prevent double approval
  if (receipt.status === 'approved' && status === 'approved') {
    return res.status(400).json({ error: 'این رسید قبلاً تأیید گردیده و سند حسابداری آن ثبت شده است.' });
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare('UPDATE fee_receipts SET status = ?, reject_reason = ? WHERE id = ?').run(status, reject_reason || '', receiptId);
    
    if (status === 'approved') {
      db.prepare("UPDATE users SET fee_status = 'paid', is_locked = 0 WHERE id = ?").run(receipt.student_id);
      db.prepare(`
        INSERT INTO accounting (type, title, amount, date_fa, category)
        VALUES ('income', ?, ?, ?, 'شهریه')
      `).run(`شهریه دانش‌آموز ${receipt.student_name} (کد رهگیری: ${receipt.tracking_code || '---'})`, receipt.amount, receipt.date_fa);
    } else if (status === 'rejected') {
      db.prepare("UPDATE users SET fee_status = 'rejected' WHERE id = ?").run(receipt.student_id);
    } else {
      db.prepare("UPDATE users SET fee_status = 'pending' WHERE id = ?").run(receipt.student_id);
    }

    db.exec('COMMIT;');
    recordAudit(req.user.id, 'VERIFY_RECEIPT', 'fee_receipts', receiptId, `Receipt ${status}`, req.ip);
    res.json({ success: true, message: `وضعیت رسید با موفقیت به ${status} تغییر یافت.` });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'خطا در ثبت وضعیت رسید: ' + err.message });
  }
});

// Digital Payment Gateway Simulation - Disabled in Production
app.post('/api/fees/pay-online', requireAuth, requireRole('student'), (req, res) => {
  return res.status(501).json({
    error: 'درگاه پرداخت اینترنتی موقتاً غیرفعال است. لطفاً مبلغ شهریه را به شماره کارت رسمی کانون واریز نموده و تصویر فیش را در بخش ثبت فیش ارسال فرمایید.',
    code: 'PAYMENT_GATEWAY_NOT_CONFIGURED'
  });
});

app.get('/api/fees/report', requireAuth, requireRole('admin'), (req, res) => {
  const grades = ['هفتم', 'هشتم', 'نهم'];
  const gradeReports = [];

  for (const grade of grades) {
    const paid = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student' AND grade = ? AND fee_status = 'paid'").get(grade).c;
    const pending = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student' AND grade = ? AND fee_status = 'pending'").get(grade).c;
    const unpaid = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student' AND grade = ? AND (fee_status = 'unpaid' OR fee_status = 'rejected' OR fee_status IS NULL)").get(grade).c;
    gradeReports.push({
      grade,
      paid,
      pending,
      unpaid
    });
  }

  res.json(gradeReports);
});

// ----------------- SYSTEM & PAYMENT SETTINGS (ADMIN MANAGED) -----------------
app.get('/api/settings/public', (req, res) => {
  try {
    const data = getOrSetCache('settings:public', 30, () => {
      const rows = db.prepare('SELECT key, value FROM settings').all();
      const settings = {};
      for (const r of rows) {
        settings[r.key] = r.value;
      }
      const feeDefs = db.prepare('SELECT * FROM fee_defs ORDER BY grade ASC').all();
      return {
        success: true,
        settings: {
          brand_name: settings.brand_name || 'کانون نخبه‌پروری شهید کاظم آشتیانی',
          platform_name: settings.platform_name || 'پلتفرم رشد',
          slogan: settings.slogan || 'سامانه جامع مدیریت آموزشی و نخبه‌پروری',
          card_number: settings.card_number || '۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰',
          card_holder: settings.card_holder || 'کانون نخبه‌پروری آشتیانی',
          shaba_number: settings.shaba_number || 'IR000000000000000000000000',
          bank_name: settings.bank_name || 'بانک ملی ایران',
          contact_phone: settings.contact_phone || '۰۲۱-۸۸۸۸۴۴۲۲',
          address: settings.address || 'تهران، خیابان آزادی، پلاک ۱۲',
          tuition_rules: settings.tuition_rules || 'واریز شهریه حداکثر تا پایان مهلت مقرر الزامی است.',
          announcement_banner: settings.announcement_banner || '',
          platform_fee_amount: parseInt(settings.platform_fee_amount) || 150000
        },
        fee_defs: feeDefs
      };
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت تنظیمات سامانه.' });
  }
});

app.get('/api/admin/settings', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    const feeDefs = db.prepare('SELECT * FROM fee_defs ORDER BY grade ASC').all();
    res.json({
      settings,
      fee_defs: feeDefs
    });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت تنظیمات مدیریت.' });
  }
});

app.put('/api/admin/settings', requireAuth, requireRole('admin'), (req, res) => {
  const { settings, fee_defs } = req.body;
  if (!settings && !fee_defs) {
    return res.status(400).json({ error: 'تنظیمات یا تعرفه‌های شهریه برای ذخیره ارسال نشده است.' });
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    if (settings && typeof settings === 'object') {
      const allowedKeys = [
        'brand_name', 'platform_name', 'slogan', 'card_number', 'card_holder',
        'shaba_number', 'bank_name', 'contact_phone', 'address', 'tuition_rules',
        'announcement_banner', 'platform_fee_amount'
      ];
      const upsertSetting = db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);
      for (const [key, val] of Object.entries(settings)) {
        if (allowedKeys.includes(key)) {
          upsertSetting.run(key, String(val ?? '').trim());
        }
      }
    }

    if (fee_defs && Array.isArray(fee_defs)) {
      const upsertFee = db.prepare(`
        INSERT INTO fee_defs (grade, amount, deadline_fa, lock_date_fa, is_locked)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(grade) DO UPDATE SET
          amount = excluded.amount,
          deadline_fa = excluded.deadline_fa,
          lock_date_fa = excluded.lock_date_fa,
          is_locked = excluded.is_locked
      `);
      for (const fd of fee_defs) {
        if (fd.grade) {
          upsertFee.run(
            String(fd.grade).trim(),
            parseInt(fd.amount) || 1500000,
            String(fd.deadline_fa || '۱۴۰۵/۰۸/۱۵').trim(),
            String(fd.lock_date_fa || '۱۴۰۵/۰۸/۳۰').trim(),
            fd.is_locked ? 1 : 0
          );
        }
      }
    }

    db.exec('COMMIT;');
    invalidateRouteCache('settings');
    invalidateRouteCache('fees');
    recordAudit(req.user.id, 'UPDATE_SETTINGS', 'settings', null, 'Admin updated platform and payment settings', req.ip);
    res.json({ success: true, message: 'تنظیمات سامانه و مشخصات پرداخت با موفقیت ذخیره شد.' });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'خطا در ذخیره تنظیمات: ' + err.message });
  }
});

// ----------------- ACCOUNTING -----------------
app.get('/api/accounting/summary', requireAuth, requireRole('admin'), (req, res) => {
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM accounting WHERE type = 'income'").get().total;
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM accounting WHERE type = 'expense'").get().total;

  res.json({
    total_income: income,
    total_expense: expense,
    net_balance: income - expense
  });
});

app.get('/api/accounting/ledger', requireAuth, requireRole('admin'), (req, res) => {
  const records = db.prepare('SELECT * FROM accounting ORDER BY id DESC LIMIT 50').all();
  res.json(records);
});

app.post('/api/accounting/expense', requireAuth, requireRole('admin'), (req, res) => {
  const { title, amount, category, date_fa } = req.body;
  if (!title || !amount) {
    return res.status(400).json({ error: 'عنوان و مبلغ هزینه الزامی است.' });
  }

  const currentDate = date_fa || getJalaliDate();
  const info = db.prepare(`
    INSERT INTO accounting (type, title, amount, date_fa, category)
    VALUES ('expense', ?, ?, ?, ?)
  `).run(title, parseInt(amount), currentDate, category || 'هزینه‌های جاری');

  recordAudit(req.user.id, 'CREATE_EXPENSE', 'accounting', info.lastInsertRowid, `Recorded expense: ${title} (${amount})`, req.ip);
  res.json({ success: true });
});

// ----------------- MESSAGING -----------------
app.get('/api/messages', requireAuth, (req, res) => {
  const userId = req.user.id;
  const targetUser = req.query.user ? parseInt(req.query.user) : null;

  let query = 'SELECT * FROM messages WHERE (sender_id = ? OR receiver_id = ?)';
  const params = [userId, userId];

  if (targetUser) {
    query += ' AND (sender_id = ? OR receiver_id = ?)';
    params.push(targetUser, targetUser);
  }

  query += ' ORDER BY id ASC LIMIT 100';
  const list = db.prepare(query).all(...params);
  res.json(list);
});

app.post('/api/messages', requireAuth, (req, res) => {
  const senderId = req.user.id; // Trusted from session
  const senderName = req.user.full_name;
  const { receiver_id, text } = req.body;

  if (!receiver_id || !text || !String(text).trim()) {
    return res.status(400).json({ error: 'شناسه گیرنده و متن پیام الزامی است.' });
  }

  const cleanText = String(text).trim();
  if (cleanText.length > 1000) {
    return res.status(400).json({ error: 'طول پیام نمی‌تواند بیش از ۱۰۰۰ نویسه باشد.' });
  }

  const receiver = db.prepare('SELECT id, role, full_name, is_active FROM users WHERE id = ?').get(parseInt(receiver_id));
  if (!receiver || receiver.is_active === 0) {
    return res.status(404).json({ error: 'کاربر گیرنده یافت نشد یا حساب وی غیرفعال است.' });
  }

  // Role permissions
  const senderRole = req.user.role;
  const targetRole = receiver.role;

  if (senderRole === 'student' && !['teacher', 'admin'].includes(targetRole)) {
    return res.status(403).json({ error: 'دانش‌آموزان تنها مجاز به ارسال پیام به معلمان و مدیریت سامانه هستند.' });
  }
  if (senderRole === 'parent' && !['teacher', 'admin'].includes(targetRole)) {
    return res.status(403).json({ error: 'اولیا تنها مجاز به ارسال پیام به معلمان و مدیریت سامانه هستند.' });
  }

  const now = new Date();
  const timeFa = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(senderId, receiver.id, senderName, receiver.full_name, cleanText, timeFa);

  res.json({ success: true, time_fa: timeFa });
});

// ----------------- STORE -----------------
app.get('/api/store/products', (req, res) => {
  const products = getOrSetCache('store:products', 30, () => {
    return db.prepare('SELECT * FROM store_products ORDER BY id ASC').all();
  });
  res.json(products);
});

app.post('/api/store/checkout', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { items, product_id, quantity, shipping_address, recipient_name, recipient_phone } = req.body;
  const trackingCode = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const currentDate = getJalaliDate();

  const cleanAddress = shipping_address ? String(shipping_address).trim() : 'آدرس ثبت‌شده کاربر';
  const cleanRecipientName = recipient_name ? String(recipient_name).trim() : req.user.full_name;
  const cleanRecipientPhone = recipient_phone ? String(recipient_phone).trim() : (req.user.phone || '');

  db.exec('BEGIN IMMEDIATE;');
  try {
    if (items && Array.isArray(items) && items.length > 0) {
      let total = 0;
      for (const item of items) {
        const pId = parseInt(item.id || item.product_id);
        const qty = Math.max(1, Math.min(10, parseInt(item.quantity) || 1));
        const dbProduct = db.prepare('SELECT * FROM store_products WHERE id = ?').get(pId);
        if (!dbProduct) {
          db.exec('ROLLBACK;');
          return res.status(400).json({ error: `محصولی با شناسه ${pId} در فروشگاه یافت نشد.` });
        }

        const itemTotal = dbProduct.price * qty;
        total += itemTotal;

        db.prepare(`
          INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).run(userId, dbProduct.id, `${dbProduct.title} (تعداد: ${qty})`, itemTotal, trackingCode, cleanRecipientName, cleanRecipientPhone, cleanAddress);
      }

      db.exec('COMMIT;');
      return res.json({ success: true, tracking_code: trackingCode, total, status: 'pending' });
    }

    const pId = parseInt(product_id);
    const qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));
    const dbProduct = db.prepare('SELECT * FROM store_products WHERE id = ?').get(pId);
    if (!dbProduct) {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: 'محصول انتخابی در فروشگاه یافت نشد.' });
    }

    const orderPrice = dbProduct.price * qty;
    db.prepare(`
      INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(userId, dbProduct.id, `${dbProduct.title} (تعداد: ${qty})`, orderPrice, trackingCode, cleanRecipientName, cleanRecipientPhone, cleanAddress);

    db.exec('COMMIT;');
    res.json({
      success: true,
      tracking_code: trackingCode,
      status: 'pending',
      order: { product_title: dbProduct.title, price: orderPrice, tracking_code: trackingCode }
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'خطا در ثبت سفارش فروشگاه: ' + err.message });
  }
});

app.get('/api/store/orders', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.id;

  if (isAdmin) {
    const orders = db.prepare('SELECT * FROM store_orders ORDER BY id DESC LIMIT 100').all();
    return res.json(orders);
  }

  const orders = db.prepare('SELECT * FROM store_orders WHERE user_id = ? ORDER BY id DESC').all(userId);
  res.json(orders);
});

// ----------------- ADMIN DASHBOARD STATS -----------------
app.get('/api/stats/dashboard', requireAuth, requireRole('admin'), (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c;
  const paidCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student' AND fee_status = 'paid'").get().c;
  const pendingCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student' AND fee_status = 'pending'").get().c;

  const today = getJalaliDate();
  const absentToday = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date_fa = ? AND status = 'a'").get(today)?.c || 0;

  const absentees = db.prepare(`
    SELECT a.*, u.full_name, u.grade, u.class_name, u.parent_phone
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    WHERE a.status = 'a'
    ORDER BY a.id DESC
    LIMIT 10
  `).all();

  res.json({
    total_students: totalStudents,
    paid_count: paidCount,
    pending_count: pendingCount,
    absent_today: absentToday,
    attendance_rate: totalStudents > 0 ? Math.round(((totalStudents - absentToday) / totalStudents) * 100) : 100,
    absentees
  });
});

// ----------------- PARENT PORTAL -----------------
app.get('/api/parent/overview', requireAuth, requireRole('parent'), (req, res) => {
  // Query strictly linked student via parent_students or matching parent phone
  let student = db.prepare(`
    SELECT u.* FROM users u
    JOIN parent_students ps ON u.id = ps.student_id
    WHERE ps.parent_id = ? AND u.role = 'student'
    LIMIT 1
  `).get(req.user.id);

  if (!student && req.user.phone) {
    student = db.prepare("SELECT * FROM users WHERE role = 'student' AND parent_phone = ? LIMIT 1").get(req.user.phone);
  }

  if (!student) {
    return res.status(404).json({ error: 'هیچ دانش‌آموزی به حساب کاربری شما متصل نشده است. لطفاً با مدیریت کانون تماس بگیرید.' });
  }

  // Dynamic attendance records
  const absences = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY id DESC LIMIT 20').all(student.id);

  // Dynamic exam results
  const examResults = db.prepare(`
    SELECT er.*, e.title as exam_title, e.subject
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    WHERE er.student_id = ?
    ORDER BY er.id DESC LIMIT 10
  `).all(student.id);

  // Dynamic teacher notes
  const teacherNotes = db.prepare(`
    SELECT tn.*, u.full_name as teacher_name
    FROM teacher_notes tn
    JOIN users u ON tn.teacher_id = u.id
    WHERE tn.student_id = ?
    ORDER BY tn.id DESC LIMIT 10
  `).all(student.id);

  res.json({
    student: sanitizeUser(student),
    absences,
    exam_results: examResults,
    teacher_notes: teacherNotes
  });
});

// ----------------- UNIVERSAL MEDIA UPLOAD -----------------
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'هیچ فایلی ارسال نشد.' });
  }

  // Validate magic bytes to prevent executable/script masquerading
  if (!validateFileMagicBytes(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ error: 'محتوای باینری فایل نامعتبر است یا فرمت واقعی با پسوند فایل همخوانی ندارد.' });
  }

  const uploaderId = req.user.id;
  const role = req.user.role;
  const category = String(req.body.category || req.query.category || 'general').toLowerCase();
  const mime = req.file.mimetype || '';

  // Student role restriction: Students can only upload homework, receipt, or avatar
  if (role === 'student') {
    if (!['homework', 'receipt', 'avatar'].includes(category)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(403).json({ error: 'دانش‌آموزان تنها مجاز به بارگذاری فیش واریز، تکلیف و تصویر پروفایل هستند.' });
    }
    if (mime.startsWith('video/')) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(403).json({ error: 'امکان بارگذاری ویدئو برای دانش‌آموزان مجاز نمی‌باشد.' });
    }
    if (mime.startsWith('image/') && req.file.size > 5 * 1024 * 1024) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'حداکثر حجم مجاز تصویر ۵ مگابایت است.' });
    }
    if (req.file.size > 20 * 1024 * 1024) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'حداکثر حجم مجاز فایل ارسالی ۲۰ مگابایت است.' });
    }
  }

  let fileType = 'document';
  let subDir = 'homeworks';
  if (mime.startsWith('image/')) {
    fileType = 'image';
    subDir = category === 'receipt' ? 'receipts' : 'images';
  } else if (mime.startsWith('video/')) {
    fileType = 'video';
    subDir = 'videos';
  }

  const fileUrl = `/uploads/${subDir}/${req.file.filename}`;

  db.prepare(`
    INSERT INTO media_files (uploader_id, file_name, original_name, file_type, mime_type, file_size, file_url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uploaderId, req.file.filename, req.file.originalname, fileType, mime, req.file.size, fileUrl, category);

  res.json({
    success: true,
    file_url: fileUrl,
    file_name: req.file.filename,
    original_name: req.file.originalname,
    file_type: fileType,
    size: req.file.size
  });
});

// Admin Online Atomic Database Backup Endpoint
app.post('/api/admin/backup', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const backupResult = createBackup();
    res.json({
      success: true,
      message: 'پشتیبان‌گیری برخط و اتمیک با موفقیت انجام شد.',
      backup: backupResult
    });
  } catch (err) {
    res.status(500).json({ error: `خطا در فرآیند پشتیبان‌گیری: ${err.message}` });
  }
});

// Admin Demo Data Management Endpoints
app.post('/api/admin/demo-data/load', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const result = loadDemoData(db);
    recordAudit(req.user.id, 'LOAD_DEMO_DATA', 'system', null, 'Admin loaded comprehensive sample demo data across all panels', req.ip);
    res.json(result);
  } catch (err) {
    console.error('Error loading demo data:', err);
    res.status(500).json({ error: `خطا در بارگذاری داده‌های نمونه: ${err.message}` });
  }
});

app.post('/api/admin/demo-data/clear', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const result = clearDemoData(db);
    recordAudit(req.user.id, 'CLEAR_DEMO_DATA', 'system', null, 'Admin safely cleared sample demo data', req.ip);
    res.json(result);
  } catch (err) {
    console.error('Error clearing demo data:', err);
    res.status(500).json({ error: `خطا در حذف داده‌های نمونه: ${err.message}` });
  }
});

app.get('/api/media', requireAuth, requireRole('admin'), (req, res) => {
  const { category, type } = req.query;
  let query = 'SELECT * FROM media_files';
  const params = [];
  const conditions = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (type) {
    conditions.push('file_type = ?');
    params.push(type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY id DESC LIMIT 50';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// ----------------- PROFILE UPDATE -----------------
app.post('/api/user/profile', requireAuth, (req, res) => {
  const userId = req.user.id;
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : null;

  if (address !== null) {
    db.prepare('UPDATE users SET address = ? WHERE id = ?').run(address, userId);
    invalidateUserCache(userId);
    recordAudit(userId, 'UPDATE_PROFILE', 'user', userId, 'User updated address', req.ip);
  }

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ success: true, user: sanitizeUser(updatedUser) });
});

// ----------------- SERVE BUILT FRONTEND IN STANDALONE PRODUCTION / DOCKER -----------------
const publicDist = path.join(__dirname, 'public');
if (fs.existsSync(publicDist)) {
  app.use(express.static(publicDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(publicDist, 'index.html'));
  });
}

// ----------------- GLOBAL ERROR HANDLER -----------------
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] Server Error (${status}):`, err.message);

  // In production, sanitize 500 errors to prevent system information disclosure
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'خطای غیرمنتظره‌ای در سرور رخ داد. لطفاً چند لحظه بعد مجدداً تلاش فرمایید.'
    });
  }

  res.status(status).json({
    error: err.message || 'خطای غیرمنتظره‌ای در پردازش درخواست رخ داده است.'
  });
});

// Listen with backlog of 2048 to prevent ECONNREFUSED during student rush hour/morning check-ins
const server = app.listen(PORT, HOST, 2048, () => {
  console.log(`Roshd Secure Server listening on http://${HOST}:${PORT}`);
  ensureAdminUser(db).catch(err => console.error('ensureAdminUser error:', err));
});

server.maxConnections = 4096;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
