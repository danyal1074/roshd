/**
 * Automated Test Suite for SQLite Online Backup, Checksum Verification and Safe Restore
 */

const fs = require('fs');
const path = require('path');
const { createBackup, verifyBackup, restoreBackup, calculateChecksum } = require('../backend/backup');
const { dbPath } = require('../backend/db');

async function runBackupRestoreTests() {
  console.log('=== STARTING SQLITE ATOMIC BACKUP & RESTORE TEST SUITE ===\n');
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

  const testTempDir = path.join(__dirname, '../backend/test-backup-dir');
  const tempRestoreTarget = path.join(testTempDir, 'restored-test.db');

  try {
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testTempDir, { recursive: true });

    // 1. Create Atomic Backup
    console.log('1. Testing Atomic Online Backup Creation...');
    const backupRes = createBackup(testTempDir);
    assert(backupRes.success === true, 'createBackup returns success: true');
    assert(fs.existsSync(backupRes.path), 'Backup database file exists on disk');
    assert(fs.existsSync(backupRes.metaPath), 'Backup metadata sidecar JSON exists on disk');
    assert(backupRes.sizeKb > 0, `Backup size is valid (${backupRes.sizeKb} KB)`);
    assert(!!backupRes.checksum, 'SHA-256 checksum is computed');

    // 2. Verify Backup Integrity
    console.log('\n2. Testing Backup Verification and PRAGMA integrity_check...');
    const verifyRes = verifyBackup(backupRes.path);
    assert(verifyRes.verified === true, 'verifyBackup reports verified: true');
    assert(verifyRes.integrityCheck === 'ok', 'PRAGMA integrity_check returns ok');
    assert(verifyRes.userCount >= 400, `User count in backup is intact (${verifyRes.userCount} users)`);
    assert(verifyRes.settingsCount >= 6, 'Settings table is intact in backup');

    // 3. Test Tamper Detection
    console.log('\n3. Testing Tamper Detection via SHA-256...');
    const meta = JSON.parse(fs.readFileSync(backupRes.metaPath, 'utf-8'));
    meta.sha256 = 'tampered_fake_checksum_0000000000000000000000000000000000000000';
    fs.writeFileSync(backupRes.metaPath, JSON.stringify(meta), 'utf-8');

    let tamperCaught = false;
    try {
      verifyBackup(backupRes.path);
    } catch (e) {
      tamperCaught = true;
    }
    assert(tamperCaught, 'Tampered checksum is successfully detected and rejected');

    // Restore correct checksum for restore test
    meta.sha256 = calculateChecksum(backupRes.path);
    fs.writeFileSync(backupRes.metaPath, JSON.stringify(meta), 'utf-8');

    // 4. Test Safe Database Restore
    console.log('\n4. Testing Safe Database Restore to Isolated Target...');
    const restoreRes = restoreBackup(backupRes.path, tempRestoreTarget);
    assert(restoreRes.success === true, 'restoreBackup returns success: true');
    assert(fs.existsSync(tempRestoreTarget), 'Restored database file exists at target destination');
    assert(restoreRes.usersRestored === verifyRes.userCount, `Restored users count matches original (${restoreRes.usersRestored})`);

    // Verify restored database integrity
    const restoredVerify = verifyBackup(tempRestoreTarget);
    assert(restoredVerify.verified === true && restoredVerify.integrityCheck === 'ok', 'Restored database passes PRAGMA integrity_check');

    // Clean up
    fs.rmSync(testTempDir, { recursive: true, force: true });
    console.log('\n  [CLEANUP] Temporary test backup files cleaned up.');

    // Summary
    console.log('\n=== BACKUP & RESTORE TEST RESULTS ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed === 0) {
      console.log('STATUS: ALL BACKUP & RESTORE TESTS PASSED PERFECTLY!\n');
    } else {
      console.error(`STATUS: ${failed} TESTS FAILED\n`);
      process.exit(1);
    }

  } catch (err) {
    console.error('Fatal error during backup test execution:', err);
    if (fs.existsSync(testTempDir)) {
      try { fs.rmSync(testTempDir, { recursive: true, force: true }); } catch (e) {}
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runBackupRestoreTests();
}

module.exports = { runBackupRestoreTests };
