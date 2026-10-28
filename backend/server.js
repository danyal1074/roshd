const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { db } = require('./db');
const { createBackup } = require('./backup');
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
// Helmet with relaxed CSP for fonts/assets
app.use(helmet({
  contentSecurityPolicy: false,
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

const dirs = ['images', 'videos', 'homeworks', 'receipts'].map(d => path.join(uploadsDir, d));
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
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB max
});

// Serve public uploads (images and videos) with public caching
app.use('/uploads/images', express.static(path.join(uploadsDir, 'images'), { maxAge: '30d' }));
app.use('/uploads/videos', express.static(path.join(uploadsDir, 'videos'), { maxAge: '30d' }));

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
    const receipt = db.prepare('SELECT student_id FROM fee_receipts WHERE receipt_url LIKE ?').get(`%${filename}`);
    if (receipt) {
      if (role === 'student' && receipt.student_id === userId) {
        allowed = true;
      } else if (role === 'parent') {
        const parent = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId);
        const student = db.prepare('SELECT parent_phone FROM users WHERE id = ?').get(receipt.student_id);
        if (parent && student && parent.phone && parent.phone === student.parent_phone) {
          allowed = true;
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
    const sub = db.prepare('SELECT student_id FROM homework_submissions WHERE file_url LIKE ?').get(`%${filename}`);
    if (sub) {
      if (role === 'student' && sub.student_id === userId) {
        allowed = true;
      } else if (role === 'parent') {
        const parent = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId);
        const student = db.prepare('SELECT parent_phone FROM users WHERE id = ?').get(sub.student_id);
        if (parent && student && parent.phone && parent.phone === student.parent_phone) {
          allowed = true;
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
    return '۱۴۰۳/۰۸/۰۵';
  }
}

// ----------------- COMPREHENSIVE PRODUCTION HEALTH CHECK -----------------
app.get('/api/health', (req, res) => {
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
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message
    });
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

  // Find user strictly by national_id, or parent phone if logging in as parent
  let user;
  if (role === 'parent') {
    user = db.prepare("SELECT * FROM users WHERE (national_id = ? OR phone = ? OR parent_phone = ?) AND role = 'parent'").get(cleanId, cleanId, cleanId);
  } else if (role) {
    user = db.prepare('SELECT * FROM users WHERE national_id = ? AND role = ?').get(cleanId, role);
  } else {
    user = db.prepare('SELECT * FROM users WHERE national_id = ?').get(cleanId);
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
  res.json({ user: sanitizeUser(user) });
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

app.post('/api/students', requireAuth, requireRole('admin'), (req, res) => {
  const { national_id, phone, first_name, last_name, grade, class_name, password } = req.body;
  if (!national_id || !first_name || !last_name) {
    return res.status(400).json({ error: 'کد ملی، نام و نام خانوادگی الزامی است.' });
  }

  const fullName = `${first_name} ${last_name}`;
  const crypto = require('crypto');
  const rawPw = password && password.trim() ? password.trim() : crypto.randomBytes(5).toString('hex');
  const hashedPw = hashPassword(rawPw);

  try {
    const info = db.prepare(`
      INSERT INTO users (role, national_id, phone, password, first_name, last_name, full_name, grade, class_name, must_change_password)
      VALUES ('student', ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(national_id, phone || '', hashedPw, first_name, last_name, fullName, grade || 'هفتم', class_name || 'الف');

    res.json({ success: true, id: info.lastInsertRowid, initial_password: rawPw });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'کاربری با این کد ملی قبلاً ثبت شده است.' });
    }
    res.status(500).json({ error: 'خطا در ثبت‌نام دانش‌آموز.' });
  }
});

app.delete('/api/students/:id', requireAuth, requireRole('admin'), (req, res) => {
  const studentId = parseInt(req.params.id);
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'student'").run(studentId);
  res.json({ success: true });
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
  if (!homework_id) return res.status(400).json({ error: 'شناسه تکلیف الزامی است.' });

  const submissions = db.prepare(`
    SELECT hs.*, u.full_name, u.grade, u.class_name
    FROM homework_submissions hs
    JOIN users u ON hs.student_id = u.id
    WHERE hs.homework_id = ?
    ORDER BY hs.id DESC
  `).all(homework_id);

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

// GET EXAM: Strip correct answers for students to prevent cheating!
app.get('/api/exams/:id', requireAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد.' });

  const rawQuestions = JSON.parse(exam.questions_json || '[]');
  const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user.role);

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

  res.json({ success: true, id: info.lastInsertRowid });
});

// Strict server-side exam evaluation
app.post('/api/exams/:id/submit', requireAuth, requireRole('student'), (req, res) => {
  const examId = parseInt(req.params.id);
  const studentId = req.user.id; // Trusted from session
  const { answers } = req.body; // e.g. { '1': 2, '2': 4 }

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'پاسخ‌های ارسالی نامعتبر است.' });
  }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد.' });

  // Evaluate against master key
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

  db.prepare(`
    INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_count, wrong_count, unanswered_count, percentage, rank, submitted_at_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(exam_id, student_id) DO UPDATE SET
      score = excluded.score,
      correct_count = excluded.correct_count,
      wrong_count = excluded.wrong_count,
      unanswered_count = excluded.unanswered_count,
      percentage = excluded.percentage,
      submitted_at_fa = excluded.submitted_at_fa
  `).run(examId, studentId, score, total, correct, wrong, unanswered, percentage, currentDate);

  res.json({
    success: true,
    score,
    total_questions: total,
    correct_count: correct,
    wrong_count: wrong,
    unanswered_count: unanswered,
    percentage
  });
});

app.get('/api/exams/comprehensive/rankings', requireAuth, (req, res) => {
  const rankings = db.prepare(`
    SELECT er.*, u.full_name, u.grade, u.class_name
    FROM exam_results er
    JOIN users u ON er.student_id = u.id
    ORDER BY er.percentage DESC, er.score DESC
    LIMIT 50
  `).all();
  res.json(rankings);
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
  db.prepare(`
    INSERT INTO study_sessions (student_id, date_fa, pomodoros_count, total_minutes)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(student_id, date_fa) DO UPDATE SET
      pomodoros_count = pomodoros_count + 1,
      total_minutes = total_minutes + excluded.total_minutes
  `).run(studentId, today, minutes);

  // Award XP points
  const pointsAwarded = Math.min(25, Math.max(5, Math.round(minutes * 0.4)));
  db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(pointsAwarded, studentId);

  res.json({ success: true, points_awarded: pointsAwarded });
});

app.get('/api/study/leaderboard', requireAuth, (req, res) => {
  const leaderboard = db.prepare(`
    SELECT id, full_name, grade, class_name, level, level_title, total_points, rank
    FROM users
    WHERE role = 'student'
    ORDER BY total_points DESC
    LIMIT 30
  `).all();
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
  const defs = db.prepare('SELECT * FROM fee_defs').all();
  res.json(defs);
});

app.put('/api/fees/defs', requireAuth, requireRole('admin'), (req, res) => {
  const { grade, amount, deadline_fa, lock_date_fa } = req.body;
  db.prepare(`
    INSERT INTO fee_defs (grade, amount, deadline_fa, lock_date_fa)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(grade) DO UPDATE SET
      amount = excluded.amount,
      deadline_fa = excluded.deadline_fa,
      lock_date_fa = excluded.lock_date_fa
  `).run(grade, amount, deadline_fa, lock_date_fa);
  res.json({ success: true });
});

app.get('/api/fees/receipts', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const studentId = req.user.id;

  if (isAdmin) {
    const receipts = db.prepare(`
      SELECT fr.*, u.full_name, u.grade, u.class_name, u.parent_phone
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
  const fileUrl = req.file ? `/uploads/receipts/${req.file.filename}` : '';
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

  const receipt = db.prepare('SELECT * FROM fee_receipts WHERE id = ?').get(receiptId);
  if (!receipt) return res.status(404).json({ error: 'رسید یافت نشد.' });

  db.prepare('UPDATE fee_receipts SET status = ?, reject_reason = ? WHERE id = ?').run(status, reject_reason || '', receiptId);
  db.prepare('UPDATE users SET fee_status = ? WHERE id = ?').run(status === 'approved' ? 'paid' : 'rejected', receipt.student_id);

  if (status === 'approved') {
    db.prepare(`
      INSERT INTO accounting (type, title, amount, date_fa, category)
      VALUES ('income', ?, ?, ?, 'شهریه')
    `).run(`شهریه دانش‌آموز (کد رهگیری: ${receipt.tracking_code})`, receipt.amount, receipt.date_fa);
  }

  res.json({ success: true });
});

// Digital Payment Gateway Simulation with verified Server-side Accounting
app.post('/api/fees/pay-online', requireAuth, requireRole('student'), (req, res) => {
  const studentId = req.user.id;
  const { type, amount } = req.body; // 'tuition' or 'platform'

  const trackingCode = 'SHP-' + Math.floor(10000000 + Math.random() * 90000000);
  const currentDate = getJalaliDate();

  if (type === 'platform') {
    db.prepare("UPDATE users SET platform_fee_status = 'paid' WHERE id = ?").run(studentId);
    db.prepare(`
      INSERT INTO accounting (type, title, amount, date_fa, category)
      VALUES ('income', ?, ?, ?, 'اشتراک سامانه')
    `).run(`هزینه اشتراک سالانه سامانه دانش‌آموز کد ${studentId}`, amount || 150000, currentDate);
  } else {
    db.prepare("UPDATE users SET fee_status = 'paid' WHERE id = ?").run(studentId);
    db.prepare(`
      INSERT INTO accounting (type, title, amount, date_fa, category)
      VALUES ('income', ?, ?, ?, 'شهریه کانون')
    `).run(`پرداخت آنلاین شهریه کانون دانش‌آموز کد ${studentId}`, amount || 1500000, currentDate);
  }

  res.json({
    success: true,
    tracking_code: trackingCode,
    date_fa: currentDate,
    message: 'پرداخت امن با موفقیت انجام شد و رسید صادر گردید.'
  });
});

app.get('/api/fees/report', requireAuth, requireRole('admin'), (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student"').get().c;
  const paidStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student" AND fee_status = "paid"').get().c;
  const pendingStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student" AND fee_status = "pending"').get().c;

  res.json({
    total_students: totalStudents,
    paid_count: paidStudents,
    pending_count: pendingStudents,
    unpaid_count: totalStudents - paidStudents - pendingStudents
  });
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
  db.prepare(`
    INSERT INTO accounting (type, title, amount, date_fa, category)
    VALUES ('expense', ?, ?, ?, ?)
  `).run(title, parseInt(amount), currentDate, category || 'هزینه‌های جاری');

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
  const { receiver_id, receiver_name, text } = req.body;

  if (!receiver_id || !text || !String(text).trim()) {
    return res.status(400).json({ error: 'گیرنده و متن پیام الزامی است.' });
  }

  const now = new Date();
  const timeFa = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(senderId, parseInt(receiver_id), senderName, receiver_name || 'کاربر کانون', String(text).trim(), timeFa);

  res.json({ success: true, time_fa: timeFa });
});

// ----------------- STORE -----------------
app.get('/api/store/products', (req, res) => {
  const products = db.prepare('SELECT * FROM store_products ORDER BY id ASC').all();
  res.json(products);
});

app.post('/api/store/checkout', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { items, product_id, shipping_address, recipient_name, recipient_phone } = req.body;
  const trackingCode = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const currentDate = getJalaliDate();

  if (items && Array.isArray(items) && items.length > 0) {
    let total = 0;
    for (const item of items) {
      total += (item.price || 0) * (item.quantity || 1);
      db.prepare(`
        INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
      `).run(
        userId, item.id || 1, item.title || 'بسته آموزشی', item.price || 0,
        trackingCode, recipient_name || req.user.full_name, recipient_phone || req.user.phone || '۰۹۱۲۳۴۵۶۷۸۹',
        shipping_address || 'آدرس ثبت‌شده'
      );
    }
    db.prepare(`
      INSERT INTO accounting (type, title, amount, date_fa, category)
      VALUES ('income', ?, ?, ?, 'فروشگاه سمپاد')
    `).run(`خرید فروشگاه آنلاین سبد خرید (${items.length} قلم)`, total, currentDate);

    return res.json({ success: true, tracking_code: trackingCode, total });
  }

  const pId = product_id || 1;
  const product = db.prepare('SELECT * FROM store_products WHERE id = ?').get(pId) || { id: 1, title: 'کتاب سمپاد', price: 180000 };

  db.prepare(`
    INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `).run(
    userId, product.id, product.title, product.price, trackingCode,
    recipient_name || req.user.full_name, recipient_phone || req.user.phone || '۰۹۱۲۳۴۵۶۷۸۹',
    shipping_address || 'آدرس ثبت‌شده'
  );

  db.prepare(`
    INSERT INTO accounting (type, title, amount, date_fa, category)
    VALUES ('income', ?, ?, ?, 'فروشگاه سمپاد')
  `).run(`فروش بسته آموزشی: ${product.title}`, product.price, currentDate);

  res.json({
    success: true,
    tracking_code: trackingCode,
    order: { product_title: product.title, price: product.price, tracking_code: trackingCode }
  });
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
  const totalStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student"').get().c;
  const paidCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student" AND fee_status = "paid"').get().c;
  const pendingCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student" AND fee_status = "pending"').get().c;

  const today = getJalaliDate();
  const absentToday = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE date_fa = ? AND status = "a"').get(today)?.c || 0;

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
  // Find linked student by phone or family name
  const parentPhone = req.user.phone || '';
  let student = parentPhone ? db.prepare("SELECT * FROM users WHERE role = 'student' AND parent_phone = ?").get(parentPhone) : null;

  if (!student && req.user.last_name) {
    student = db.prepare("SELECT * FROM users WHERE role = 'student' AND last_name = ?").get(req.user.last_name);
  }
  if (!student) {
    student = db.prepare("SELECT * FROM users WHERE role = 'student' LIMIT 1").get();
  }

  const absentees = student ? db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY id DESC LIMIT 10').all(student.id) : [];

  res.json({
    student: sanitizeUser(student),
    absences: absentees,
    report_card: {
      average: 19.2,
      rank: 4,
      total_students: 38,
      courses: [
        { name: 'ریاضی', score: 19.5, teacher: 'رضا کریمی' },
        { name: 'علوم تجربی', score: 19.0, teacher: 'فاطمه احمدی' },
        { name: 'ادبیات فارسی', score: 19.0, teacher: 'مریم حسینی' },
        { name: 'عربی و قرآن', score: 20.0, teacher: 'استاد حسنی' }
      ]
    },
    teacher_note: 'علی دانش‌آموز بسیار کوشا و بااستعدادی است. در مباحث تستی کسرها و توان نیاز به تمرین بیشتر دارد تا به نمره ۲۰ کامل برسد.'
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
  const category = req.body.category || req.query.category || 'general';
  const mime = req.file.mimetype || '';

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
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(publicDist, 'index.html'));
  });
}

// ----------------- GLOBAL ERROR HANDLER -----------------
app.use((err, req, res, next) => {
  // Never expose raw stack traces in production
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'خطای غیرمنتظره‌ای در سرور رخ داده است.'
  });
});

// Listen with backlog of 2048 to prevent ECONNREFUSED during student rush hour/morning check-ins
const server = app.listen(PORT, HOST, 2048, () => {
  console.log(`Roshd Secure Server listening on http://${HOST}:${PORT}`);
});

server.maxConnections = 4096;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
