const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// Uploads directories setup
const uploadsDir = path.join(__dirname, 'uploads');
const dirs = ['images', 'videos', 'homeworks', 'receipts'].map(d => path.join(uploadsDir, d));
[uploadsDir, ...dirs].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Production Multer Storage with MIME-Type Subdirectory Routing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'images';
    const mime = file.mimetype || '';
    const cat = req.query.category || req.body.category || '';
    if (cat === 'receipt') sub = 'receipts';
    else if (cat === 'homework') sub = 'homeworks';
    else if (mime.startsWith('video/')) sub = 'videos';
    else if (mime.startsWith('image/')) sub = 'images';
    else sub = 'homeworks';
    cb(null, path.join(uploadsDir, sub));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB max file size (videos & documents)
});

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// HTTP Range Video Streaming for Educational Videos (Supports mobile iOS/Android scrubbing)
app.get('/api/videos/stream/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, 'videos', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ویدیو یافت نشد' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Helper to convert English digits to Persian
const faNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ----------------- AUTH -----------------
app.post('/api/auth/login', (req, res) => {
  const { identifier, password, role } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'کد ملی یا شماره موبایل الزامی است' });
  }

  // Find user by national_id OR phone
  let user;
  if (role) {
    user = db.prepare('SELECT * FROM users WHERE (national_id = ? OR phone = ?) AND role = ?').get(identifier, identifier, role);
  } else {
    user = db.prepare('SELECT * FROM users WHERE national_id = ? OR phone = ?').get(identifier, identifier);
  }

  // If password provided and does not match
  if (user && password && user.password !== password) {
    return res.status(401).json({ error: 'رمز عبور اشتباه است' });
  }

  // If user not found, create a demo fallback or pick matching role
  if (!user) {
    if (role === 'admin') {
      user = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
    } else if (role === 'teacher') {
      user = db.prepare("SELECT * FROM users WHERE role = 'teacher' LIMIT 1").get();
    } else if (role === 'parent') {
      user = db.prepare("SELECT * FROM users WHERE role = 'parent' LIMIT 1").get();
    } else {
      user = db.prepare("SELECT * FROM users WHERE role = 'student' LIMIT 1").get();
    }
  }

  // Check if today is student's birthday (demo logic: Ali Rezaei is born 08/04 -> today!)
  const isBirthday = user.role === 'student' && (user.birth_date?.includes('۰۸/۰۴') || user.birth_date?.includes('08/04') || user.national_id === '0012345678');

  res.json({
    user: {
      id: user.id,
      role: user.role,
      national_id: user.national_id,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      grade: user.grade,
      class_name: user.class_name,
      school_name: user.school_name,
      birth_date: user.birth_date,
      parent_phone: user.parent_phone,
      level: user.level,
      level_title: user.level_title,
      total_points: user.total_points,
      rank: user.rank,
      fee_status: user.fee_status,
      is_locked: user.is_locked,
      is_birthday: isBirthday
    }
  });
});

// ----------------- NOTICES -----------------
app.get('/api/notices', (req, res) => {
  const userId = req.query.user_id;
  const grade = req.query.grade;

  const notices = db.prepare(`
    SELECT n.*,
      CASE WHEN nv.id IS NOT NULL THEN 1 ELSE 0 END as is_seen
    FROM notices n
    LEFT JOIN notice_views nv ON n.id = nv.notice_id AND nv.user_id = ?
    WHERE n.target_audience = 'all' OR n.target_audience = ? OR ? IS NULL
    ORDER BY n.id DESC
  `).all(userId || 0, grade || 'all', grade ? 'filtered' : null);

  res.json(notices);
});

app.post('/api/notices', (req, res) => {
  const { title, body, target_audience, place, tag } = req.body;
  const date_fa = '۴ آبان ۱۴۰۵';
  const stmt = db.prepare(`
    INSERT INTO notices (title, body, date_fa, place, tag, target_audience)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(title, body, date_fa, place || 'کانون', tag || 'مهم', target_audience || 'all');
  res.json({ success: true, id: info.lastInsertRowid });
});

app.post('/api/notices/seen', (req, res) => {
  const { notice_id, user_id } = req.body;
  if (!notice_id || !user_id) return res.status(400).json({ error: 'Missing parameters' });

  db.prepare(`
    INSERT OR IGNORE INTO notice_views (notice_id, user_id)
    VALUES (?, ?)
  `).run(notice_id, user_id);

  res.json({ success: true });
});

app.get('/api/notices/report', (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
  const notices = db.prepare(`
    SELECT n.*,
      (SELECT COUNT(*) FROM notice_views nv WHERE nv.notice_id = n.id) as seen_count
    FROM notices n
    ORDER BY n.id DESC
  `).all();

  const result = notices.map(n => ({
    ...n,
    total_audience: n.target_audience === 'all' ? totalStudents : Math.round(totalStudents / 3),
    unseen_count: Math.max(0, (n.target_audience === 'all' ? totalStudents : Math.round(totalStudents / 3)) - n.seen_count)
  }));

  res.json(result);
});

// ----------------- STUDENTS (FOR 450 STUDENTS DIRECTORY) -----------------
app.get('/api/students', (req, res) => {
  const { search, grade, class_name, school_name, limit = 50, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClauses = ["role = 'student'"];
  let params = [];

  if (search) {
    whereClauses.push('(full_name LIKE ? OR national_id LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (grade) {
    whereClauses.push('grade = ?');
    params.push(grade);
  }
  if (class_name) {
    whereClauses.push('class_name = ?');
    params.push(class_name);
  }
  if (school_name) {
    whereClauses.push('school_name = ?');
    params.push(school_name);
  }

  const whereStr = whereClauses.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${whereStr}`).get(...params).count;
  const students = db.prepare(`
    SELECT id, national_id, phone, first_name, last_name, full_name,
           grade, class_name, school_name, birth_date, address, parent_phone,
           level, level_title, total_points, rank, fee_status, is_locked
    FROM users
    WHERE ${whereStr}
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({
    total,
    page: Number(page),
    limit: Number(limit),
    students
  });
});

app.post('/api/students', (req, res) => {
  const { first_name, last_name, national_id, address, school_name, grade, class_name, birth_date, parent_phone } = req.body;
  const full_name = `${first_name} ${last_name}`;

  try {
    const totalCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const stmt = db.prepare(`
      INSERT INTO users (
        role, national_id, phone, password, first_name, last_name, full_name,
        grade, class_name, school_name, birth_date, address, parent_phone,
        level, level_title, total_points, rank, fee_status, is_locked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      'student', national_id, parent_phone, '123456', first_name, last_name, full_name,
      grade, class_name, school_name, birth_date, address, parent_phone,
      1, 'نوآموز', 100, totalCount + 1, 'pending', 0
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: 'کد ملی قبلاً ثبت شده است یا داده‌ها نامعتبر هستند.' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'student'").run(req.params.id);
  res.json({ success: true });
});

// ----------------- ATTENDANCE -----------------
app.get('/api/attendance', (req, res) => {
  const { grade = 'هفتم', class_name = 'الف', date_fa = '۱۴۰۵/۰۸/۰۴' } = req.query;

  const students = db.prepare(`
    SELECT u.id, u.full_name, u.grade, u.class_name,
           COALESCE(a.status, 'p') as status,
           COALESCE(a.sms_sent, 0) as sms_sent
    FROM users u
    LEFT JOIN attendance a ON u.id = a.student_id AND a.date_fa = ?
    WHERE u.role = 'student' AND u.grade = ? AND u.class_name = ?
    ORDER BY u.id ASC
  `).all(date_fa, grade, class_name);

  const presentCount = students.filter(s => s.status === 'p').length;
  const absentCount = students.filter(s => s.status === 'a').length;
  const excusedCount = students.filter(s => s.status === 'e').length;

  res.json({
    date_fa,
    grade,
    class_name,
    stats: { present: presentCount, absent: absentCount, excused: excusedCount, total: students.length },
    students
  });
});

app.post('/api/attendance', (req, res) => {
  const { grade, class_name, date_fa, records } = req.body;
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'اطلاعات حضور و غیاب نامعتبر است' });
  }

  const upsert = db.prepare(`
    INSERT INTO attendance (date_fa, grade, class_name, student_id, status, sms_sent)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date_fa, student_id) DO UPDATE SET
      status = excluded.status,
      sms_sent = excluded.sms_sent
  `);

  db.exec('BEGIN TRANSACTION;');
  let smsCount = 0;
  for (const r of records) {
    const isSms = r.status === 'a' ? 1 : 0;
    if (isSms) smsCount++;
    upsert.run(date_fa || '۱۴۰۵/۰۸/۰۴', grade, class_name, r.student_id, r.status, isSms);
  }
  db.exec('COMMIT;');

  res.json({ success: true, sms_count: smsCount });
});

// ----------------- HOMEWORKS -----------------
app.get('/api/homeworks', (req, res) => {
  const { student_id, grade = 'هفتم', class_name = 'الف' } = req.query;

  const homeworks = db.prepare(`
    SELECT h.*,
      hs.status as submission_status,
      hs.is_late,
      hs.grade_score,
      hs.feedback,
      hs.submitted_at_fa
    FROM homeworks h
    LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
    WHERE h.grade = ? AND (h.class_name = ? OR h.class_name = 'همه کلاس‌ها')
    ORDER BY h.id DESC
  `).all(student_id || 0, grade, class_name);

  res.json(homeworks);
});

app.post('/api/homeworks', (req, res) => {
  const { title, grade, class_name, subject, teacher_name, deadline_fa, points, description } = req.body;
  const stmt = db.prepare(`
    INSERT INTO homeworks (title, grade, class_name, subject, teacher_name, deadline_fa, deadline_timestamp, points, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    title, grade, class_name, subject || 'عمومی', teacher_name || 'معلم کانون',
    deadline_fa, Date.now() + 86400000, points || 20, description || ''
  );
  res.json({ success: true, id: info.lastInsertRowid });
});

app.post('/api/homeworks/:id/submit', (req, res) => {
  const homework_id = req.params.id;
  const { student_id, note, file_url } = req.body;

  const hw = db.prepare('SELECT * FROM homeworks WHERE id = ?').get(homework_id);
  const isLate = hw && hw.deadline_timestamp < Date.now() ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO homework_submissions (homework_id, student_id, submitted_at_fa, file_url, note, is_late, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(homework_id, student_id) DO UPDATE SET
      submitted_at_fa = excluded.submitted_at_fa,
      file_url = excluded.file_url,
      note = excluded.note,
      is_late = excluded.is_late,
      status = excluded.status
  `);

  stmt.run(homework_id, student_id, '۴ آبان ۱۴۰۵، ساعت ۱۸:۳۰', file_url || 'hw.pdf', note || '', isLate, isLate ? 'late' : 'submitted');

  // If late, deduct 10 points in points_log, else add 20 points!
  if (isLate) {
    db.prepare("INSERT INTO points_log (student_id, type, title, points, date_fa) VALUES (?, 'minus', 'ارسال با دیرکرد تکلیف', 10, '۴ آبان')").run(student_id);
  } else {
    db.prepare("INSERT INTO points_log (student_id, type, title, points, date_fa) VALUES (?, 'plus', 'ارسال به‌موقع تکلیف', 20, '۴ آبان')").run(student_id);
    db.prepare('UPDATE users SET total_points = total_points + 20 WHERE id = ?').run(student_id);
  }

  res.json({ success: true, is_late: isLate });
});

app.get('/api/homeworks/report', (req, res) => {
  const { grade, class_name } = req.query;
  const homeworks = db.prepare(`
    SELECT h.*,
      (SELECT COUNT(*) FROM users u WHERE u.role = 'student' AND u.grade = h.grade AND (h.class_name = 'همه کلاس‌ها' OR u.class_name = h.class_name)) as total_expected,
      (SELECT COUNT(*) FROM homework_submissions hs WHERE hs.homework_id = h.id) as submitted_count
    FROM homeworks h
    WHERE (? IS NULL OR h.grade = ?) AND (? IS NULL OR h.class_name = ?)
    ORDER BY h.id DESC
  `).all(grade || null, grade || null, class_name || null, class_name || null);

  res.json(homeworks);
});

// ----------------- EXAMS -----------------
app.get('/api/exams', (req, res) => {
  const { grade, class_name } = req.query;
  const exams = db.prepare(`
    SELECT id, title, grade, class_name, subject, duration_minutes, question_count, deadline_fa, created_at
    FROM exams
    WHERE (? IS NULL OR grade = ?) AND (? IS NULL OR class_name = ?)
    ORDER BY id DESC
  `).all(grade || null, grade || null, class_name || null, class_name || null);
  res.json(exams);
});

app.get('/api/exams/:id', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد' });
  exam.questions = JSON.parse(exam.questions_json || '[]');
  res.json(exam);
});

app.post('/api/exams', (req, res) => {
  const { title, grade, class_name, subject, duration_minutes, question_count, questions } = req.body;
  const stmt = db.prepare(`
    INSERT INTO exams (title, grade, class_name, subject, duration_minutes, question_count, questions_json, deadline_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    title, grade, class_name, subject || 'عمومی',
    duration_minutes || 15, question_count || questions?.length || 5,
    JSON.stringify(questions || []), '۱۰ آبان ۱۴۰۵'
  );
  res.json({ success: true, id: info.lastInsertRowid });
});

app.post('/api/exams/:id/submit', (req, res) => {
  const exam_id = req.params.id;
  const { student_id, answers } = req.body; // { '1': 1, '2': 2 }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(exam_id);
  if (!exam) return res.status(404).json({ error: 'آزمون یافت نشد' });

  const questions = JSON.parse(exam.questions_json || '[]');
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  questions.forEach(q => {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) {
      unanswered++;
    } else if (ans === q.correct) {
      correct++;
    } else {
      wrong++;
    }
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const score = Math.round((percentage / 100) * 20);

  const stmt = db.prepare(`
    INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_count, wrong_count, unanswered_count, percentage, rank, submitted_at_fa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(exam_id, student_id) DO UPDATE SET
      score = excluded.score,
      correct_count = excluded.correct_count,
      wrong_count = excluded.wrong_count,
      unanswered_count = excluded.unanswered_count,
      percentage = excluded.percentage,
      submitted_at_fa = excluded.submitted_at_fa
  `);

  stmt.run(exam_id, student_id, score, total, correct, wrong, unanswered, percentage, 4, '۴ آبان ۱۴۰۵');

  // Award points
  const pointsEarned = correct * 10;
  db.prepare('INSERT INTO points_log (student_id, type, title, points, date_fa) VALUES (?, "plus", ?, ?, "۴ آبان")')
    .run(student_id, `شرکت در ${exam.title}`, pointsEarned);
  db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(pointsEarned, student_id);

  res.json({
    success: true,
    score,
    total,
    correct,
    wrong,
    unanswered,
    percentage,
    points_earned: pointsEarned
  });
});

// Comprehensive Exam (آزمون جامع - همه ۴۵۰ دانش‌آموز)
app.get('/api/exams/comprehensive/rankings', (req, res) => {
  const students = db.prepare(`
    SELECT id, national_id, full_name, grade, class_name, school_name, total_points, rank
    FROM users
    WHERE role = 'student'
    ORDER BY total_points DESC
  `).all();

  // Re-rank dynamically based on points
  const ranked = students.map((s, index) => ({
    ...s,
    rank: index + 1,
    score: Math.min(100, Math.round(50 + (s.total_points / 12))),
    qr_data: `ROSH-EXAM:ID=${s.id};NAT=${s.national_id};NAME=${encodeURIComponent(s.full_name)};GRADE=${encodeURIComponent(s.grade + ' ' + s.class_name)}`
  }));

  res.json(ranked);
});

// ----------------- POMODORO & STUDY -----------------
app.get('/api/study/stats/:student_id', (req, res) => {
  const student_id = req.params.student_id;
  const today = '۱۴۰۵/۰۸/۰۴';

  const session = db.prepare('SELECT * FROM study_sessions WHERE student_id = ? AND date_fa = ?').get(student_id, today) || {
    pomodoros_count: 0,
    total_minutes: 0
  };

  res.json({
    today_pomodoros: session.pomodoros_count,
    today_minutes: session.total_minutes,
    goal_minutes: 120,
    progress_percentage: Math.min(100, Math.round((session.total_minutes / 120) * 100))
  });
});

app.post('/api/study/pomodoro', (req, res) => {
  const { student_id, minutes = 25 } = req.body;
  const today = '۱۴۰۵/۰۸/۰۴';

  const upsert = db.prepare(`
    INSERT INTO study_sessions (student_id, date_fa, pomodoros_count, total_minutes)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(student_id, date_fa) DO UPDATE SET
      pomodoros_count = pomodoros_count + 1,
      total_minutes = total_minutes + excluded.total_minutes
  `);
  upsert.run(student_id, today, minutes);

  // Add 15 points
  db.prepare("INSERT INTO points_log (student_id, type, title, points, date_fa) VALUES (?, 'plus', 'تکمیل یک جلسه تمرکز پومودورو', 15, '۴ آبان')").run(student_id);
  db.prepare('UPDATE users SET total_points = total_points + 15 WHERE id = ?').run(student_id);

  res.json({ success: true, message: 'پومودورو با موفقیت ثبت شد و ۱۵ امتیاز دریافت کردی!' });
});

app.get('/api/study/leaderboard', (req, res) => {
  const type = req.query.type || 'today'; // today or week
  const today = '۱۴۰۵/۰۸/۰۴';

  const leaders = db.prepare(`
    SELECT u.id, u.full_name, u.grade, u.class_name,
           COALESCE(s.total_minutes, 0) as minutes,
           COALESCE(s.pomodoros_count, 0) as pomodoros
    FROM users u
    JOIN study_sessions s ON u.id = s.student_id AND s.date_fa = ?
    WHERE u.role = 'student'
    ORDER BY s.total_minutes DESC
    LIMIT 3
  `).all(today);

  res.json(leaders);
});

// ----------------- PROFILE & POINTS -----------------
app.get('/api/points/:student_id', (req, res) => {
  const student_id = req.params.student_id;
  const pluses = db.prepare("SELECT * FROM points_log WHERE student_id = ? AND type = 'plus' ORDER BY id DESC").all(student_id);
  const minuses = db.prepare("SELECT * FROM points_log WHERE student_id = ? AND type = 'minus' ORDER BY id DESC").all(student_id);
  const user = db.prepare('SELECT total_points, rank, level, level_title FROM users WHERE id = ?').get(student_id);

  res.json({
    total_points: user?.total_points || 0,
    rank: user?.rank || 1,
    level: user?.level || 1,
    level_title: user?.level_title || 'نوآموز',
    pluses,
    minuses
  });
});

// ----------------- MEMBERSHIP FEES & RECEIPTS -----------------
app.get('/api/fees/defs', (req, res) => {
  const defs = db.prepare('SELECT * FROM fee_defs ORDER BY grade ASC').all();
  res.json(defs);
});

app.put('/api/fees/defs', (req, res) => {
  const { grade, amount, deadline_fa, lock_date_fa, is_locked } = req.body;
  db.prepare(`
    UPDATE fee_defs SET
      amount = COALESCE(?, amount),
      deadline_fa = COALESCE(?, deadline_fa),
      lock_date_fa = COALESCE(?, lock_date_fa),
      is_locked = COALESCE(?, is_locked)
    WHERE grade = ?
  `).run(amount, deadline_fa, lock_date_fa, is_locked !== undefined ? (is_locked ? 1 : 0) : null, grade);

  res.json({ success: true });
});

app.get('/api/fees/receipts', (req, res) => {
  const { status } = req.query;
  const receipts = db.prepare(`
    SELECT r.*, u.full_name as student_name, u.grade, u.class_name, u.national_id
    FROM fee_receipts r
    JOIN users u ON r.student_id = u.id
    WHERE (? IS NULL OR r.status = ?)
    ORDER BY r.id DESC
  `).all(status || null, status || null);

  res.json(receipts);
});

app.post('/api/fees/receipts', upload.single('receipt_image'), (req, res) => {
  const { student_id, amount = 1500000, tracking_code = '۱۲۳۴۵۶' } = req.body;
  const receipt_image = req.file ? req.file.filename : 'sample-receipt.jpg';

  const stmt = db.prepare(`
    INSERT INTO fee_receipts (student_id, amount, card_number, tracking_code, receipt_image, status, date_fa)
    VALUES (?, ?, '۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰', ?, ?, 'pending', '۴ آبان ۱۴۰۵')
  `);
  stmt.run(student_id, amount, tracking_code, receipt_image);

  db.prepare("UPDATE users SET fee_status = 'pending', is_locked = 0 WHERE id = ?").run(student_id);

  res.json({ success: true, message: 'رسید با موفقیت بارگذاری شد و در انتظار تأیید است.' });
});

// Direct Online Payment Gateway (شاپرک / سداد / به‌پرداخت)
app.post('/api/fees/pay-online', (req, res) => {
  const { student_id, amount = 1500000, fee_type = 'tuition', gateway = 'shaparak' } = req.body;
  if (!student_id) return res.status(400).json({ error: 'شناسه دانش‌آموز الزامی است' });

  const tracking_code = 'SHP-' + Math.floor(100000 + Math.random() * 900000);
  const card_tail = '۶۰۳۷-****-****-' + Math.floor(1000 + Math.random() * 9000);

  // Instantly approve and record receipt
  const stmt = db.prepare(`
    INSERT INTO fee_receipts (student_id, amount, card_number, tracking_code, receipt_image, status, date_fa, fee_type)
    VALUES (?, ?, ?, ?, 'online-gateway-success.png', 'approved', '۴ آبان ۱۴۰۵', ?)
  `);
  stmt.run(student_id, amount, card_tail, tracking_code, fee_type);

  const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(student_id);

  if (fee_type === 'platform') {
    // Payment for Platform & Software service
    db.prepare("UPDATE users SET platform_fee_status = 'paid' WHERE id = ?").run(student_id);
    db.prepare("INSERT INTO accounting (type, title, amount, date_fa, category) VALUES ('income', ?, ?, '۱۴۰۵/۰۸/۰۴', 'هزینه سامانه')")
      .run(`پرداخت آنلاین آبونمان سامانه رشد (${user?.full_name})`, amount);
  } else {
    // Payment for Tuition / Membership fee
    db.prepare("UPDATE users SET fee_status = 'paid', is_locked = 0 WHERE id = ?").run(student_id);
    db.prepare("INSERT INTO accounting (type, title, amount, date_fa, category) VALUES ('income', ?, ?, '۱۴۰۵/۰۸/۰۴', 'شهریه کانون')")
      .run(`پرداخت آنلاین شهریه کانون (${user?.full_name})`, amount);
  }

  res.json({
    success: true,
    message: fee_type === 'platform' 
      ? 'پرداخت آنلاین هزینه اشتراک سامانه با موفقیت انجام شد و اشتراک شما فعال گردید.'
      : 'پرداخت آنلاین شهریه کانون با موفقیت انجام شد و پنل شما آنی فعال گردید.',
    tracking_code,
    amount,
    fee_type,
    date_fa: '۱۴۰۵/۰۸/۰۴ - ۱۶:۳۰'
  });
});

app.put('/api/fees/receipts/:id', (req, res) => {
  const id = req.params.id;
  const { status, reject_reason } = req.body; // approved, rejected

  const receipt = db.prepare('SELECT * FROM fee_receipts WHERE id = ?').get(id);
  if (!receipt) return res.status(404).json({ error: 'رسید یافت نشد' });

  db.prepare(`
    UPDATE fee_receipts SET
      status = ?,
      reject_reason = ?
    WHERE id = ?
  `).run(status, reject_reason || null, id);

  if (status === 'approved') {
    db.prepare("UPDATE users SET fee_status = 'paid', is_locked = 0 WHERE id = ?").run(receipt.student_id);
    // Also record as accounting income
    const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(receipt.student_id);
    db.prepare("INSERT INTO accounting (type, title, amount, date_fa, category) VALUES ('income', ?, ?, '۱۴۰۵/۰۸/۰۴', 'حق عضویت')")
      .run(`واریز حق عضویت آبان (${user?.full_name})`, receipt.amount);
  } else if (status === 'rejected') {
    db.prepare("UPDATE users SET fee_status = 'rejected', is_locked = 1 WHERE id = ?").run(receipt.student_id);
  }

  res.json({ success: true });
});

app.get('/api/fees/report', (req, res) => {
  const grades = ['هفتم', 'هشتم', 'نهم'];
  const report = grades.map(g => {
    const total = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND grade = ?").get(g).count;
    const paid = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND grade = ? AND fee_status = 'paid'").get(g).count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND grade = ? AND fee_status = 'pending'").get(g).count;
    const unpaid = total - paid - pending;

    return {
      grade: g,
      total,
      paid,
      pending,
      unpaid,
      paid_pct: total > 0 ? Math.round((paid / total) * 100) : 0,
      pending_pct: total > 0 ? Math.round((pending / total) * 100) : 0,
      unpaid_pct: total > 0 ? Math.round((unpaid / total) * 100) : 0
    };
  });

  res.json(report);
});

// ----------------- ACCOUNTING -----------------
app.get('/api/accounting/summary', (req, res) => {
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM accounting WHERE type = 'income'").get().total;
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM accounting WHERE type = 'expense'").get().total;
  const net = income - expense;

  // Chart data for daily/monthly comparison
  const chart = [
    { label: '۲۹ مهر', income: 1500000, expense: 450000 },
    { label: '۳۰ مهر', income: 3000000, expense: 900000 },
    { label: '۱ آبان', income: 4500000, expense: 1200000 },
    { label: '۲ آبان', income: 6000000, expense: 1800000 },
    { label: '۳ آبان', income: 3900000, expense: 750000 },
    { label: '۴ آبان', income: 2500000, expense: 500000 }
  ];

  res.json({
    total_income: income,
    total_expense: expense,
    net_balance: net,
    chart
  });
});

app.get('/api/accounting/ledger', (req, res) => {
  const ledger = db.prepare('SELECT * FROM accounting ORDER BY id DESC').all();
  res.json(ledger);
});

app.post('/api/accounting/expense', (req, res) => {
  const { title, amount, date_fa, category } = req.body;
  if (!title || !amount) return res.status(400).json({ error: 'عنوان و مبلغ الزامی هستند' });

  const stmt = db.prepare("INSERT INTO accounting (type, title, amount, date_fa, category) VALUES ('expense', ?, ?, ?, ?)");
  stmt.run(title, amount, date_fa || '۱۴۰۵/۰۸/۰۴', category || 'هزینه‌های عمومی');

  res.json({ success: true });
});

// ----------------- MESSAGES -----------------
app.get('/api/messages', (req, res) => {
  const user_id = req.query.user_id;
  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE sender_id = ? OR receiver_id = ? OR ? IS NULL
    ORDER BY id ASC
  `).all(user_id || null, user_id || null, user_id ? 'filter' : null);

  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, sender_name, receiver_name, text } = req.body;
  const stmt = db.prepare('INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(sender_id, receiver_id, sender_name, receiver_name, text, '۱۴:۳۵');
  res.json({ success: true });
});

// ----------------- STORE -----------------
app.get('/api/store/products', (req, res) => {
  const products = db.prepare('SELECT * FROM store_products ORDER BY id ASC').all();
  res.json(products);
});

app.post('/api/store/checkout', (req, res) => {
  const { user_id, items, product_id, shipping_address, recipient_name, recipient_phone } = req.body;
  const userId = user_id ? parseInt(user_id) : 1;
  const trackingCode = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

  if (items && Array.isArray(items) && items.length > 0) {
    let total = 0;
    for (const item of items) {
      total += (item.price || 0) * (item.quantity || 1);
      db.prepare(`
        INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
      `).run(
        userId,
        item.id || 1,
        item.title || 'بسته آموزشی',
        item.price || 0,
        trackingCode,
        recipient_name || 'کاربر کانون',
        recipient_phone || '۰۹۱۲۳۴۵۶۷۸۹',
        shipping_address || 'آدرس ثبت‌شده'
      );
    }
    db.prepare(`
      INSERT INTO accounting (type, title, amount, date_fa, category)
      VALUES ('income', ?, ?, '۱۴۰۳/۰۸/۰۵', 'فروشگاه سمپاد')
    `).run(`خرید فروشگاه آنلاین سبد خرید (${items.length} قلم)`, total);

    return res.json({ success: true, tracking_code: trackingCode, total });
  }

  // Single product checkout
  const pId = product_id || 1;
  const product = db.prepare('SELECT * FROM store_products WHERE id = ?').get(pId) || { id: 1, title: 'کتاب سمپاد', price: 180000 };
  
  db.prepare(`
    INSERT INTO store_orders (user_id, product_id, product_title, price, tracking_code, recipient_name, recipient_phone, shipping_address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `).run(
    userId,
    product.id,
    product.title,
    product.price,
    trackingCode,
    recipient_name || 'کاربر کانون',
    recipient_phone || '۰۹۱۲۳۴۵۶۷۸۹',
    shipping_address || 'آدرس ثبت‌شده'
  );

  db.prepare(`
    INSERT INTO accounting (type, title, amount, date_fa, category)
    VALUES ('income', ?, ?, '۱۴۰۳/۰۸/۰۵', 'فروشگاه سمپاد')
  `).run(`فروش بسته آموزشی: ${product.title}`, product.price);

  res.json({
    success: true,
    tracking_code: trackingCode,
    order: { product_title: product.title, price: product.price, tracking_code: trackingCode }
  });
});

// ----------------- ADMIN DASHBOARD STATS -----------------
app.get('/api/stats/dashboard', (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
  const paidCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND fee_status = 'paid'").get().count;
  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND fee_status = 'pending'").get().count;
  const absentToday = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date_fa = '۱۴۰۵/۰۸/۰۴' AND status = 'a'").get().count;

  const absentees = db.prepare(`
    SELECT a.*, u.full_name, u.grade, u.class_name, u.parent_phone
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    WHERE a.date_fa = '۱۴۰۵/۰۸/۰۴' AND (a.status = 'a' OR a.status = 'e')
    LIMIT 10
  `).all();

  res.json({
    total_students: totalStudents,
    paid_count: paidCount,
    pending_count: pendingCount,
    absent_today: absentToday,
    absentees
  });
});

// ----------------- PARENT PORTAL -----------------
app.get('/api/parent/overview', (req, res) => {
  const student = db.prepare("SELECT * FROM users WHERE role = 'student' LIMIT 1").get();
  const absentees = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY id DESC').all(student.id);
  const examResult = db.prepare('SELECT * FROM exam_results WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(student.id);

  res.json({
    student,
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

// ----------------- UNIVERSAL MEDIA & FILE MANAGEMENT -----------------
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'هیچ فایلی ارسال نشد' });
  }

  const uploaderId = req.body.uploader_id ? parseInt(req.body.uploader_id) : 1;
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

  try {
    const result = db.prepare(`
      INSERT INTO media_files (uploader_id, file_name, original_name, file_type, mime_type, file_size, file_url, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uploaderId,
      req.file.filename,
      req.file.originalname,
      fileType,
      mime,
      req.file.size,
      fileUrl,
      category
    );

    res.json({
      success: true,
      media_id: result.lastInsertRowid,
      file_url: fileUrl,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_type: fileType,
      size: req.file.size
    });
  } catch (err) {
    console.error('Database error in media upload:', err);
    res.json({
      success: true,
      file_url: fileUrl,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_type: fileType,
      size: req.file.size
    });
  }
});

app.get('/api/media', (req, res) => {
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

app.get('/api/store/orders', (req, res) => {
  const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
  if (userId) {
    const orders = db.prepare('SELECT * FROM store_orders WHERE user_id = ? ORDER BY id DESC').all(userId);
    return res.json(orders);
  }
  const allOrders = db.prepare('SELECT * FROM store_orders ORDER BY id DESC LIMIT 50').all();
  res.json(allOrders);
});

// ----------------- PROFILE UPDATE -----------------
app.post('/api/user/profile', (req, res) => {
  const { user_id, phone, address, parent_phone } = req.body;
  if (!user_id) return res.status(400).json({ error: 'شناسه کاربر الزامی است' });

  db.prepare(`
    UPDATE users 
    SET phone = COALESCE(?, phone), 
        address = COALESCE(?, address),
        parent_phone = COALESCE(?, parent_phone)
    WHERE id = ?
  `).run(phone, address, parent_phone, user_id);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
  res.json({ success: true, user: updatedUser });
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
