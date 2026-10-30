const fs = require('fs');
const path = require('path');
const bcrypt = require('../backend/node_modules/bcryptjs');
const { db } = require('../backend/db');

async function seedBarpaStudents() {
  const dataPath = path.join(__dirname, '..', 'backend', 'data', 'parsed_barpa_20_students.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    return;
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  const records = JSON.parse(raw);
  console.log(`Loaded ${records.length} Barpa student records.`);

  const defaultPasswordHash = await bcrypt.hash('12345678', 10);
  const examId = 'barpa_grade9_stage1';

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of records) {
    const candidateCode = item.candidate_code || `STU9_${item.page}`;
    const fullName = item.full_name;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'دانش‌آموز';
    const lastName = nameParts.slice(1).join(' ') || fullName;
    const phone = '0912' + candidateCode.slice(-7).padStart(7, '0');
    const schoolName = item.school_name || 'شهید کاظمی آشتیانی';
    const total = item.total_summary || {};

    // 1. Check or create student
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
      createdCount++;
    } else {
      db.prepare(`
        UPDATE users 
        SET full_name = ?, first_name = ?, last_name = ?, grade = 'نهم', school_name = ?, is_active = 1
        WHERE id = ?
      `).run(fullName, firstName, lastName, schoolName, user.id);
      updatedCount++;
    }

    // 2. Insert or replace comprehensive_exam_reports
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

    console.log(`[OK] Student: ${fullName} (ID: ${user.id}, Code: ${candidateCode}) -> Report card seeded.`);
  }

  console.log(`\nDone! Created ${createdCount} new student accounts, updated ${updatedCount} accounts.`);
  console.log(`All 20 students have comprehensive Barpa report cards in their panels!`);
}

seedBarpaStudents().catch(err => {
  console.error('Seeding error:', err);
});
