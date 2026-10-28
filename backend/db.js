const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH 
  ? path.resolve(process.env.DB_PATH) 
  : path.join(__dirname, 'rosh.db');

// Ensure database directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

// Enable WAL mode, busy timeout, synchronous normal & foreign keys for high-concurrency production (400+ students)
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

function addColumnIfNotExists(tableName, columnName, definition) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const exists = cols.some(c => c.name === columnName);
    if (!exists) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
    }
  } catch (err) {
    // Ignore if column or table issue
  }
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL, -- student, teacher, parent, admin
      national_id TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      grade TEXT, -- هفتم، هشتم، نهم
      class_name TEXT, -- الف، ب
      school_name TEXT, -- شهید بهشتی، فرزانگان، امام خمینی
      birth_date TEXT,
      address TEXT,
      parent_phone TEXT,
      parent_name TEXT,
      level INTEGER DEFAULT 1,
      level_title TEXT DEFAULT 'نوآموز',
      total_points INTEGER DEFAULT 100,
      rank INTEGER DEFAULT 1,
      fee_status TEXT DEFAULT 'pending', -- paid, pending, unpaid, rejected
      is_locked INTEGER DEFAULT 0,
      must_change_password INTEGER DEFAULT 0,
      token_version INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      platform_fee_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      date_fa TEXT NOT NULL,
      place TEXT DEFAULT 'کانون',
      tag TEXT DEFAULT 'مهم',
      target_audience TEXT DEFAULT 'all', -- all, هفتم, هشتم, نهم, الف, ب
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notice_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notice_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(notice_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_fa TEXT NOT NULL,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL, -- p (present), a (absent), e (excused)
      sms_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date_fa, student_id)
    );

    CREATE TABLE IF NOT EXISTS homeworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL,
      subject TEXT DEFAULT 'عمومی',
      teacher_name TEXT NOT NULL,
      deadline_fa TEXT NOT NULL,
      deadline_timestamp INTEGER NOT NULL,
      points INTEGER DEFAULT 20,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS homework_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      homework_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      submitted_at_fa TEXT NOT NULL,
      file_url TEXT,
      note TEXT,
      is_late INTEGER DEFAULT 0,
      status TEXT DEFAULT 'submitted', -- submitted, late, checked
      grade_score INTEGER,
      feedback TEXT,
      UNIQUE(homework_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL,
      subject TEXT DEFAULT 'عمومی',
      duration_minutes INTEGER DEFAULT 15,
      question_count INTEGER DEFAULT 5,
      questions_json TEXT NOT NULL,
      deadline_fa TEXT,
      start_at INTEGER,
      end_at INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      wrong_count INTEGER NOT NULL,
      unanswered_count INTEGER NOT NULL,
      percentage REAL NOT NULL,
      rank INTEGER,
      submitted_at_fa TEXT NOT NULL,
      UNIQUE(exam_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      UNIQUE(exam_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date_fa TEXT NOT NULL,
      pomodoros_count INTEGER DEFAULT 0,
      total_minutes INTEGER DEFAULT 0,
      last_session_at INTEGER,
      UNIQUE(student_id, date_fa)
    );

    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- plus, minus
      title TEXT NOT NULL,
      points INTEGER NOT NULL,
      date_fa TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fee_defs (
      grade TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      deadline_fa TEXT NOT NULL,
      lock_date_fa TEXT NOT NULL,
      is_locked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fee_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      card_number TEXT,
      tracking_code TEXT,
      receipt_image TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      reject_reason TEXT,
      date_fa TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- income, expense
      title TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date_fa TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      text TEXT NOT NULL,
      time_fa TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- course, booklet
      price INTEGER NOT NULL,
      old_price INTEGER,
      badge TEXT,
      icon TEXT,
      bg_color TEXT,
      meta TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS store_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_title TEXT NOT NULL,
      price INTEGER NOT NULL,
      tracking_code TEXT NOT NULL,
      recipient_name TEXT,
      recipient_phone TEXT,
      shipping_address TEXT,
      status TEXT DEFAULT 'completed', -- completed, processing, cancelled, pending
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploader_id INTEGER,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL, -- image, video, document
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_url TEXT NOT NULL,
      category TEXT DEFAULT 'general', -- avatar, receipt, homework, lecture, store
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parent_students (
      parent_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(parent_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_classes (
      teacher_id INTEGER NOT NULL,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, grade, class_name)
    );

    CREATE TABLE IF NOT EXISTS teacher_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      date_fa TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      details TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance & Security Indexes
    CREATE INDEX IF NOT EXISTS idx_users_role_grade ON users (role, grade);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
    CREATE INDEX IF NOT EXISTS idx_users_parent_phone ON users (parent_phone);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance (student_id, date_fa);
    CREATE INDEX IF NOT EXISTS idx_homework_submissions_student ON homework_submissions (student_id);
    CREATE INDEX IF NOT EXISTS idx_homework_submissions_hw ON homework_submissions (homework_id);
    CREATE INDEX IF NOT EXISTS idx_homeworks_grade_class ON homeworks (grade, class_name);
    CREATE INDEX IF NOT EXISTS idx_exams_grade_class ON exams (grade, class_name);
    CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results (student_id);
    CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results (exam_id);
    CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages (sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_fee_receipts_student ON fee_receipts (student_id);
    CREATE INDEX IF NOT EXISTS idx_media_files_uploader ON media_files (uploader_id);
    CREATE INDEX IF NOT EXISTS idx_points_log_student ON points_log (student_id, id);
    CREATE INDEX IF NOT EXISTS idx_notice_views_user ON notice_views (user_id);
    CREATE INDEX IF NOT EXISTS idx_store_orders_user ON store_orders (user_id);
    CREATE INDEX IF NOT EXISTS idx_parent_students ON parent_students (parent_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_classes ON teacher_classes (teacher_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log (user_id, created_at);
  `);

  // Safe migrations for existing databases
  addColumnIfNotExists('users', 'username', 'TEXT');
  addColumnIfNotExists('users', 'must_change_password', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'token_version', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('users', 'is_active', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('users', 'platform_fee_status', "TEXT DEFAULT 'pending'");
  addColumnIfNotExists('exams', 'start_at', 'INTEGER');
  addColumnIfNotExists('exams', 'end_at', 'INTEGER');
  addColumnIfNotExists('study_sessions', 'last_session_at', 'INTEGER');

  try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username) WHERE username IS NOT NULL;');
  } catch (e) {}
}

initDb();

async function ensureAdminUser(database = db) {
  try {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('danyal1074', 10);
    
    // Check if user with username 'admin' or role 'admin' exists
    const admin = database.prepare("SELECT id, username, role FROM users WHERE username = 'admin' OR role = 'admin'").get();
    if (admin) {
      database.prepare(`
        UPDATE users 
        SET username = 'admin', password = ?, must_change_password = 0, is_active = 1, role = 'admin'
        WHERE id = ?
      `).run(hashed, admin.id);
    } else {
      database.prepare(`
        INSERT INTO users (
          username, role, national_id, phone, password, first_name, last_name, full_name, must_change_password, is_active
        ) VALUES ('admin', 'admin', '0011223344', '09120000000', ?, 'مدیر', 'سامانه', 'مدیر سامانه', 0, 1)
      `).run(hashed);
    }
  } catch (err) {
    console.error('ensureAdminUser error:', err.message);
  }
}

/**
 * Perform an atomic, consistent, non-blocking online backup of SQLite database using VACUUM INTO.
 * Safe under high concurrent writes without locking or torn pages.
 * @param {string} destinationPath
 * @returns {string} resolved destination path
 */
function backupDatabase(destinationPath) {
  const resolved = path.resolve(destinationPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  if (fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
  const escaped = resolved.replace(/'/g, "''");
  db.exec(`VACUUM INTO '${escaped}';`);
  return resolved;
}

module.exports = { db, dbPath, initDb, ensureAdminUser, backupDatabase };
