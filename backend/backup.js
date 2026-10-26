const fs = require('fs');
const path = require('path');
const { db } = require('./db');

function createBackup() {
  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Checkpoint WAL to flush all transactions to the main database file
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (err) {
    console.warn('WAL checkpoint warning:', err.message);
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupFileName = `rosh-backup-${timestamp}.db`;
  const backupPath = path.join(backupsDir, backupFileName);

  const dbPath = path.join(__dirname, 'rosh.db');
  fs.copyFileSync(dbPath, backupPath);

  const sizeKb = Math.round(fs.statSync(backupPath).size / 1024);
  console.log(`Backup successfully created: ${backupPath} (${sizeKb} KB)`);
  return { success: true, file: backupFileName, path: backupPath, sizeKb };
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
