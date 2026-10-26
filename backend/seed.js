const { db } = require('./db');

function seed(force = false) {
  console.log('--- Starting Seeding 450 Students and Full Platform Data ---');

  if (!force && process.argv.includes('--force') === false) {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const prodCount = db.prepare('SELECT COUNT(*) as count FROM store_products').get().count;
    if (userCount >= 450 && prodCount > 0) {
      console.log(`Database already has ${userCount} users and complete data. Skipping.`);
      return;
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
  `);

  // 1. Settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('brand_name', 'کانون نخبه‌پروری شهید کاظم آشتیانی');
  insertSetting.run('platform_name', 'پلتفرم رشد');
  insertSetting.run('card_number', '۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰');
  insertSetting.run('card_holder', 'کانون نخبه‌پروری آشتیانی');
  insertSetting.run('phone', '۰۲۱-۸۸۸۸۴۴۲۲');
  insertSetting.run('address', 'تهران، میدان انقلاب، خیابان آزادی، پلاک ۱۲');

  // 2. Fee Defs
  const insertFeeDef = db.prepare('INSERT INTO fee_defs (grade, amount, deadline_fa, lock_date_fa, is_locked) VALUES (?, ?, ?, ?, ?)');
  insertFeeDef.run('هفتم', 1500000, '۱۰ آبان ۱۴۰۵', '۱۵ آبان ۱۴۰۵', 0);
  insertFeeDef.run('هشتم', 1600000, '۱۰ آبان ۱۴۰۵', '۱۵ آبان ۱۴۰۵', 0);
  insertFeeDef.run('نهم', 1750000, '۱۰ آبان ۱۴۰۵', '۱۵ آبان ۱۴۰۵', 0);

  // 3. Admin User
  const insertUser = db.prepare(`
    INSERT INTO users (
      role, national_id, phone, password, first_name, last_name, full_name,
      grade, class_name, school_name, birth_date, address, parent_phone, parent_name,
      level, level_title, total_points, rank, fee_status, is_locked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'admin', '0011223344', '09121110001', '123456',
    'محمد', 'کریمی', 'محمد کریمی (مدیر کانون)',
    null, null, null, '۱۳۶۰/۰۵/۱۵', 'تهران', null, null,
    10, 'مدیر کانون', 1000, 1, 'paid', 0
  );

  // 4. Teachers
  insertUser.run(
    'teacher', '0022334455', '09121110002', '123456',
    'فاطمه', 'احمدی', 'فاطمه احمدی (دبیر علوم)',
    'هفتم', 'الف', null, '۱۳۶۸/۰۲/۲۰', 'تهران', null, null,
    8, 'دبیر ارشد', 950, 1, 'paid', 0
  );

  insertUser.run(
    'teacher', '0033445566', '09121110003', '123456',
    'رضا', 'کریمی', 'رضا کریمی (دبیر ریاضی)',
    'هفتم', 'ب', null, '۱۳۶۵/۰۷/۱۰', 'تهران', null, null,
    8, 'دبیر ارشد', 920, 2, 'paid', 0
  );

  insertUser.run(
    'teacher', '0044556677', '09121110004', '123456',
    'مریم', 'حسینی', 'مریم حسینی (دبیر ادبیات فارسی)',
    'هشتم', 'الف', null, '۱۳۷۰/۰۴/۱۲', 'تهران', null, null,
    7, 'دبیر منتخب', 880, 3, 'paid', 0
  );

  // 5. Hero Student (Ali Rezaei) - has birthday today for birthday banner demo
  insertUser.run(
    'student', '0012345678', '09123456789', '123456',
    'علی', 'رضایی', 'علی رضایی',
    'هفتم', 'الف', 'شهید بهشتی', '۱۳۸۹/۰۸/۰۴', 'تهران، خیابان ستارخان، کوچه مهرداد، پلاک ۱۲',
    '09121112233', 'مهدی رضایی',
    5, 'کاوشگر', 840, 4, 'paid', 0
  );

  // 6. Parents of Ali Rezaei
  insertUser.run(
    'parent', '09121112233', '09121112233', '123456',
    'مهدی', 'رضایی', 'مهدی رضایی (پدر علی رضایی)',
    'هفتم', 'الف', null, '۱۳۵۸/۰۳/۱۸', 'تهران', '09121112233', null,
    5, 'همیار کانون', 500, 1, 'paid', 0
  );

  // 7. Seed 449 more students to reach total 450 students!
  const firstNames = [
    'امیرعلی', 'محمدطاها', 'سیدعلی', 'حسین', 'ابوالفضل', 'امیرعباس', 'محمدحسین', 'علی‌اصغر', 'محمدرضا', 'امیرمحمد',
    'مهدی', 'علیرضا', 'پارسا', 'کیان', 'ایلیا', 'دانیال', 'ماهان', 'آرتین', 'سینا', 'بردیا',
    'فاطمه', 'زهرا', 'زینب', 'یسنا', 'نازنین‌زهرا', 'باران', 'ریحانه', 'رها', 'حلما', 'سنا',
    'نیلوفر', 'سارا', 'پریا', 'آوا', 'الینا', 'هستی', 'مبینا', 'سوگند', 'مهسا', 'نرگس'
  ];

  const lastNames = [
    'محمدی', 'حسینی', 'احمدی', 'کریمی', 'موسوی', 'جعفری', 'قاسمی', 'مرادی', 'صادقی', 'کاظمی',
    'طاهری', 'نجفی', 'ابراهیمی', 'حیدری', 'روشن', 'سلیمانی', 'فراهانی', 'میرزایی', 'اکبری', 'باقری',
    'حبیبی', 'خسروی', 'زارع', 'شریفی', 'عباسی', 'عسگری', 'علی‌پور', 'کریمیان', 'نوری', 'یوسفی'
  ];

  const grades = ['هفتم', 'هشتم', 'نهم'];
  const classes = ['الف', 'ب'];
  const schools = ['شهید بهشتی', 'فرزانگان', 'امام خمینی'];
  const feeStatuses = ['paid', 'paid', 'paid', 'pending', 'unpaid'];

  const insertStudentStmt = db.prepare(`
    INSERT INTO users (
      role, national_id, phone, password, first_name, last_name, full_name,
      grade, class_name, school_name, birth_date, address, parent_phone, parent_name,
      level, level_title, total_points, rank, fee_status, is_locked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION;');

  for (let i = 2; i <= 450; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fn} ${ln}`;
    const natId = String(1000000000 + i);
    const parentPhone = `0912${String(1000000 + i).padStart(7, '0')}`;
    const grade = grades[(i - 1) % 3]; // evenly distributed 150 each
    const cls = classes[i % 2]; // evenly distributed
    const school = schools[i % 3];
    const bDay = (i % 28) + 1;
    const bMonth = (i % 12) + 1;
    const birthDate = `۱۳۸۹/${String(bMonth).padStart(2, '0')}/${String(bDay).padStart(2, '0')}`;
    const feeStatus = feeStatuses[i % feeStatuses.length];
    const isLocked = feeStatus === 'unpaid' && i % 4 === 0 ? 1 : 0;
    const totalPoints = 300 + ((450 - i) * 2) + Math.floor(Math.random() * 50);
    const level = Math.min(10, Math.floor(totalPoints / 120) + 1);
    const levelTitles = ['نوآموز', 'کوشا', 'پیشرو', 'دانشور', 'کاوشگر', 'فرزانه', 'نخبه', 'طلایه‌دار', 'قهرمان', 'استاد'];
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    insertStudentStmt.run(
      'student', natId, parentPhone, '123456', fn, ln, fullName,
      grade, cls, school, birthDate, `تهران، پلاک ${i}`, parentPhone, `ولی ${fn}`,
      level, levelTitle, totalPoints, i, feeStatus, isLocked
    );
  }

  db.exec('COMMIT;');
  console.log('450 Students successfully seeded!');

  // 8. Notices
  const insertNotice = db.prepare(`
    INSERT INTO notices (title, body, date_fa, place, tag, target_audience)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotice.run(
    'تغییر ساعت کلاس جبرانی ریاضی',
    'دانش‌آموزان عزیز پایه هفتم، به اطلاع می‌رساند کلاس ریاضی استاد کریمی روز دوشنبه از ساعت ۱۶:۰۰ الی ۱۷:۳۰ در کلاس شماره ۳ برگزار خواهد شد. لطفاً به موقع حاضر شوید.',
    '۴ آبان ۱۴۰۵', 'کلاس شماره ۳', 'مهم', 'هفتم'
  );
  insertNotice.run(
    'آزمون جامع هماهنگ مرحله اول',
    'آزمون جامع تمام پایه‌ها روز پنجشنبه ۷ آبان ساعت ۹ صبح برگزار خواهد شد. همراه داشتن کارت ورود به جلسه و مداد الزامی است. کلید سوالات همان روز بعدازظهر منتشر می‌شود.',
    '۲ آبان ۱۴۰۵', 'سالن آزمون', 'فوری', 'all'
  );
  insertNotice.run(
    'تمدید مهلت ارسال تکالیف درس علوم',
    'با توجه به درخواست مکرر دانش‌آموزان، مهلت ارسال تکلیف فصل ۳ علوم تا جمعه شب تمدید شد. نمره کسر نخواهد شد.',
    '۳ آبان ۱۴۰۵', 'سامانه رشد', 'اطلاع‌رسانی', 'all'
  );

  // 9. Homeworks
  const insertHomework = db.prepare(`
    INSERT INTO homeworks (title, grade, class_name, subject, teacher_name, deadline_fa, deadline_timestamp, points, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertHomework.run(
    'تمرین‌های فصل ۳ ریاضی: کسرها',
    'هفتم', 'الف', 'ریاضی', 'رضا کریمی',
    '۵ آبان ۱۴۰۵، ساعت ۱۸:۰۰', Date.now() + 86400000, 20,
    'تمرین‌های صفحه ۴۲ تا ۴۵ کتاب کار را حل کرده و عکس واضح از پاسخ‌ها ارسال نمایید.'
  );
  insertHomework.run(
    'گزارش آزمایش آونگ و فنر',
    'هفتم', 'الف', 'علوم', 'فاطمه احمدی',
    '۶ آبان ۱۴۰۵، ساعت ۲۱:۰۰', Date.now() + 172800000, 15,
    'جدول داده‌های اندازه‌گیری شده در آزمایشگاه را تکمیل نموده و نمودار مربوطه را رسم کنید.'
  );
  insertHomework.run(
    'نگارش انشای پاییزی',
    'هفتم', 'الف', 'ادبیات', 'مریم حسینی',
    '۳ آبان ۱۴۰۵، ساعت ۲۲:۰۰', Date.now() - 86400000, 20,
    'یک انشای حداقل ۳۰۰ کلمه‌ای با موضوع جلوه‌های پاییز بنویسید.'
  );
  insertHomework.run(
    'مسائل فیزیک حرکت شتاب‌دار',
    'نهم', 'الف', 'علوم', 'فاطمه احمدی',
    '۷ آبان ۱۴۰۵، ساعت ۲۰:۰۰', Date.now() + 259200000, 25,
    'حل پنج مسئله تکمیلی فصل حرکت'
  );

  // Submissions for Ali Rezaei
  const insertSub = db.prepare(`
    INSERT INTO homework_submissions (homework_id, student_id, submitted_at_fa, file_url, note, is_late, status, grade_score, feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSub.run(3, 5, '۴ آبان، ساعت ۱۱:۲۰', 'insha.pdf', 'استاد لطفا بررسی بفرمایید با تاخیر ارسال شد.', 1, 'late', 16, 'خوب بود اما تاخیر داشت.');

  // 10. Exams
  const insertExam = db.prepare(`
    INSERT INTO exams (title, grade, class_name, subject, duration_minutes, question_count, questions_json, deadline_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const mathQuestions = JSON.stringify([
    {
      id: 1,
      q: 'حاصل عبارت (-۸) + (+۱۴) کدام است؟',
      options: ['-۲۲', '+۶', '-۶', '+۲۲'],
      correct: 1
    },
    {
      id: 2,
      q: 'کدام‌یک از اعداد زیر عدد اول است؟',
      options: ['۲۱', '۳۳', '۳۷', '۴۹'],
      correct: 2
    },
    {
      id: 3,
      q: 'مجموع زوایای داخلی یک پنج‌ضلعی محدب چند درجه است؟',
      options: ['۳۶۰', '۵۴۰', '۷۲۰', '۱۸۰'],
      correct: 1
    },
    {
      id: 4,
      q: 'معکوس عدد -۳/۴ برابر با کدام گزینه است؟',
      options: ['+۳/۴', '-۴/۳', '+۴/۳', '-۳/۴'],
      correct: 1
    },
    {
      id: 5,
      q: 'اگر x - ۵ = ۱۲ باشد، مقدار ۲x چند است؟',
      options: ['۱۷', '۳۴', '۲۴', '۱۴'],
      correct: 1
    }
  ]);

  insertExam.run(
    'آزمون ریاضی فصل ۳ (کسرها و اعداد صحیح)',
    'هفتم', 'الف', 'ریاضی', 10, 5, mathQuestions, '۸ آبان ۱۴۰۵، ساعت ۲۳:۰۰'
  );

  insertExam.run(
    'آزمون علوم فصل ۳ (اتم‌ها و پیوندها)',
    'هفتم', 'الف', 'علوم', 15, 10, JSON.stringify([
      { id: 1, q: 'ذره باردار منفی در اتم کدام است؟', options: ['پروتون', 'نوترون', 'الکترون', 'پوزیترون'], correct: 2 },
      { id: 2, q: 'کدام فلز در دمای اتاق مایع است؟', options: ['جیوه', 'سدیم', 'مس', 'آهن'], correct: 0 }
    ]), '۱۰ آبان ۱۴۰۵، ساعت ۲۳:۰۰'
  );

  // Exam result for Ali Rezaei
  const insertExamRes = db.prepare(`
    INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_count, wrong_count, unanswered_count, percentage, rank, submitted_at_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertExamRes.run(1, 5, 18, 5, 4, 1, 0, 80.0, 3, '۱ آبان ۱۴۰۵');

  // 11. Attendance for today
  const insertAtt = db.prepare(`
    INSERT INTO attendance (date_fa, grade, class_name, student_id, status, sms_sent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // Top 10 students attendance in Class هفتم الف
  const class7Students = db.prepare("SELECT id FROM users WHERE grade = 'هفتم' AND class_name = 'الف' LIMIT 30").all();
  class7Students.forEach((st, idx) => {
    let stat = 'p';
    let sms = 0;
    if (idx === 7) { stat = 'a'; sms = 1; }
    if (idx === 14) { stat = 'a'; sms = 1; }
    if (idx === 21) { stat = 'e'; sms = 0; }
    insertAtt.run('۱۴۰۵/۰۸/۰۴', 'هفتم', 'الف', st.id, stat, sms);
  });

  // 12. Study Sessions (Pomodoro & Leaderboard)
  const insertStudy = db.prepare(`
    INSERT OR REPLACE INTO study_sessions (student_id, date_fa, pomodoros_count, total_minutes)
    VALUES (?, ?, ?, ?)
  `);
  insertStudy.run(5, '۱۴۰۵/۰۸/۰۴', 3, 75); // Ali Rezaei: 3 pomodoros = 75 mins
  // Other top study students for today's leaderboard
  if (class7Students[0] && class7Students[0].id !== 5) insertStudy.run(class7Students[0].id, '۱۴۰۵/۰۸/۰۴', 5, 135);
  if (class7Students[2] && class7Students[2].id !== 5) insertStudy.run(class7Students[2].id, '۱۴۰۵/۰۸/۰۴', 4, 110);
  if (class7Students[3] && class7Students[3].id !== 5) insertStudy.run(class7Students[3].id, '۱۴۰۵/۰۸/۰۴', 4, 100);

  // 13. Points Log for Ali Rezaei
  const insertPoint = db.prepare(`
    INSERT INTO points_log (student_id, type, title, points, date_fa)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPoint.run(5, 'plus', 'ساعت مطالعه بیشتر از ۲ ساعت', 50, '۴ آبان');
  insertPoint.run(5, 'plus', 'نمره ۲۰ در آزمون کلاسی ریاضی', 100, '۲ آبان');
  insertPoint.run(5, 'plus', 'حل بموقع و کامل تکالیف علوم', 40, '۱ آبان');
  insertPoint.run(5, 'plus', 'همکاری کلاسی و فعالیت پژوهشی', 30, '۲۹ مهر');
  insertPoint.run(5, 'minus', 'ارسال با دیرکرد تکلیف ادبیات', 20, '۳ آبان');
  insertPoint.run(5, 'minus', 'مطالعه کمتر از حداقل (زیر ۱ ساعت)', 15, '۲۸ مهر');

  // 14. Fee Receipts Queue
  const insertReceipt = db.prepare(`
    INSERT INTO fee_receipts (student_id, amount, card_number, tracking_code, receipt_image, status, reject_reason, date_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReceipt.run(5, 1500000, '۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰', '۸۴۷۲۹۱', 'sample-receipt.jpg', 'approved', null, '۳۰ مهر ۱۴۰۵');
  insertReceipt.run(class7Students[2].id, 1500000, '۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰', '۹۱۹۲۸۳', 'receipt2.jpg', 'pending', null, '۳ آبان ۱۴۰۵');
  insertReceipt.run(class7Students[3].id, 1500000, '۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰', '۳۸۴۷۲۱', 'receipt3.jpg', 'pending', null, '۴ آبان ۱۴۰۵');
  insertReceipt.run(class7Students[4].id, 1500000, '۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰', '۱۱۸۲۷۳', 'receipt4.jpg', 'rejected', 'فیش ناخوانا است و تاریخ واریز مشخص نیست', '۲ آبان ۱۴۰۵');

  // 15. Accounting
  const insertAcc = db.prepare(`
    INSERT INTO accounting (type, title, amount, date_fa, category)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAcc.run('income', 'واریز حق عضویت آبان (دانش‌آموز علی رضایی)', 1500000, '۱۴۰۵/۰۸/۰۱', 'حق عضویت');
  insertAcc.run('income', 'واریز حق عضویت آبان (دانش‌آموز نیما صادقی)', 1500000, '۱۴۰۵/۰۸/۰۲', 'حق عضویت');
  insertAcc.run('income', 'واریز حق عضویت آبان (دانش‌آموز مهدی موسوی)', 1500000, '۱۴۰۵/۰۸/۰۳', 'حق عضویت');
  insertAcc.run('income', 'فروش کتاب و جزوات تخصصی ریاضی', 2400000, '۱۴۰۵/۰۸/۰۳', 'فروشگاه');
  insertAcc.run('expense', 'چاپ جزوه‌های آزمون جامع و پاسخ‌برگ', 1800000, '۱۴۰۵/۰۸/۰۲', 'چاپ و نشر');
  insertAcc.run('expense', 'پذیرایی کلاس‌های تقویتی و مسابقات', 750000, '۱۴۰۵/۰۸/۰۳', 'پذیرایی');
  insertAcc.run('expense', 'سامانه پیامک اطلاع‌رسانی غیبت والدین', 500000, '۱۴۰۵/۰۸/۰۴', 'خدمات پیامک');

  // 16. Internal Messages
  const insertMsg = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMsg.run(2, 5, 'خانم احمدی', 'علی رضایی', 'سلام علی جان، تمرین علوم را دیدم، عالی بود ولی سوال ۳ نیاز به اصلاح فرمول دارد.', '۱۰:۱۵');
  insertMsg.run(5, 2, 'علی رضایی', 'خانم احمدی', 'سلام خانم احمدی، چشم حتما در تکلیف بعدی اصلاح می‌کنم. ممنون از راهنماییتون.', '۱۰:۲۲');

  // 17. Store Products
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
  insertProd.run(
    'دوره حل تکنیکی سوالات هندسه نهم',
    'course', 690000, 900000, 'جدید', 'drafting-compass',
    'linear-gradient(135deg,#12A150,#0A7D3B)', '۱۵ جلسه ویدیویی + جزوه تمرین',
    'تسلط ۱۰۰ درصدی بر قضایا، تالس و تشابه مثلث‌ها ویژه قبولی مدارس سمپاد'
  );
  insertProd.run(
    'دفترچه آزمون شبیه‌ساز تیزهوشان با پاسخنامه',
    'booklet', 210000, null, 'ضروری', 'file-text',
    'linear-gradient(135deg,#8B5CF6,#6366F1)', '۵ مرحله آزمون جامع استاندارد',
    'شبیه‌سازی کامل دفترچه ورودی مدارس استعدادهای درخشان همراه با پاسخنامه کاملاً تشریحی'
  );

  console.log('--- Seeding Completed Successfully! ---');
}

seed();
