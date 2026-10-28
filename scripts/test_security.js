/**
 * Automated Security Test Suite for Roshd Educational Platform
 * Tests authentication, authorization (RBAC), exam answer leakage, IDOR, input validation,
 * token invalidation (token_version), password change/reset, must_change_password guard, and CSRF.
 */

const BASE_URL = 'http://127.0.0.1:5000';

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
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '0088776655', password: 'Student@Pass2026', role: 'student' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, 'Student login succeeds with valid credentials');
    assert(!loginData.user.password_hash && !loginData.user.password, 'Password/hash is not leaked in login user payload');
    const studentToken = loginData.token;

    // 2. Login with wrong password
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '0088776655', password: 'wrongpassword', role: 'student' })
    });
    assert(badLoginRes.status === 401, 'Login fails with 401 on wrong password');

    // 3. Login with empty password
    const emptyPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '0088776655', password: '', role: 'student' })
    });
    assert(emptyPassRes.status === 400, 'Login fails with 400 when password is omitted');

    // 4. Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: 'admin', password: 'danyal1074', role: 'admin' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(adminLoginRes.status === 200 && !!adminToken, 'Admin login succeeds with valid credentials');

    // 5. Unauthenticated request to protected endpoint
    console.log('\n2. Testing Access Control & RBAC...');
    const noAuthRes = await fetch(`${BASE_URL}/api/students`);
    assert(noAuthRes.status === 401, 'Unauthenticated request to /api/students returns 401 Unauthorized');

    // 6. Student accessing admin-only endpoint (RBAC check)
    const forbiddenRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(forbiddenRes.status === 403, 'Student cannot access admin-only /api/students (403 Forbidden)');

    // 7. Admin accessing admin-only endpoint
    const adminAccessRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminAccessRes.status === 200, 'Admin can access /api/students (200 OK)');

    // 8. Exam Answer Leakage Test
    console.log('\n3. Testing Exam Key Masking...');
    const listExamsRes = await fetch(`${BASE_URL}/api/exams`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const listExams = await listExamsRes.json();
    const targetExamId = Array.isArray(listExams) && listExams.length > 0 ? listExams[0].id : 1;

    const studentExamRes = await fetch(`${BASE_URL}/api/exams/${targetExamId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentExamData = await studentExamRes.json();
    let hasLeak = false;
    if (studentExamData.questions) {
      for (const q of studentExamData.questions) {
        if (q.correct !== undefined || q.correct_answer !== undefined) {
          hasLeak = true;
          break;
        }
      }
    }
    assert(studentExamRes.status === 200 && !hasLeak, 'Student exam endpoint strips all correct answer keys');

    // 9. Teacher/Admin retains exam answer keys
    const adminExamRes = await fetch(`${BASE_URL}/api/exams/${targetExamId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminExamData = await adminExamRes.json();
    let adminHasKeys = false;
    if (adminExamData.questions && adminExamData.questions.length > 0) {
      adminHasKeys = adminExamData.questions.some(q => q.correct !== undefined || q.correct_answer !== undefined);
    }
    assert(adminExamRes.status === 200 && adminHasKeys, 'Admin/Teacher retains correct answer keys for evaluation');

    // 10. Pomodoro Input Validation
    console.log('\n4. Testing Pomodoro & IDOR...');
    const badPomodoroRes = await fetch(`${BASE_URL}/api/study/pomodoro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ minutes: 500 }) // Invalid minutes (> 120)
    });
    assert(badPomodoroRes.status === 400, 'Pomodoro rejects invalid minutes (> 120) with 400 Bad Request');

    // 11. Pomodoro IDOR Prevention
    const idorPomodoroRes = await fetch(`${BASE_URL}/api/study/pomodoro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ minutes: 25, student_id: 9999 })
    });
    assert(idorPomodoroRes.status === 403, 'Pomodoro blocks student from submitting points for another student ID');

    // 12. Valid Pomodoro Submission
    const validPomodoroRes = await fetch(`${BASE_URL}/api/study/pomodoro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ minutes: 25 })
    });
    assert(validPomodoroRes.status === 200, 'Student can submit legitimate 25-minute Pomodoro for themselves');

    // 13. Private File Access Control
    console.log('\n5. Testing Private File Access Control...');
    const noAuthReceiptRes = await fetch(`${BASE_URL}/uploads/receipts/nonexistent.jpg`);
    assert(noAuthReceiptRes.status === 401, 'Unauthenticated access to receipts returns 401');

    const noAuthHwRes = await fetch(`${BASE_URL}/uploads/homeworks/nonexistent.pdf`);
    assert(noAuthHwRes.status === 401, 'Unauthenticated access to homeworks returns 401');

    // 14. Admin Backup Endpoint Security (RBAC)
    console.log('\n6. Testing Atomic Backup Security & RBAC...');
    const studentBackupRes = await fetch(`${BASE_URL}/api/admin/backup`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentBackupRes.status === 403, 'Student cannot trigger database backups (403 Forbidden)');

    const adminBackupRes = await fetch(`${BASE_URL}/api/admin/backup`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminBackupData = await adminBackupRes.json();
    assert(adminBackupRes.status === 200 && adminBackupData.success === true, 'Admin triggers atomic online SQLite backup successfully with 200 OK');

    // 15. Password Change Validation
    console.log('\n7. Testing Password Change & Session Invalidation (Phase 2)...');
    const shortPwRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ current_password: 'Student@Pass2026', new_password: '123' })
    });
    assert(shortPwRes.status === 400, 'Password change rejects password shorter than 8 chars');

    const natIdPwRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ current_password: 'Student@Pass2026', new_password: '0088776655' })
    });
    assert(natIdPwRes.status === 400, 'Password change rejects password equal to national ID');

    // 16. Valid Password Change & Session Invalidation
    const changePwRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`,
        'x-api-client': 'test-runner'
      },
      body: JSON.stringify({ current_password: 'Student@Pass2026', new_password: 'NewStrongPassword@2026' })
    });
    const changePwData = await changePwRes.json();
    assert(changePwRes.status === 200, 'Password change succeeds with valid new password');
    const updatedStudentToken = changePwData.token;

    // Old token must now be invalid due to token_version bump!
    const oldTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(oldTokenRes.status === 401, 'Old session token is invalidated immediately after password change (token_version check)');

    // New token must work
    const newTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${updatedStudentToken}` }
    });
    assert(newTokenRes.status === 200, 'Updated session token works after password change');

    // 17. Admin Reset Password
    console.log('\n8. Testing Admin Password Reset & must_change_password Guard...');
    const studentUserId = loginData.user.id;
    const resetRes = await fetch(`${BASE_URL}/api/admin/users/${studentUserId}/reset-password`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && !!resetData.new_password, 'Admin can reset student password and receive temporary password');

    // Previous active token of student is now invalidated
    const postResetOldTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${updatedStudentToken}` }
    });
    assert(postResetOldTokenRes.status === 401, 'Student token is invalidated when admin resets their password');

    // Student logs in with reset temp password
    const resetLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-client': 'test-runner' },
      body: JSON.stringify({ identifier: '0088776655', password: resetData.new_password, role: 'student' })
    });
    const resetLoginData = await resetLoginRes.json();
    assert(resetLoginRes.status === 200 && resetLoginData.user.must_change_password === 1, 'Student logs in with reset password and must_change_password is 1');
    const resetStudentToken = resetLoginData.token;

    // Student tries to access learning endpoints while must_change_password=1
    const blockedEndpointRes = await fetch(`${BASE_URL}/api/homeworks`, {
      headers: { 'Authorization': `Bearer ${resetStudentToken}` }
    });
    const blockedData = await blockedEndpointRes.json();
    assert(blockedEndpointRes.status === 403 && blockedData.code === 'MUST_CHANGE_PASSWORD', 'Access to API endpoints is blocked with MUST_CHANGE_PASSWORD when must_change_password=1');

    // Student changes password to clear must_change_password
    const clearMustChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resetStudentToken}`,
        'x-api-client': 'test-runner'
      },
      body: JSON.stringify({ current_password: resetData.new_password, new_password: 'Student@Pass2026' })
    });
    const clearMustChangeData = await clearMustChangeRes.json();
    assert(clearMustChangeRes.status === 200 && clearMustChangeData.user.must_change_password === 0, 'Changing password clears must_change_password flag');

    // 18. CSRF Protection
    console.log('\n9. Testing CSRF Protection...');
    const csrfRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Origin': 'https://evil.example.com',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert(csrfRes.status === 403, 'Mutating request with malicious Origin header is rejected with 403 (CSRF Protection)');

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
