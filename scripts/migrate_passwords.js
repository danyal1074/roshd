const { db } = require('../backend/db');
const bcrypt = require('../backend/node_modules/bcryptjs');

console.log('Starting secure password migration to bcrypt hashes...');

const users = db.prepare('SELECT id, password FROM users').all();
let migrated = 0;
let alreadyHashed = 0;

const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');

db.exec('BEGIN TRANSACTION;');
try {
  for (const user of users) {
    const pw = user.password;
    if (!pw) continue;

    // Check if already bcrypt hash
    if (pw.startsWith('$2a$') || pw.startsWith('$2b$')) {
      alreadyHashed++;
      continue;
    }

    // Hash legacy plaintext password
    const hashed = bcrypt.hashSync(pw, 10);
    updateStmt.run(hashed, user.id);
    migrated++;
  }
  db.exec('COMMIT;');
  console.log(`Password migration complete!`);
  console.log(`- Migrated plaintext passwords: ${migrated}`);
  console.log(`- Already hashed: ${alreadyHashed}`);
  console.log(`- Total users: ${users.length}`);
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Migration failed, rolled back:', err);
  process.exit(1);
}
