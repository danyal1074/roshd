const { db } = require('./db');

console.log('Enriching sample data for full launch showcase...');

// 1. More homework submissions
const homeworks = db.prepare('SELECT id, grade, class_name FROM homeworks').all();
const students = db.prepare("SELECT id, full_name, grade, class_name FROM users WHERE role = 'student' LIMIT 40").all();

const insertSub = db.prepare(`
  INSERT OR IGNORE INTO homework_submissions (homework_id, student_id, submitted_at_fa, file_url, note, is_late, status, grade_score)
  VALUES (?, ?, '۱۴۰۵/۰۸/۰۴', 'hw-sample.pdf', 'حل کامل تمرینات ضمیمه شد', ?, 'submitted', 20)
`);

homeworks.forEach((hw, hIdx) => {
  students.slice(0, 20).forEach((st, sIdx) => {
    insertSub.run(hw.id, st.id, sIdx % 5 === 0 ? 1 : 0);
  });
});

// 2. Exam results for comprehensive rank leaderboard & class results
const exams = db.prepare('SELECT id, title, question_count FROM exams').all();
const insertExamResult = db.prepare(`
  INSERT OR IGNORE INTO exam_results (exam_id, student_id, score, total_questions, correct_count, wrong_count, unanswered_count, percentage, rank, submitted_at_fa)
  VALUES (?, ?, ?, 20, ?, ?, 0, ?, ?, '۱۴۰۵/۰۸/۰۴')
`);

exams.forEach(ex => {
  students.forEach((st, sIdx) => {
    const score = Math.floor(Math.random() * 5) + 16;
    const correct = score;
    const wrong = 20 - correct;
    const pct = Math.round((correct / 20) * 100);
    insertExamResult.run(ex.id, st.id, score, correct, wrong, pct, sIdx + 1);
  });
});

// 3. More study sessions for the Leaderboard
const insertStudy = db.prepare(`
  INSERT OR REPLACE INTO study_sessions (student_id, date_fa, pomodoros_count, total_minutes)
  VALUES (?, '۱۴۰۵/۰۸/۰۴', ?, ?)
`);

students.slice(0, 15).forEach((st, idx) => {
  const pomo = 6 - (idx % 4);
  insertStudy.run(st.id, pomo, pomo * 25);
});

// 4. More messages in Teacher & Parent chat
const insertMsg = db.prepare(`
  INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertMsg.run(1, 2, 'محمد کریمی (مدیر کانون)', 'فاطمه احمدی (دبیر علوم)', 'سلام خانم احمدی، لطفا بودجه‌بندی آزمون جامع هفتم را تا فردا بررسی بفرمایید.', '۰۹:۴۰');
insertMsg.run(2, 1, 'فاطمه احمدی (دبیر علوم)', 'محمد کریمی (مدیر کانون)', 'سلام آقای کریمی، بودجه‌بندی تنظیم شد و در پنل ثبت گردید.', '۰۹:۵۵');
insertMsg.run(2, 5, 'خانم احمدی (معلم)', 'علی رضایی', 'آفرین علی، پیشرفت چشمگیری در حل مسائل شیمی داشتی.', '۱۱:۲۰');
insertMsg.run(6, 2, 'مهدی رضایی (پدر علی)', 'خانم احمدی (معلم)', 'سلام خانم احمدی، از پیگیری و تدریس دلسوزانه‌تان صمیمانه سپاسگزاریم.', '۱۲:۱۵');

console.log('Sample data enrichment completed successfully!');
