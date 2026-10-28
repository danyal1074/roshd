const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { createBackup } = require('./backup');

// Ensure tables exist
const { initDb } = require('./db');

function seedProduction() {
  console.log('[SEED] Checking production database status...');
  const existingAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
  
  if (existingAdmin) {
    console.log('[SEED] Production admin account already exists. No seeding required.');
    return true;
  }

  const adminNatId = process.env.ADMIN_NATIONAL_ID || '0011223344';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(8).toString('hex');
  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  const insertAdmin = db.prepare(`
    INSERT INTO users (
      role, national_id, phone, password, first_name, last_name, full_name,
      must_change_password, token_version, is_active
    ) VALUES (
      'admin', ?, ?, ?, 'مدیریت', 'سامانه', 'مدیر کل سامانه رشد',
      1, 1, 1
    )
  `);

  insertAdmin.run(adminNatId, '09120000000', passwordHash);

  // Initialize essential production settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('brand_name', 'کانون نخبه‌پروری شهید کاظم آشتیانی');
  insertSetting.run('platform_name', 'پلتفرم رشد');
  insertSetting.run('card_number', '۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰');
  insertSetting.run('card_holder', 'کانون نخبه‌پروری آشتیانی');
  insertSetting.run('shaba_number', 'IR000000000000000000000000');
  insertSetting.run('bank_name', 'بانک ملی ایران');
  insertSetting.run('contact_phone', '۰۲۱-۸۸۸۸۴۴۲۲');
  insertSetting.run('address', 'تهران، خیابان آزادی، پلاک ۱۲');

  // Initialize default fee definitions per grade
  const insertFee = db.prepare('INSERT OR IGNORE INTO fee_defs (grade, amount, deadline_fa, lock_date_fa, is_locked) VALUES (?, ?, ?, ?, ?)');
  insertFee.run('هفتم', 1500000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);
  insertFee.run('هشتم', 1650000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);
  insertFee.run('نهم', 1800000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);

  console.log(`
================================================================
       PRODUCTION INITIAL ADMIN ACCOUNT CREATED SUCCESSFULLY    
================================================================
  National ID:        ${adminNatId}
  Temporary Password: ${adminPassword}
  Requirement:        must_change_password=1
  NOTE: This password is displayed ONLY ONCE. Please log in
        and set a new strong password immediately.
================================================================
  `);
  return true;
}

function seedDevelopment(force = false) {
  console.log('--- Starting Seeding 450 Students and Full Platform Data for Local Dev ---');

  const existingCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (!force && process.argv.includes('--force') === false) {
    const prodCount = db.prepare('SELECT COUNT(*) as count FROM store_products').get().count;
    if (existingCount >= 450 && prodCount > 0) {
      console.log(`Database already has ${existingCount} users and complete dev data. Skipping seed.`);
      return true;
    }
  }

  // Automatic backup before table deletion
  if (existingCount > 0) {
    console.log('[SEED] Creating automatic pre-seed database backup...');
    try {
      createBackup();
    } catch (e) {
      console.warn('[SEED] Backup warning:', e.message);
    }
  }

  // Clear tables
  db.exec(`
    DELETE FROM users;
    DELETE FROM settings;
    DELETE FROM notices;
    DELETE FROM notice_views;
    DELETE FROM attendance;
    DELETE FROM homeworks;
    DELETE FROM homework_submissions;
    DELETE FROM exams;
    DELETE FROM exam_results;
    DELETE FROM study_sessions;
    DELETE FROM points_log;
    DELETE FROM fee_defs;
    DELETE FROM fee_receipts;
    DELETE FROM accounting;
    DELETE FROM messages;
    DELETE FROM store_products;
    DELETE FROM store_orders;
    DELETE FROM parent_students;
    DELETE FROM teacher_classes;
    DELETE FROM teacher_notes;
    DELETE FROM exam_attempts;
  `);

  // 1. Settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('brand_name', 'کانون نخبه‌پروری شهید کاظم آشتیانی');
  insertSetting.run('platform_name', 'پلتفرم رشد');
  insertSetting.run('card_number', '۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰');
  insertSetting.run('card_holder', 'کانون نخبه‌پروری آشتیانی');
  insertSetting.run('shaba_number', 'IR120170000000109988776655');
  insertSetting.run('bank_name', 'بانک ملی ایران');
  insertSetting.run('contact_phone', '۰۲۱-۸۸۸۸۴۴۲۲');
  insertSetting.run('address', 'تهران، میدان انقلاب، خیابان آزادی، پلاک ۱۲');
  insertSetting.run('slogan', 'هر روز، یک پله بالاتر');

  // 2. Base Admin & Teachers with bcrypt hashes
  const devPw = bcrypt.hashSync('Admin@Pass2026', 10);
  const teacherPw = bcrypt.hashSync('Teacher@Pass2026', 10);
  const studentPw = bcrypt.hashSync('Student@Pass2026', 10);
  const parentPw = bcrypt.hashSync('Parent@Pass2026', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (
      role, national_id, phone, password, first_name, last_name, full_name,
      grade, class_name, school_name, birth_date, address, parent_phone, parent_name,
      level, level_title, total_points, rank, fee_status, is_locked, must_change_password, token_version, is_active
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, 1, 1
    )
  `);

  // Admin
  insertUser.run(
    'admin', '0011223344', '09121110001', devPw,
    'محمد', 'کریمی', 'محمد کریمی',
    null, null, null, '۱۳۶۵/۰۴/۱۵', 'تهران، میرداماد', null, null,
    10, 'مدیر ارشد', 9999, 1, 'paid', 0, 0
  );

  // Teachers
  insertUser.run(
    'teacher', '0022334455', '09121110002', teacherPw,
    'فاطمه', 'احمدی', 'فاطمه احمدی',
    'هفتم', 'الف', 'شهید بهشتی', '۱۳۷۰/۰۸/۲۲', 'تهران، سعادت‌آباد', null, null,
    5, 'دبیر نمونه علوم', 4500, 1, 'paid', 0, 0
  );
  insertUser.run(
    'teacher', '0033445566', '09121110003', teacherPw,
    'علی', 'حسینی', 'علی حسینی',
    'هشتم', 'الف', 'فرزانگان', '۱۳۶۸/۰۲/۱۰', 'تهران، یوسف‌آباد', null, null,
    6, 'دبیر ریاضیات', 4800, 1, 'paid', 0, 0
  );
  insertUser.run(
    'teacher', '0044556677', '09121110004', teacherPw,
    'زهرا', 'موسوی', 'زهرا موسوی',
    'نهم', 'ب', 'امام خمینی', '۱۳۷۲/۱۱/۰۵', 'تهران، شهرک غرب', null, null,
    4, 'مشاور تحصیلی', 3900, 1, 'paid', 0, 0
  );

  // Student 1 (Ali Rezaei)
  insertUser.run(
    'student', '0088776655', '09129876543', studentPw,
    'علی', 'رضایی', 'علی رضایی',
    'هفتم', 'الف', 'شهید بهشتی', '۱۳۹۰/۰۸/۰۶', 'تهران، ونک، خ ملاصدرا، پلاک ۴۰', '09121112233', 'مهدی رضایی',
    3, 'پیشرو دانش', 840, 4, 'paid', 0, 0
  );

  // Parent (Mehdi Rezaei)
  insertUser.run(
    'parent', '09121112233', '09121112233', parentPw,
    'مهدی', 'رضایی', 'مهدی رضایی',
    null, null, null, '۱۳۶۰/۰۳/۱۲', 'تهران، ونک، خ ملاصدرا، پلاک ۴۰', null, null,
    1, 'ولی دانش‌آموز', 100, 1, 'paid', 0, 0
  );

  // Link Parent to Student
  const insertParentStudent = db.prepare('INSERT OR IGNORE INTO parent_students (parent_id, student_id) VALUES (?, ?)');
  insertParentStudent.run(6, 5); // parent user_id=6, student user_id=5

  // Assign Teacher Classes
  const insertTeacherClass = db.prepare('INSERT OR IGNORE INTO teacher_classes (teacher_id, grade, class_name) VALUES (?, ?, ?)');
  insertTeacherClass.run(2, 'هفتم', 'الف');
  insertTeacherClass.run(2, 'هفتم', 'ب');
  insertTeacherClass.run(3, 'هشتم', 'الف');
  insertTeacherClass.run(4, 'نهم', 'الف');
  insertTeacherClass.run(4, 'نهم', 'ب');

  // Generate cohort of students
  const firstNames = ['امیرعلی', 'محمدطاها', 'ابوالفضل', 'امیرعباس', 'علی‌اصغر', 'محمدحسین', 'محمدمهدی', 'حسین', 'امیرحسین', 'کیان', 'ایلیا', 'پارسا', 'آریا', 'مهدی', 'سامیار', 'امیرمحمد', 'یاسین', 'دانیال', 'علی', 'رضا'];
  const lastNames = ['محمدی', 'حسینی', 'احمدی', 'کریمی', 'موسوی', 'جعفری', 'قاسمی', 'مرادی', 'صادقی', 'حیدری', 'رضایی', 'رحیمی', 'طاهری', 'عباسی', 'ابراهیمی', 'نجفی', 'کاظمی', 'فرهادی', 'اکبری', 'فتحی'];
  const grades = ['هفتم', 'هشتم', 'نهم'];
  const classes = ['الف', 'ب'];
  const schools = ['شهید بهشتی', 'فرزانگان', 'امام خمینی'];

  let count = 6;
  for (let g = 0; g < grades.length; g++) {
    for (let c = 0; c < classes.length; c++) {
      for (let i = 0; i < 75; i++) {
        count++;
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${fn} ${ln}`;
        const natId = '00' + String(count).padStart(8, '0');
        const parentPhone = '0912' + String(1000000 + count);
        const birthDate = '۱۳۹۰/' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '/' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const points = 200 + Math.floor(Math.random() * 800);
        const level = Math.floor(points / 200) + 1;
        const feeStatus = Math.random() > 0.25 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'unpaid');

        insertUser.run(
          'student', natId, parentPhone, studentPw, fn, ln, fullName,
          grades[g], classes[c], schools[Math.floor(Math.random() * schools.length)],
          birthDate, 'تهران، خیابان ولیعصر', parentPhone, `پدر ${fn}`,
          level, 'نوآموز', points, (i % 25) + 1, feeStatus, 0, 0
        );
      }
    }
  }

  // Fee definitions
  const insertFee = db.prepare('INSERT INTO fee_defs (grade, amount, deadline_fa, lock_date_fa, is_locked) VALUES (?, ?, ?, ?, ?)');
  insertFee.run('هفتم', 1500000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);
  insertFee.run('هشتم', 1650000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);
  insertFee.run('نهم', 1800000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);

  // Store Products
  const insertProd = db.prepare(`
    INSERT INTO store_products (title, type, price, old_price, badge, icon, bg_color, meta, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProd.run(
    'دوره جامع تیزهوشان ریاضی هفتم',
    'course', 850000, 1100000, 'پرفروش', 'sigma',
    'linear-gradient(135deg,#1E90FF,#0A4BD6)', '۲۰ جلسه ویدیویی + آزمون هفتگی',
    'آموزش مفهومی و تکنیک‌های تست‌زنی ریاضی تیزهوشان همراه با حل نمونه سوالات آزمون‌های ورودی'
  );
  insertProd.run(
    'بسته طلایی جزوات جامع علوم تجربی',
    'booklet', 320000, 400000, 'تخفیف ویژه', 'flask-conical',
    'linear-gradient(135deg,#FFD25A,#FFC531)', '۱۴۰ صفحه تمام‌رنگی + نمونه سوال با پاسخ تشریحی',
    'خلاصه نموداری درس‌ها، آزمایش‌های کاربردی و بانک سوالات تستی طبقه‌بندی شده'
  );

  console.log(`--- Dev Seeding Completed: ${count} users created! ---`);
  return true;
}

function seed(force = false) {
  if (process.env.NODE_ENV === 'production') {
    return seedProduction();
  }

  if (process.argv.includes('--dev') || force) {
    return seedDevelopment(force);
  }

  console.log('[SEED] Run with --dev to populate 450 sample development students.');
  return false;
}

if (require.main === module) {
  seed();
}

module.exports = { seed, seedProduction, seedDevelopment };
