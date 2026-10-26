/**
 * Automated Security Test Suite for Roshd Educational Platform
 * Tests authentication, authorization (RBAC), exam answer leakage, IDOR, input validation
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== STARTING ROSHD SECURITY TEST SUITE ===\n');
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
    // 1. Login with correct credentials (student)
    console.log('1. Testing Authentication...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0012345678', password: '123456', role: 'student' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, 'Student login succeeds with valid credentials');
    assert(!loginData.user.password_hash, 'Password hash is not leaked in login user payload');
    const studentToken = loginData.token;

    // 2. Login with wrong password
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0012345678', password: 'wrongpassword', role: 'student' })
    });
    assert(badLoginRes.status === 401, 'Login fails with 401 on wrong password');

    // 3. Login with empty password
    const emptyPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0012345678', password: '', role: 'student' })
    });
    assert(emptyPassRes.status === 400, 'Login fails with 400 when password is omitted');

    // 4. Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0011223344', password: '123456', role: 'admin' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(adminLoginRes.status === 200 && !!adminToken, 'Admin login succeeds with valid credentials');

    // 5. Unauthenticated request to protected endpoint
    console.log('\n2. Testing Access Control & RBAC...');
    const noAuthRes = await fetch(`${BASE_URL}/api/students`);
    assert(noAuthRes.status === 401, 'Unauthenticated request to /api/students returns 401 Unauthorized');

    // 6. Student forbidden from admin endpoint
    const studentAccessAdminRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentAccessAdminRes.status === 403, 'Student access to /api/students returns 403 Forbidden (RBAC enforce)');

    // 7. Admin allowed to access admin endpoint
    const adminAccessRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminAccessRes.status === 200, 'Admin access to /api/students returns 200 OK');

    // 8. Exam answer key leak test
    console.log('\n3. Testing Exam Security (Answer Key Protection)...');
    const examListRes = await fetch(`${BASE_URL}/api/exams`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const examList = await examListRes.json();
    const targetExamId = examList.length > 0 ? examList[0].id : 5;

    const studentExamRes = await fetch(`${BASE_URL}/api/exams/${targetExamId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentExamData = await studentExamRes.json();
    let hasAnswerLeak = false;
    if (studentExamData.questions && studentExamData.questions.length > 0) {
      hasAnswerLeak = studentExamData.questions.some(q => q.correct !== undefined || q.correct_answer !== undefined);
    }
    assert(studentExamRes.status === 200 && !hasAnswerLeak, 'Student exam payload does NOT leak answer keys (q.correct is stripped)');

    const adminExamRes = await fetch(`${BASE_URL}/api/exams/${targetExamId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminExamData = await adminExamRes.json();
    let adminHasKeys = false;
    if (adminExamData.questions && adminExamData.questions.length > 0) {
      adminHasKeys = adminExamData.questions.some(q => q.correct !== undefined);
    }
    assert(adminExamRes.status === 200 && adminHasKeys, 'Admin exam payload retains answer keys for assessment/editing');

    // 9. IDOR & Input Validation on Pomodoro
    console.log('\n4. Testing IDOR & Input Validation...');
    const invalidPomoRes = await fetch(`${BASE_URL}/api/study/pomodoro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ student_id: loginData.user.id, minutes: 500 }) // invalid: exceeds 120
    });
    assert(invalidPomoRes.status === 400, 'Pomodoro rejects excessive study minutes (>120)');

    const idorPomoRes = await fetch(`${BASE_URL}/api/study/pomodoro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ student_id: 999, minutes: 25 }) // student 1 trying to forge student 999
    });
    assert(idorPomoRes.status === 403, 'Pomodoro rejects student IDOR attempt (student cannot record for other students)');

    // 10. Valid Pomodoro recording
    const validPomoRes = await fetch(`${BASE_URL}/api/study/pomodoro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ student_id: loginData.user.id, minutes: 25 })
    });
    assert(validPomoRes.status === 200, 'Valid pomodoro recording succeeds with 200 OK');

    // Summary
    console.log('\n=== SECURITY TEST RESULTS ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed === 0) {
      console.log('STATUS: ALL SECURITY TESTS PASSED PERFECTLY!\n');
    } else {
      console.error(`STATUS: ${failed} TESTS FAILED\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
