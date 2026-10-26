/**
 * Functional End-to-End Test Suite for Roshd Educational Platform
 * Validates attendance, homework, exams, store checkout, notices, and admin workflows
 */

const BASE_URL = 'http://localhost:5000';

async function runFunctionalTests() {
  console.log('=== STARTING ROSHD FUNCTIONAL TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // Authenticate roles
    const studentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0012345678', password: '123456', role: 'student' })
    });
    const student = await studentRes.json();

    const teacherRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0022334455', password: '123456', role: 'teacher' })
    });
    const teacher = await teacherRes.json();

    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0011223344', password: '123456', role: 'admin' })
    });
    const admin = await adminRes.json();

    const parentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '09121112233', password: '123456', role: 'parent' })
    });
    const parent = await parentRes.json();

    // 1. Attendance Workflow
    console.log('1. Testing Attendance Workflow...');
    const attSaveRes = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacher.token}`
      },
      body: JSON.stringify({
        date_fa: '۱۴۰۵/۰۸/۰۴',
        records: [
          { student_id: student.user.id, status: 'present', delay_minutes: 0, note: 'حضور منظم' }
        ]
      })
    });
    assert(attSaveRes.status === 200, 'Teacher submits student attendance record');

    const attGetRes = await fetch(`${BASE_URL}/api/attendance?grade=${encodeURIComponent('هفتم')}&class_name=${encodeURIComponent('الف')}&date_fa=${encodeURIComponent('۱۴۰۵/۰۸/۰۴')}`, {
      headers: { 'Authorization': `Bearer ${teacher.token}` }
    });
    const attList = await attGetRes.json();
    assert(Array.isArray(attList) && attList.length > 0, 'Teacher queries attendance list successfully');

    // 2. Homework Workflow
    console.log('\n2. Testing Homework Workflow...');
    const hwCreateRes = await fetch(`${BASE_URL}/api/homeworks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacher.token}`
      },
      body: JSON.stringify({
        title: 'تکلیف تستی ریاضی',
        subject: 'ریاضی',
        grade: 'هفتم',
        class_name: 'الف',
        deadline_fa: '۱۴۰۵/۰۸/۱۰',
        description: 'تمرین‌های صفحه ۴۰ تا ۴۲',
        max_score: 20
      })
    });
    const createdHw = await hwCreateRes.json();
    assert(hwCreateRes.status === 200 && !!createdHw.id, 'Teacher creates new homework assignment');

    const studentHwRes = await fetch(`${BASE_URL}/api/homeworks?student_id=${student.user.id}&grade=${encodeURIComponent('هفتم')}&class_name=${encodeURIComponent('الف')}`, {
      headers: { 'Authorization': `Bearer ${student.token}` }
    });
    const studentHws = await studentHwRes.json();
    assert(Array.isArray(studentHws) && studentHws.some(h => h.id === createdHw.id), 'Student sees newly assigned homework');

    const hwSubmitRes = await fetch(`${BASE_URL}/api/homeworks/${createdHw.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({
        student_id: student.user.id,
        note: 'پاسخ کامل تمرین‌ها در فایل پیوست ارسال شد.',
        file_url: 'answers_math.pdf'
      })
    });
    assert(hwSubmitRes.status === 200, 'Student submits homework successfully');

    // 3. Exam Workflow
    console.log('\n3. Testing Exam Workflow...');
    const examListRes = await fetch(`${BASE_URL}/api/exams?grade=${encodeURIComponent('هفتم')}&class_name=${encodeURIComponent('الف')}`, {
      headers: { 'Authorization': `Bearer ${student.token}` }
    });
    const exams = await examListRes.json();
    assert(Array.isArray(exams) && exams.length > 0, 'Student lists available exams');

    const targetExam = exams[0];
    const examSubmitRes = await fetch(`${BASE_URL}/api/exams/${targetExam.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({
        student_id: student.user.id,
        answers: { 0: 0, 1: 1 }
      })
    });
    const examScore = await examSubmitRes.json();
    assert(examSubmitRes.status === 200 && typeof examScore.percentage === 'number', 'Student submits exam and receives automated score');

    // 4. Store Checkout Workflow
    console.log('\n4. Testing Store & Checkout Workflow...');
    const storeProdsRes = await fetch(`${BASE_URL}/api/store/products`);
    const storeProds = await storeProdsRes.json();
    assert(Array.isArray(storeProds) && storeProds.length > 0, 'Store products listed successfully');

    const checkoutRes = await fetch(`${BASE_URL}/api/store/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({
        items: [
          { id: storeProds[0].id, title: storeProds[0].title, points_price: 50, qty: 1 }
        ],
        total: 50
      })
    });
    const checkoutData = await checkoutRes.json();
    assert(checkoutRes.status === 200 && !!checkoutData.tracking_code, 'Student completes reward purchase with tracking code generated');

    // 5. Parent Overview Workflow
    console.log('\n5. Testing Parent Overview Workflow...');
    const parentResOverview = await fetch(`${BASE_URL}/api/parent/overview`, {
      headers: { 'Authorization': `Bearer ${parent.token}` }
    });
    const parentData = await parentResOverview.json();
    assert(parentResOverview.status === 200 && parentData.student !== undefined, 'Parent retrieves child academic & attendance overview');

    // 6. Admin Accounting & Notice System
    console.log('\n6. Testing Admin Workflows...');
    const accSummaryRes = await fetch(`${BASE_URL}/api/accounting/summary`, {
      headers: { 'Authorization': `Bearer ${admin.token}` }
    });
    const accSummary = await accSummaryRes.json();
    assert(accSummaryRes.status === 200 && typeof accSummary.total_income === 'number', 'Admin queries financial summary');

    const noticeCreateRes = await fetch(`${BASE_URL}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${admin.token}`
      },
      body: JSON.stringify({
        title: 'اطلاعیه شروع اردوی علمی',
        content: 'اردوی علمی روز پنجشنبه ساعت ۸ صبح از کانون برگزار می‌شود.',
        target_role: 'all',
        target_grade: 'all',
        is_pinned: 1
      })
    });
    const createdNotice = await noticeCreateRes.json();
    assert(noticeCreateRes.status === 200 && !!createdNotice.id, 'Admin broadcasts platform announcement');

    const noticeSeenRes = await fetch(`${BASE_URL}/api/notices/seen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({
        notice_id: createdNotice.id,
        user_id: student.user.id
      })
    });
    assert(noticeSeenRes.status === 200, 'Student marks notice as read');

    // Summary
    console.log('\n=== FUNCTIONAL TEST RESULTS ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed === 0) {
      console.log('STATUS: ALL FUNCTIONAL WORKFLOWS VERIFIED 100% OPERATIONAL!\n');
    } else {
      console.error(`STATUS: ${failed} FUNCTIONAL TESTS FAILED\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during functional test execution:', err);
    process.exit(1);
  }
}

runFunctionalTests();
