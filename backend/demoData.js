const bcrypt = require('bcryptjs');
const { createBackup } = require('./backup');

function loadDemoData(db) {
  // 1. Always create a backup before modifying data
  try {
    createBackup();
  } catch (e) {
    console.warn('[DEMO_DATA] Backup warning:', e.message);
  }

  // 2. Hash default passwords
  const adminPw = bcrypt.hashSync('danyal1074', 10);
  const teacherPw = bcrypt.hashSync('123456', 10);
  const studentPw = bcrypt.hashSync('123456', 10);
  const parentPw = bcrypt.hashSync('123456', 10);

  db.exec('BEGIN IMMEDIATE;');
  try {
    // Clean old demo data to ensure a fresh, consistent state
    db.exec(`
      DELETE FROM attendance;
      DELETE FROM homework_submissions;
      DELETE FROM homeworks;
      DELETE FROM exam_results;
      DELETE FROM exam_attempts;
      DELETE FROM exams;
      DELETE FROM study_sessions;
      DELETE FROM points_log;
      DELETE FROM fee_receipts;
      DELETE FROM accounting;
      DELETE FROM messages;
      DELETE FROM store_orders;
      DELETE FROM store_products;
      DELETE FROM parent_students;
      DELETE FROM teacher_classes;
      DELETE FROM teacher_notes;
      DELETE FROM notices;
      DELETE FROM notice_views;
    `);

    // Remove old demo students & parents
    db.exec(`
      DELETE FROM users WHERE role IN ('student', 'parent') OR (role = 'teacher' AND phone NOT IN ('09121110002', '09121110003', '09121110004'));
    `);

    // 1. Settings
    const upsertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    upsertSetting.run('brand_name', 'کانون نخبه‌پروری شهید کاظم آشتیانی');
    upsertSetting.run('platform_name', 'پلتفرم رشد');
    upsertSetting.run('slogan', 'هر روز، یک پله بالاتر');
    upsertSetting.run('card_number', '۶۰۳۷-۹۹۷۰-۱۲۳۴-۵۶۷۸');
    upsertSetting.run('card_holder', 'کانون نخبه‌پروری شهید کاظم آشتیانی');
    upsertSetting.run('shaba_number', 'IR120170000000109988776655');
    upsertSetting.run('bank_name', 'بانک ملی ایران');
    upsertSetting.run('contact_phone', '۰۲۱-۸۸۸۸۴۴۲۲');
    upsertSetting.run('address', 'تهران، میدان انقلاب، خیابان آزادی، پلاک ۱۲');
    upsertSetting.run('tuition_rules', 'پرداخت شهریه نیم‌سال اول حداکثر تا ۱۵ آبان‌ماه الزامی است.');
    upsertSetting.run('announcement_banner', 'ثبت‌نام کارگاه‌های آمادگی المپیاد و تیزهوشان آغاز شد.');
    upsertSetting.run('platform_fee_amount', '1500000');

    // 2. Fee Defs
    const upsertFee = db.prepare(`
      INSERT INTO fee_defs (grade, amount, deadline_fa, lock_date_fa, is_locked) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(grade) DO UPDATE SET amount = excluded.amount, deadline_fa = excluded.deadline_fa, lock_date_fa = excluded.lock_date_fa
    `);
    upsertFee.run('هفتم', 1500000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);
    upsertFee.run('هشتم', 1650000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);
    upsertFee.run('نهم', 1800000, '۱۴۰۵/۰۸/۱۵', '۱۴۰۵/۰۸/۳۰', 0);

    // 3. Ensure Admin
    let admin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
    if (!admin) {
      db.prepare(`
        INSERT INTO users (
          role, national_id, phone, username, password, first_name, last_name, full_name,
          level, level_title, total_points, rank, fee_status, is_locked, must_change_password, token_version, is_active
        ) VALUES (
          'admin', '0011223344', '09121110001', 'admin', ?, 'محمد', 'کریمی', 'محمد کریمی (مدیر کانون)',
          10, 'مدیر ارشد کانون', 9999, 1, 'paid', 0, 0, 1, 1
        )
      `).run(adminPw);
      admin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
    } else {
      db.prepare("UPDATE users SET password = ?, username = 'admin', is_active = 1, is_locked = 0 WHERE id = ?").run(adminPw, admin.id);
    }

    // 4. Ensure Teachers
    const upsertTeacher = db.prepare(`
      INSERT INTO users (
        role, national_id, phone, password, first_name, last_name, full_name,
        grade, class_name, school_name, birth_date, address,
        level, level_title, total_points, rank, fee_status, is_locked, must_change_password, token_version, is_active
      ) VALUES (
        'teacher', ?, ?, ?, ?, ?, ?,
        ?, ?, 'شهید بهشتی', '۱۳۶۸/۰۵/۱۵', 'تهران، کارگر شمالی',
        5, 'دبیر کانون', 4500, 1, 'paid', 0, 0, 1, 1
      )
      ON CONFLICT(national_id) DO UPDATE SET password = excluded.password, is_active = 1, is_locked = 0
    `);

    upsertTeacher.run('0022334455', '09121110002', teacherPw, 'فاطمه', 'احمدی', 'فاطمه احمدی (دبیر علوم)', 'هفتم', 'الف');
    upsertTeacher.run('0033445566', '09121110003', teacherPw, 'رضا', 'کریمی', 'رضا کریمی (دبیر ریاضی)', 'هفتم', 'الف');
    upsertTeacher.run('0044556677', '09121110004', teacherPw, 'زهرا', 'موسوی', 'زهرا موسوی (مشاور تحصیلی)', 'نهم', 'الف');

    const teacherFatemeh = db.prepare("SELECT id FROM users WHERE phone = '09121110002'").get();
    const teacherReza = db.prepare("SELECT id FROM users WHERE phone = '09121110003'").get();
    const teacherZahra = db.prepare("SELECT id FROM users WHERE phone = '09121110004'").get();

    // Teacher classes
    const insertTeacherClass = db.prepare('INSERT OR IGNORE INTO teacher_classes (teacher_id, grade, class_name) VALUES (?, ?, ?)');
    if (teacherFatemeh) {
      insertTeacherClass.run(teacherFatemeh.id, 'هفتم', 'الف');
      insertTeacherClass.run(teacherFatemeh.id, 'هفتم', 'ب');
    }
    if (teacherReza) {
      insertTeacherClass.run(teacherReza.id, 'هفتم', 'الف');
      insertTeacherClass.run(teacherReza.id, 'هشتم', 'الف');
    }
    if (teacherZahra) {
      insertTeacherClass.run(teacherZahra.id, 'نهم', 'الف');
      insertTeacherClass.run(teacherZahra.id, 'نهم', 'ب');
    }

    // 5. Star Student (Ali Rezaei)
    const insertUser = db.prepare(`
      INSERT INTO users (
        role, national_id, phone, password, first_name, last_name, full_name,
        grade, class_name, school_name, birth_date, address, parent_phone, parent_name,
        level, level_title, total_points, rank, fee_status, is_locked, must_change_password, token_version, is_active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 0, 1, 1
      )
    `);

    const aliRes = insertUser.run(
      'student', '0088776655', '09129876543', studentPw,
      'علی', 'رضایی', 'علی رضایی',
      'هفتم', 'الف', 'شهید بهشتی', '۱۳۹۰/۰۸/۰۶', 'تهران، ونک، خ ملاصدرا، پلاک ۴۰', '09121112233', 'مهدی رضایی',
      3, 'پیشرو دانش', 850, 2, 'paid', 0
    );
    const aliId = Number(aliRes.lastInsertRowid);

    // Parent (Mehdi Rezaei)
    const parentRes = insertUser.run(
      'parent', '09121112233', '09121112233', parentPw,
      'مهدی', 'رضایی', 'مهدی رضایی (پدر علی رضایی)',
      null, null, null, '۱۳۶۰/۰۳/۱۲', 'تهران، ونک، خ ملاصدرا، پلاک ۴۰', null, null,
      1, 'ولی دانش‌آموز', 100, 1, 'paid', 0
    );
    const parentId = Number(parentRes.lastInsertRowid);

    // Link Parent to Student
    db.prepare('INSERT OR IGNORE INTO parent_students (parent_id, student_id) VALUES (?, ?)').run(parentId, aliId);

    // 6. Generate Realistic Students Cohort
    const firstNames = ['امیرعلی', 'محمدطاها', 'حسین', 'ابوالفضل', 'امیرعباس', 'کیان', 'ایلیا', 'پارسا', 'دانیال', 'مهدی', 'محمدرضا', 'سامیار', 'آرتین', 'یاسین', 'علیرضا', 'بردیا'];
    const lastNames = ['محمدی', 'حسینی', 'احمدی', 'کریمی', 'موسوی', 'جعفری', 'قاسمی', 'مرادی', 'صادقی', 'حیدری', 'طاهری', 'عباسی', 'ابراهیمی', 'کاظمی', 'فرهادی', 'اکبری'];

    const studentIdsByClass = {
      'هفتم-الف': [aliId],
      'هفتم-ب': [],
      'هشتم-الف': [],
      'نهم-الف': []
    };

    let userIdx = 100;
    const classConfigs = [
      { grade: 'هفتم', class_name: 'الف', count: 24 },
      { grade: 'هفتم', class_name: 'ب', count: 25 },
      { grade: 'هشتم', class_name: 'الف', count: 25 },
      { grade: 'نهم', class_name: 'الف', count: 20 }
    ];

    for (const cfg of classConfigs) {
      const key = `${cfg.grade}-${cfg.class_name}`;
      for (let i = 0; i < cfg.count; i++) {
        userIdx++;
        const fn = firstNames[(userIdx + i) % firstNames.length];
        const ln = lastNames[(userIdx * 3 + i) % lastNames.length];
        const natId = '00' + String(10000000 + userIdx);
        const pPhone = '0912' + String(2000000 + userIdx);
        const points = 250 + (i * 27) % 700;
        const level = Math.floor(points / 250) + 1;
        const feeStatus = i % 3 === 0 ? 'paid' : (i % 3 === 1 ? 'pending' : 'unpaid');

        const sRes = insertUser.run(
          'student', natId, pPhone, studentPw,
          fn, ln, `${fn} ${ln}`,
          cfg.grade, cfg.class_name, 'شهید بهشتی',
          '۱۳۹۰/۰۵/۱۰', 'تهران، خیابان آزادی', pPhone, `ولی ${fn}`,
          level, 'نوآموز', points, (i % 25) + 3, feeStatus, 0
        );
        studentIdsByClass[key].push(Number(sRes.lastInsertRowid));
      }
    }

    // 7. Attendance Records (for today and previous days)
    const insertAtt = db.prepare(`
      INSERT OR REPLACE INTO attendance (date_fa, grade, class_name, student_id, status, sms_sent)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const dates = ['۱۴۰۵/۰۸/۰۴', '۱۴۰۵/۰۸/۰۳', '۱۴۰۵/۰۸/۰۲'];
    for (const [classKey, sIds] of Object.entries(studentIdsByClass)) {
      const [grade, className] = classKey.split('-');
      for (const d of dates) {
        sIds.forEach((sid, idx) => {
          let status = 'p'; // present
          if (idx === 3 || idx === 7) status = 'a'; // absent
          else if (idx === 11) status = 'e'; // excused
          insertAtt.run(d, grade, className, sid, status);
        });
      }
    }

    // 8. Homeworks & Submissions
    const insertHw = db.prepare(`
      INSERT INTO homeworks (title, grade, class_name, subject, teacher_name, deadline_fa, deadline_timestamp, points, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const hw1 = insertHw.run(
      'تمرین‌های تحلیلی هوش کلامی و تناسب واژگان',
      'هفتم', 'الف', 'هوش و استعداد', 'فاطمه احمدی',
      '۶ آبان ۱۴۰۵، ساعت ۱۸:۰۰', Date.now() + 86400000 * 2, 20,
      'تمرین‌های بخش ۲ کتاب هوش کمپلکس، صفحات ۴۵ الی ۴۸ را بررسی کرده و پاسخ تشریحی را ارسال نمایید.'
    );
    const hw1Id = Number(hw1.lastInsertRowid);

    const hw2 = insertHw.run(
      'گزارش آزمایش آونگ و محاسبه دوره تناوب',
      'هفتم', 'الف', 'علوم تجربی', 'فاطمه احمدی',
      '۸ آبان ۱۴۰۵، ساعت ۲۱:۰۰', Date.now() + 86400000 * 4, 15,
      'جدول اندازه‌گیری‌های آزمایشگاه را همراه با نمودار تغییرات دوره بر حسب طول نخ رسم و ارسال فرمایید.'
    );
    const hw2Id = Number(hw2.lastInsertRowid);

    const hw3 = insertHw.run(
      'حل مسائل پیشرفته کسرها و اعداد صحیح',
      'هفتم', 'الف', 'ریاضیات', 'رضا کریمی',
      '۱۰ آبان ۱۴۰۵، ساعت ۲۰:۰۰', Date.now() + 86400000 * 6, 20,
      'سوالات ۵ تا ۱۲ آزمون تیزهوشان سال گذشته را با راه‌حل کامل بنویسید.'
    );
    const hw3Id = Number(hw3.lastInsertRowid);

    // Submissions for Ali Rezaei and others
    const insertSub = db.prepare(`
      INSERT INTO homework_submissions (homework_id, student_id, submitted_at_fa, file_url, note, is_late, status, grade_score, feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSub.run(
      hw1Id, aliId, '۴ آبان ۱۴۰۵، ساعت ۱۶:۳۰',
      '/assets/levels_roadmap_modal_live.png',
      'استاد گرامی، تمام تمرین‌ها طبق جزوه حل و در دو صفحه پیوست گردید.',
      0, 'checked', 19, 'آفرین علی جان! استدلال شما در سؤال ۳ بسیار دقیق و هوشمندانه بود.'
    );

    insertSub.run(
      hw2Id, aliId, '۴ آبان ۱۴۰۵، ساعت ۱۸:۰۰',
      null,
      'سلام خانم احمدی، محاسبات جدول آونگ انجام شد و فایل نمودار ضمیمه است.',
      0, 'submitted', null, null
    );

    // Submissions from other students in class
    const other7A = studentIdsByClass['هفتم-الف'].slice(1, 6);
    if (other7A[0]) {
      insertSub.run(hw1Id, other7A[0], '۳ آبان ۱۴۰۵', null, 'ارسال تکالیف هوش کلامی', 0, 'checked', 18, 'خوب بود، به نکات نگارشی هم دقت کن.');
    }
    if (other7A[1]) {
      insertSub.run(hw1Id, other7A[1], '۴ آبان ۱۴۰۵', null, 'حل تمرینات کسرها', 0, 'submitted', null, null);
    }
    if (other7A[2]) {
      insertSub.run(hw2Id, other7A[2], '۴ آبان ۱۴۰۵', null, 'گزارش آزمایشگاه علوم', 0, 'submitted', null, null);
    }

    // 9. Exams & Results
    const insertExam = db.prepare(`
      INSERT INTO exams (title, grade, class_name, subject, duration_minutes, question_count, questions_json, deadline_fa, start_at, end_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const hooshQuestions = JSON.stringify([
      { id: 1, q: 'نسبت «درخت» به «جنگل» مانند نسبت کدام گزینه است؟', options: ['قطره به دریا', 'کتاب به قلم', 'سنگ به کوه', 'برگ به شاخه'], correct: 0 },
      { id: 2, q: 'کدام گزینه مکمل الگوی هندسی چرخش ۹۰ درجه ساعتگرد است؟', options: ['شکل الف', 'شکل ب', 'شکل ج', 'شکل د'], correct: 1 },
      { id: 3, q: 'اگر مساحت مربعی ۶۴ باشد، محیط آن چقدر است؟', options: ['۱۶', '۲۴', '۳۲', '۶۴'], correct: 2 },
      { id: 4, q: 'عدد بعدی در الگوی ۲، ۵، ۱۰، ۱۷، ... کدام است؟', options: ['۲۴', '۲۵', '۲۶', '۲۷'], correct: 2 },
      { id: 5, q: 'کدام کلمه با بقیه کلمات هم‌گروه نیست؟', options: ['استدلال', 'نتیجه‌گیری', 'قضاوت', 'فراموشی'], correct: 3 }
    ]);

    const exam1 = insertExam.run(
      'آزمون جامع تیزهوشان مرحله اول (هوش تحلیلی و منطقی)',
      'هفتم', 'الف', 'هوش و استعداد', 20, 5, hooshQuestions, '۸ آبان ۱۴۰۵، ساعت ۲۲:۰۰',
      Date.now() - 3600000 * 24, Date.now() + 86400000 * 5
    );
    const exam1Id = Number(exam1.lastInsertRowid);

    const exam2 = insertExam.run(
      'آزمون علوم تجربی فصل ۳ (شیمی اتم‌ها)',
      'هفتم', 'الف', 'علوم تجربی', 15, 3,
      JSON.stringify([
        { id: 1, q: 'ذره با بار منفی در مدار اتم کدام است؟', options: ['پروتون', 'نوترون', 'الکترون', 'یون'], correct: 2 },
        { id: 2, q: 'نماد شیمیایی عنصر آهن چیست؟', options: ['Au', 'Fe', 'Ag', 'Cu'], correct: 1 },
        { id: 3, q: 'کدام ترکیب یک مولکول دواتمی است؟', options: ['اکسیژن O2', 'آب H2O', 'متان CH4', 'نمک NaCl'], correct: 0 }
      ]),
      '۱۰ آبان ۱۴۰۵، ساعت ۲۳:۰۰',
      Date.now() - 3600000, Date.now() + 86400000 * 7
    );

    // Exam Results for Ali Rezaei
    const insertResult = db.prepare(`
      INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_count, wrong_count, unanswered_count, percentage, rank, submitted_at_fa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertResult.run(exam1Id, aliId, 16, 5, 4, 1, 0, 80.0, 2, '۲ آبان ۱۴۰۵');
    db.prepare('INSERT OR REPLACE INTO exam_attempts (exam_id, student_id, started_at) VALUES (?, ?, ?)').run(exam1Id, aliId, Date.now() - 86400000 * 2);

    // Add exam results for top students in 7-A
    studentIdsByClass['هفتم-الف'].slice(1, 8).forEach((sid, i) => {
      const correct = 3 + (i % 3);
      const wrong = 5 - correct;
      const pct = (correct / 5) * 100;
      insertResult.run(exam1Id, sid, correct * 4, 5, correct, wrong, 0, pct, i + 3, '۲ آبان ۱۴۰۵');
    });

    // 10. Fee Receipts (Pending, Approved, Rejected)
    const insertReceipt = db.prepare(`
      INSERT INTO fee_receipts (student_id, amount, card_number, tracking_code, receipt_image, status, reject_reason, date_fa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Approved for Ali
    insertReceipt.run(aliId, 1500000, '۶۰۳۷-***-۹۸۴۱', 'TRK-9840129', '/assets/levels_roadmap_modal_live.png', 'approved', null, '۱ آبان ۱۴۰۵');

    // Pending for two other students
    if (studentIdsByClass['هفتم-الف'][1]) {
      insertReceipt.run(studentIdsByClass['هفتم-الف'][1], 1500000, '۵۸۹۲-***-۳۳۰۱', 'TRK-7719204', '/assets/levels_roadmap_modal_live.png', 'pending', null, '۳ آبان ۱۴۰۵');
    }
    if (studentIdsByClass['هفتم-الف'][2]) {
      insertReceipt.run(studentIdsByClass['هفتم-الف'][2], 1500000, '۶۰۳۷-***-۱۱۲۲', 'TRK-6649102', '/assets/levels_roadmap_modal_live.png', 'pending', null, '۴ آبان ۱۴۰۵');
    }
    // Rejected
    if (studentIdsByClass['هفتم-الف'][3]) {
      insertReceipt.run(studentIdsByClass['هفتم-الف'][3], 1000000, '۶۲۷۴-***-۴۴۵۵', 'TRK-5521908', '/assets/levels_roadmap_modal_live.png', 'rejected', 'مبلغ واریزی با شهریه مصوب پایه هفتم (۱,۵۰۰,۰۰۰ تومان) همخوانی ندارد.', '۲ آبان ۱۴۰۵');
    }

    // 11. Messages & Communication
    const insertMsg = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    if (teacherFatemeh) {
      insertMsg.run(
        parentId, teacherFatemeh.id, 'مهدی رضایی (ولی)', 'فاطمه احمدی (دبیر علوم)',
        'با سلام و احترام سرکار خانم احمدی، تکلیف آزمایش علوم علی ثبت گردید. آیا کیفیت گزارش مورد تأیید است؟',
        'دیروز، ساعت ۱۸:۳۰'
      );
      insertMsg.run(
        teacherFatemeh.id, parentId, 'فاطمه احمدی (دبیر علوم)', 'مهدی رضایی (ولی)',
        'سلام و درود جناب رضایی، بله گزارش علی جان بسیار کامل و مرتب بود. با تشکر از پیگیری شما.',
        'دیروز، ساعت ۱۹:۱۵'
      );
      insertMsg.run(
        aliId, teacherFatemeh.id, 'علی رضایی', 'فاطمه احمدی (دبیر علوم)',
        'استاد سلام، برای آزمایش آونگ می‌توانیم از وزنه‌های سنگین‌تر هم برای دقت بیشتر استفاده کنیم؟',
        'امروز، ساعت ۱۰:۲۰'
      );
      insertMsg.run(
        teacherFatemeh.id, aliId, 'فاطمه احمدی (دبیر علوم)', 'علی رضایی',
        'سلام علی جان، بله حتماً! اثر جرم بر دوره تناوب را در گزارش خود مقایسه کن.',
        'امروز، ساعت ۱۱:۰۵'
      );
    }

    // 12. Store Products & Orders
    const insertProd = db.prepare(`
      INSERT INTO store_products (title, type, price, old_price, badge, icon, bg_color, meta, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const p1 = insertProd.run(
      'دوره جامع تیزهوشان هوش کمپلکس',
      'course', 850000, 1100000, 'پرفروش‌ترین', 'brain-circuit',
      'linear-gradient(135deg,#1E90FF,#0A4BD6)', '۲۰ جلسه ویدیویی + آزمون هفتگی',
      'تدریس مفهومی ۲۰۱ مبحث هوش و استعداد تحلیلی تیزهوشان همراه با شبیه‌ساز آزمون‌های ورودی سمپاد'
    );

    const p2 = insertProd.run(
      'بسته طلایی جزوات جامع علوم تجربی هفتم',
      'booklet', 320000, 420000, 'تخفیف ویژه', 'flask-conical',
      'linear-gradient(135deg,#FFD25A,#FFC531)', '۱۴۰ صفحه تمام رنگی + نمونه سوال تشریحی',
      'شامل خلاصه‌درس‌های نموداری، شکل‌های آزمایشگاهی و تست‌های پرتکرار آزمون‌های نخبگان'
    );

    const p3 = insertProd.run(
      'کتاب کار ریاضی پیشرفته و تکنیک‌های محاسبات سریع',
      'booklet', 280000, 350000, 'ویژه المپیاد', 'calculator',
      'linear-gradient(135deg,#10B981,#059669)', '۱۸۰ صفحه به همراه پاسخنامه تحلیلی',
      'مسائل خلاقانه، کسرها و هندسه تیزهوشان با راهکارهای حل زیر ۴۰ ثانیه'
    );

    const p4 = insertProd.run(
      'دفتر برنامه‌ریزی تخصصی کانون (پلکان رشد)',
      'booklet', 120000, 150000, 'ضروری', 'calendar-check',
      'linear-gradient(135deg,#8B5CF6,#6D28D9)', 'برنامه روزانه + جدول ردیاب عادت‌ها',
      'ثبت پومودورو، پیشرفت تحصیلی و ساعات مطالعه به سبک رتبه‌های برتر سمپاد'
    );

    const insertOrder = db.prepare(`
      INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      aliId, Number(p1.lastInsertRowid), 'دوره جامع تیزهوشان هوش کمپلکس',
      850000, 'ORD-991823', 'علی رضایی', '09129876543', 'تهران، خیابان ملاصدرا', 'completed'
    );
    insertOrder.run(
      aliId, Number(p2.lastInsertRowid), 'بسته طلایی جزوات جامع علوم تجربی هفتم',
      320000, 'ORD-991824', 'علی رضایی', '09129876543', 'تهران، خیابان ملاصدرا', 'completed'
    );

    // 13. Study Sessions (Study hours planner for Ali Rezaei)
    const insertStudy = db.prepare(`
      INSERT INTO study_sessions (student_id, date_fa, pomodoros_count, total_minutes, last_session_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertStudy.run(aliId, '۱۴۰۵/۰۸/۰۱', 4, 120, Date.now() - 86400000 * 3);
    insertStudy.run(aliId, '۱۴۰۵/۰۸/۰۲', 6, 180, Date.now() - 86400000 * 2);
    insertStudy.run(aliId, '۱۴۰۵/۰۸/۰۳', 5, 150, Date.now() - 86400000);
    insertStudy.run(aliId, '۱۴۰۵/۰۸/۰۴', 6, 180, Date.now());

    // 14. Points Log for Student
    const insertPt = db.prepare(`
      INSERT INTO points_log (student_id, type, title, points, date_fa)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertPt.run(aliId, 'plus', 'پاداش ثبت‌نام زودهنگام در کانون', 100, '۱۴۰۵/۰۷/۱۵');
    insertPt.run(aliId, 'plus', 'کسب رتبه ۲ در آزمون شبیه‌ساز تیزهوشان', 50, '۱۴۰۵/۰۸/۰۲');
    insertPt.run(aliId, 'plus', 'ارسال کامل تکلیف هوش کلامی', 30, '۱۴۰۵/۰۸/۰۴');
    insertPt.run(aliId, 'plus', 'تکمیل هدف مطالعه روزانه (۶ پومودورو)', 20, '۱۴۰۵/۰۸/۰۴');

    // 15. Accounting Records
    const insertAcc = db.prepare(`
      INSERT INTO accounting (type, title, amount, date_fa, category)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertAcc.run('income', 'واریز حق عضویت آبان (دانش‌آموز علی رضایی)', 1500000, '۱۴۰۵/۰۸/۰۱', 'حق عضویت');
    insertAcc.run('income', 'فروش دوره جامع تیزهوشان در فروشگاه کانون', 850000, '۱۴۰۵/۰۸/۰۲', 'فروشگاه');
    insertAcc.run('income', 'واریز حق عضویت آبان (دانش‌آموز حسین نجفی)', 1500000, '۱۴۰۵/۰۸/۰۳', 'حق عضویت');
    insertAcc.run('expense', 'چاپ دفترچه‌های آزمون هوش کمپلکس و پاسخ‌برگ‌ها', 1200000, '۱۴۰۵/۰۸/۰۲', 'چاپ و نشر');
    insertAcc.run('expense', 'تجهیز وسایل آزمایشگاهی علوم تجربی کانون', 750000, '۱۴۰۵/۰۸/۰۳', 'تجهیزات آموزشی');

    // 16. Notices
    const insertNotice = db.prepare(`
      INSERT INTO notices (title, body, date_fa, place, tag, target_audience)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertNotice.run(
      'برگزاری مرحله اول آزمون شبیه‌ساز تیزهوشان سمپاد',
      'دانش‌آموزان گرامی پایه‌های هفتم، هشتم و نهم، آزمون شبیه‌ساز سمپاد روز پنج‌شنبه ۱۲ آبان‌ماه برگزار می‌گردد. دفترچه سوالات شامل بخش‌های هوش تصویری، ریاضی و کلامی خواهد بود.',
      '۲ آبان ۱۴۰۵', 'کانون شهید آشتیانی', 'فوری', 'all'
    );
    insertNotice.run(
      'کارگاه تکنیک‌های محاسبات ذهنی و تست‌زنی ریاضی',
      'به اطلاع می‌رساند جلسه اول کارگاه روش‌های حل سریع مسائل کسرها و هندسه روز دوشنبه ۷ آبان‌ماه با حضور دبیر محترم برگزار می‌شود.',
      '۳ آبان ۱۴۰۵', 'سالن اجتماعات کانون', 'آموزشی', 'هفتم'
    );
    insertNotice.run(
      'اطلاعیه واریز شهریه و بارگذاری فیش بانکی',
      'اولیا و دانش‌آموزان گرامی، لطفاً جهت جلوگیری از تعلیق دسترسی به سامانه آزمون‌های آنلاین، تا تاریخ ۱۵ آبان‌ماه نسبت به ثبت فیش پرداخت اقدام فرمایید.',
      '۴ آبان ۱۴۰۵', 'امور مالی کانون', 'مالی', 'all'
    );

    // 17. Teacher Notes
    if (teacherFatemeh) {
      db.prepare(`
        INSERT INTO teacher_notes (student_id, teacher_id, note, date_fa)
        VALUES (?, ?, ?, ?)
      `).run(
        aliId, teacherFatemeh.id,
        'دانش‌آموز بسیار کوشا، علاقه‌مند به مباحث آزمایشگاهی و دارای روحیه کار تیمی قوی.',
        '۱۴۰۵/۰۸/۰۳'
      );
    }

    db.exec('COMMIT;');
    console.log('[DEMO_DATA] Cohesive sample demo data loaded successfully across all panels!');
    return { success: true, message: 'داده‌های نمونه جامع برای تمام پنل‌ها با موفقیت بارگذاری شد.' };
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[DEMO_DATA] Error loading demo data:', err);
    throw err;
  }
}

function clearDemoData(db) {
  // 1. Always create a backup before modifying data
  try {
    createBackup();
  } catch (e) {
    console.warn('[DEMO_DATA] Backup warning:', e.message);
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    // Clear all transaction and demo records
    db.exec(`
      DELETE FROM attendance;
      DELETE FROM homework_submissions;
      DELETE FROM homeworks;
      DELETE FROM exam_results;
      DELETE FROM exam_attempts;
      DELETE FROM exams;
      DELETE FROM study_sessions;
      DELETE FROM points_log;
      DELETE FROM fee_receipts;
      DELETE FROM accounting;
      DELETE FROM messages;
      DELETE FROM store_orders;
      DELETE FROM store_products;
      DELETE FROM parent_students;
      DELETE FROM teacher_classes;
      DELETE FROM teacher_notes;
      DELETE FROM notices;
      DELETE FROM notice_views;
    `);

    // Remove all students and parents, keeping only the admin and base teachers
    db.exec(`
      DELETE FROM users WHERE role IN ('student', 'parent') OR (role = 'teacher' AND phone NOT IN ('09121110002', '09121110003', '09121110004'));
    `);

    db.exec('COMMIT;');
    console.log('[DEMO_DATA] All sample demo data safely cleared.');
    return { success: true, message: 'تمام داده‌های نمونه با موفقیت حذف شدند و سامانه آماده استفاده واقعی شد.' };
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[DEMO_DATA] Error clearing demo data:', err);
    throw err;
  }
}

if (require.main === module) {
  const { db } = require('./db');
  if (process.argv.includes('--clear')) {
    clearDemoData(db);
  } else {
    loadDemoData(db);
  }
}

module.exports = { loadDemoData, clearDemoData };
