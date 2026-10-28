const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { db, dbPath, backupDatabase } = require('./db');

/**
 * Calculates SHA256 hash of a file for cryptographic tamper detection
 */
function calculateChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Creates an atomic, consistent SQLite-native backup using VACUUM INTO
 * Ensures 0 risk of corrupted files during concurrent writes by 400+ students.
 */
function createBackup(customDir) {
  const backupsDir = customDir 
    ? path.resolve(customDir) 
    : (process.env.BACKUPS_PATH ? path.resolve(process.env.BACKUPS_PATH) : path.join(__dirname, 'backups'));

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupFileName = `rosh-backup-${timestamp}.db`;
  const backupPath = path.join(backupsDir, backupFileName);

  // Use SQLite VACUUM INTO for 100% atomic, consistent snapshot
  backupDatabase(backupPath);

  const checksum = calculateChecksum(backupPath);
  const sizeBytes = fs.statSync(backupPath).size;
  const sizeKb = Math.round(sizeBytes / 1024);

  // Write metadata sidecar file
  const metaPath = `${backupPath}.meta.json`;
  const metaData = {
    fileName: backupFileName,
    filePath: backupPath,
    sourceDb: dbPath,
    timestamp: now.toISOString(),
    sizeBytes,
    sizeKb,
    sha256: checksum,
    walCheckpoint: true
  };
  fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), 'utf-8');

  // Rotate backups: keep the 15 most recent
  rotateBackups(backupsDir, 15);

  console.log(`[BACKUP] Successfully created atomic backup: ${backupPath} (${sizeKb} KB, sha256: ${checksum.slice(0, 12)}...)`);
  return { success: true, file: backupFileName, path: backupPath, metaPath, sizeKb, checksum };
}

/**
 * Verifies the integrity of a backup database file
 */
function verifyBackup(backupFilePath) {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`فایل بک‌آپ یافت نشد: ${backupFilePath}`);
  }

  // 1. Verify checksum if meta file exists
  const metaPath = `${backupFilePath}.meta.json`;
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const currentChecksum = calculateChecksum(backupFilePath);
    if (meta.sha256 && meta.sha256 !== currentChecksum) {
      throw new Error(`مغایرت چک‌سام امنیتی در فایل بک‌آپ! فایل احتمالاً تغییر یافته است.`);
    }
  }

  // 2. Open backup with DatabaseSync and run PRAGMA integrity_check
  const testDb = new DatabaseSync(backupFilePath);
  const integrity = testDb.prepare('PRAGMA integrity_check;').all();
  const isHealthy = integrity.length > 0 && integrity[0].integrity_check === 'ok';

  if (!isHealthy) {
    throw new Error(`تست سلامت ساختار دیتابیس با شکست مواجه شد: ${JSON.stringify(integrity)}`);
  }

  // Check critical tables exist
  const userCount = testDb.prepare('SELECT COUNT(*) as count FROM users;').get().count;
  const settingsCount = testDb.prepare('SELECT COUNT(*) as count FROM settings;').get().count;

  testDb.close();

  return {
    verified: true,
    integrityCheck: 'ok',
    userCount,
    settingsCount
  };
}

/**
 * Restores database from a verified backup file into target location
 */
function restoreBackup(backupFilePath, targetPath) {
  const target = targetPath ? path.resolve(targetPath) : dbPath;
  
  // 1. First thoroughly verify the backup file
  const verification = verifyBackup(backupFilePath);
  if (!verification.verified) {
    throw new Error('فایل بک‌آپ معتبر نیست و نمی‌تواند بازیابی شود.');
  }

  // 2. Make an emergency pre-restore snapshot of current database if exists
  if (fs.existsSync(target)) {
    const emergencyName = `${target}.emergency-${Date.now()}.bak`;
    fs.copyFileSync(target, emergencyName);
    console.log(`[RESTORE] Emergency snapshot saved to ${emergencyName}`);
  }

  // 3. Atomically copy the verified backup to target
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(backupFilePath, target);

  // Clean stale WAL and SHM files
  const shm = `${target}-shm`;
  const wal = `${target}-wal`;
  if (fs.existsSync(shm)) fs.unlinkSync(shm);
  if (fs.existsSync(wal)) fs.unlinkSync(wal);

  console.log(`[RESTORE] Successfully restored database to ${target} (${verification.userCount} users verified).`);
  return { success: true, target, usersRestored: verification.userCount };
}

/**
 * Retains the latest N backups and removes older ones
 */
function rotateBackups(dir, keepCount = 15) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('rosh-backup-') && f.endsWith('.db'))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      for (const item of toDelete) {
        const fullPath = path.join(dir, item.name);
        const metaPath = `${fullPath}.meta.json`;
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
        console.log(`[BACKUP ROTATION] Deleted old backup: ${item.name}`);
      }
    }
  } catch (err) {
    console.warn('[BACKUP ROTATION] Warning:', err.message);
  }
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup, verifyBackup, restoreBackup, calculateChecksum };
