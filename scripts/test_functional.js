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
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '0088776655', password: 'Student@Pass2026', role: 'student' })
    });
    const student = await studentRes.json();

    const teacherRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '0022334455', password: 'Teacher@Pass2026', role: 'teacher' })
    });
    const teacher = await teacherRes.json();

    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: 'admin', password: process.env.TEST_ADMIN_PASSWORD, role: 'admin' })
    });
    const admin = await adminRes.json();

    const parentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '09121112233', password: 'Parent@Pass2026', role: 'parent' })
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
    const examCreateRes = await fetch(`${BASE_URL}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacher.token}`
      },
      body: JSON.stringify({
        title: 'آزمون آزمایشی علوم و فیزیک',
        grade: 'هفتم',
        class_name: 'الف',
        subject: 'علوم تجربی',
        duration_minutes: 20,
        question_count: 2,
        questions: [
          { id: 1, question: 'واحد بار الکتریکی چیست؟', options: ['کولن', 'آمپر', 'ولت', 'اهم'], correct: 0 },
          { id: 2, question: 'نقطه جوش آب در سطح دریا چند درجه است؟', options: ['۵۰', '۱۰۰', '۰', '۳۷'], correct: 1 }
        ]
      })
    });
    const createdExam = await examCreateRes.json();
    assert(examCreateRes.status === 200 && !!createdExam.id, 'Teacher creates new exam');

    const examListRes = await fetch(`${BASE_URL}/api/exams?grade=${encodeURIComponent('هفتم')}&class_name=${encodeURIComponent('الف')}`, {
      headers: { 'Authorization': `Bearer ${student.token}` }
    });
    const exams = await examListRes.json();
    assert(Array.isArray(exams) && exams.length > 0, 'Student lists available exams');

    // Student starts exam
    const startRes = await fetch(`${BASE_URL}/api/exams/${createdExam.id}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${student.token}` }
    });
    assert(startRes.status === 200, 'Student starts exam session');

    // Student submits exam
    const examSubmitRes = await fetch(`${BASE_URL}/api/exams/${createdExam.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({
        answers: { '1': 0, '2': 1 }
      })
    });
    const examScore = await examSubmitRes.json();
    assert(examSubmitRes.status === 200 && typeof examScore.percentage === 'number', 'Student submits exam and receives automated score');

    // Duplicate submission blocked with 409
    const dupRes = await fetch(`${BASE_URL}/api/exams/${createdExam.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({ answers: { '1': 0 } })
    });
    assert(dupRes.status === 409, 'Duplicate exam submission is blocked with 409 Conflict');

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

    // 7. Testing Admin Settings & Payment Management
    console.log('\n7. Testing System Settings & Tuition Management...');
    const pubSetRes = await fetch(`${BASE_URL}/api/settings/public`);
    const pubSet = await pubSetRes.json();
    assert(pubSetRes.status === 200 && pubSet.settings && !!pubSet.settings.card_number, 'Public settings returns valid bank & brand info');

    const adminSetRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { 'Authorization': `Bearer ${admin.token}` }
    });
    const adminSet = await adminSetRes.json();
    assert(adminSetRes.status === 200 && Array.isArray(adminSet.fee_defs), 'Admin retrieves full settings and fee definitions');

    const updateSetRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${admin.token}`
      },
      body: JSON.stringify({
        settings: {
          brand_name: 'کانون نخبه‌پروری شهید کاظم آشتیانی',
          card_number: '۶۰۳۷-۹۹۷۰-۱۱۱۱-۲۲۲۲',
          card_holder: 'کانون مرکزی آشتیانی',
          bank_name: 'بانک ملی ایران',
          contact_phone: '۰۲۱-۸۸۸۸۴۴۲۲'
        },
        fee_defs: [
          { grade: 'هفتم', amount: 1550000, deadline_fa: '۱۴۰۵/۰۸/۲۰', lock_date_fa: '۱۴۰۵/۰۹/۰۱', is_locked: 0 },
          { grade: 'هشتم', amount: 1700000, deadline_fa: '۱۴۰۵/۰۸/۲۰', lock_date_fa: '۱۴۰۵/۰۹/۰۱', is_locked: 0 },
          { grade: 'نهم', amount: 1850000, deadline_fa: '۱۴۰۵/۰۸/۲۰', lock_date_fa: '۱۴۰۵/۰۹/۰۱', is_locked: 0 }
        ]
      })
    });
    const updateSet = await updateSetRes.json();
    assert(updateSetRes.status === 200 && updateSet.success, 'Admin updates settings and fee definitions');

    // Online payment disabled guard (501)
    const payOnlineRes = await fetch(`${BASE_URL}/api/fees/pay-online`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student.token}`
      },
      body: JSON.stringify({ amount: 1500000, fee_type: 'tuition' })
    });
    assert(payOnlineRes.status === 501, 'Unconfigured online payment gateway returns 501 Not Implemented');

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

