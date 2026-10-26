const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'rosh.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

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
      is_locked INTEGER DEFAULT 0
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

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date_fa TEXT NOT NULL,
      pomodoros_count INTEGER DEFAULT 0,
      total_minutes INTEGER DEFAULT 0,
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
      status TEXT DEFAULT 'completed', -- completed, processing, cancelled
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
  `);
}

initDb();

module.exports = { db };
