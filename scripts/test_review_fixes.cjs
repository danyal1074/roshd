// Dependency-free regression checks: production route handlers with real SQLite.
// bcrypt is replaced only in the bootstrap tests; this does not test bcrypt itself.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8');
const os = require('node:os');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'roshd-review-'));
const env = { DB_PATH: path.join(tempDir, 'test.db'), ADMIN_INITIAL_PASSWORD: 'UniqueBootstrap2026!' };
const bcrypt = { hash: async p => '$test$' + p, compare: async (p, hash) => hash === '$test$' + p };
const moduleStub = { exports: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'backend/db.js'), 'utf8'), {
  require: name => name === 'bcryptjs' ? bcrypt : require(name),
  __dirname: path.join(root, 'backend'), module: moduleStub, process: { env }, console
});
const { db, ensureAdminUser } = moduleStub.exports;
// db.js resolves DB_PATH relative to the project, so use an in-memory replacement
// for every test to avoid touching any real deployment data.
const testDb = new DatabaseSync(':memory:');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
for (const row of schema) testDb.exec(row.sql);
db.close();
fs.rmSync(tempDir, { recursive: true, force: true });
function response() { return { code: 200, status(n) { this.code = n; return this; }, json(data) { this.data = data; return this; } }; }
function handler(route, extras = {}) {
  const a = source.indexOf("app.post('" + route + "'");
  const b = source.indexOf('\n});', a);
  assert.ok(a >= 0 && b > a);
  let fn;
  const context = {
    app: { post: (...args) => fn = args.at(-1) }, requireAuth() {}, requireRole() {},
    db: testDb, path, fs, require, process: { env: { NODE_ENV: 'production' } },
    recordAudit() {}, getJalaliDate: () => '۱۴۰۵/۰۸/۰۹',
    upload: { single() { return () => {}; } },
    validateFileMagicBytes: () => true,
    hashPassword: bcrypt.hash, validateIranianNationalId: () => true, ...extras
  };
  const accessA = source.indexOf('function validateExamAccess');
  const accessB = source.indexOf('\n}\n', accessA) + 2;
  vm.createContext(context);
  vm.runInContext(source.slice(accessA, accessB), context);
  vm.runInContext(source.slice(a, b + 4), context);
  return fn;
}
async function run() {
  await ensureAdminUser(testDb);
  let admin = testDb.prepare("SELECT * FROM users WHERE role='admin'").get();
  assert.equal(admin.must_change_password, 1);
  testDb.prepare('UPDATE users SET password=?, is_active=0 WHERE id=?').run('$test$ChosenPassword!', admin.id);
  await ensureAdminUser(testDb);
  admin = testDb.prepare('SELECT * FROM users WHERE id=?').get(admin.id);
  assert.equal(admin.password, '$test$ChosenPassword!');
  assert.equal(admin.is_active, 0);
  testDb.prepare('UPDATE users SET password=? WHERE id=?').run('$test$danyal1074', admin.id);
  const oldVersion = admin.token_version;
  await ensureAdminUser(testDb);
  admin = testDb.prepare('SELECT * FROM users WHERE id=?').get(admin.id);
  assert.equal(admin.token_version, oldVersion + 1);
  assert.equal(admin.is_active, 0);
  env.ADMIN_INITIAL_PASSWORD = '';
  testDb.prepare('UPDATE users SET password=? WHERE id=?').run('$test$danyal1074', admin.id);
  await assert.rejects(ensureAdminUser(testDb), /ADMIN_INITIAL_PASSWORD/);
  console.log('PASS: bootstrap preserves secure passwords/disabled status, rotates exposed password and revokes sessions, fails closed without configuration');

  const registered = response();
  await handler('/api/students')({ user: { id: admin.id }, body: {
    national_id: '0123456789', first_name: 'نام', last_name: 'آزمایشی', parent_phone: '09123456789'
  } }, registered);
  assert.equal(registered.code, 200);
  const student = testDb.prepare('SELECT * FROM users WHERE id=?').get(registered.data.id);
  assert.equal(student.password, '$test$' + registered.data.initial_password);
  assert.equal(testDb.prepare('SELECT COUNT(*) AS n FROM parent_students').get().n, 1);
  console.log('PASS: manual enrollment persists resolved student/parent hashes and links parent');

  testDb.prepare(`INSERT INTO exams (title,grade,class_name,duration_minutes,questions_json) VALUES ('test','هفتم','الف',1,?)`).run('[{"id":1,"correct":2}]');
  const request = { params: { id: '1' }, user: { id: student.id, role: 'student', grade: 'هفتم', class_name: 'الف' }, body: { answers: { 1: 2 } } };
  const submit = handler('/api/exams/:id/submit');
  let res = response(); submit(request, res); assert.equal(res.code, 400);
  const start = handler('/api/exams/:id/start');
  res = response(); start({ ...request, user: { ...request.user, grade: 'نهم' } }, res); assert.equal(res.code, 403);
  res = response(); submit({ ...request, user: { ...request.user, class_name: 'ب' } }, res); assert.equal(res.code, 403);
  testDb.prepare('UPDATE exams SET start_at=?').run(Date.now() + 60000);
  res = response(); start(request, res); assert.equal(res.code, 403);
  testDb.prepare('UPDATE exams SET start_at=NULL').run();
  res = response(); start(request, res); assert.equal(res.code, 200);
  const started = res.data.started_at;
  res = response(); start(request, res); assert.equal(res.data.started_at, started);
  testDb.prepare('UPDATE exam_attempts SET started_at=?').run(Date.now() - 120000);
  res = response(); submit(request, res); assert.equal(res.code, 400);
  testDb.prepare('UPDATE exam_attempts SET started_at=?').run(Date.now());
  res = response(); submit(request, res); assert.equal(res.code, 200); assert.equal(res.data.score, 20);
  res = response(); submit(request, res); assert.equal(res.code, 409);
  console.log('PASS: exam start, schedule, grade/class, expiry, resumed timer, valid scoring and duplicate submission');

  const upload = handler('/api/upload');
  for (const [category, mime, dir] of [['homework','image/jpeg','homeworks'], ['receipt','image/png','receipts'], ['avatar','image/jpeg','images']]) {
    const result = response();
    upload({ user: request.user, body: { category }, query: {}, file: {
      path: '/uploads/' + dir + '/example.jpg', filename: 'example.jpg', originalname: 'example.jpg', mimetype: mime, size: 100
    } }, result);
    assert.equal(result.code, 200);
    assert.equal(result.data.file_url, '/uploads/' + dir + '/example.jpg');
  }
  console.log('PASS: returned homework, receipt and avatar paths match actual storage');

  let storage;
  const storageA = source.indexOf('const storage = multer.diskStorage');
  const storageB = source.indexOf('\n});', storageA) + 4;
  vm.runInNewContext(source.slice(storageA, storageB), {
    multer: { diskStorage: options => storage = options }, path, uploadsDir: '/uploads'
  });
  storage.destination({ path: '/api/fees/receipts', body: {}, query: {} },
    { mimetype: 'image/jpeg' }, (error, dir) => {
      assert.equal(error, null); assert.equal(dir, '/uploads/receipts');
    });
  console.log('PASS: receipt form without a category uses protected receipt storage');

  const authModule = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'backend/auth.js'), 'utf8'), {
    require: name => name === 'bcryptjs' ? { compare: async (p, hash) => hash === '$2b$' + p } : name === 'jsonwebtoken' ? {} : require(name),
    fs, path, __dirname: path.join(root, 'backend'), module: authModule,
    process: { env: { JWT_SECRET: 'x'.repeat(48) } }
  });
  assert.equal(await authModule.exports.verifyPassword('123456', '$2b$Student@Pass2026'), false);
  assert.equal(await authModule.exports.verifyPassword('123456', '$2b$unrelated'), false);
  assert.equal(await authModule.exports.verifyPassword('Student@Pass2026', '$2b$Student@Pass2026'), true);
  console.log('PASS: exact password accepted and demo password aliases rejected');

  let lock;
  const a = source.indexOf('function checkTuitionLock');
  vm.runInNewContext(source.slice(a, source.indexOf('\n}\n', a) + 2) + '\nlock = checkTuitionLock;', { db: testDb, set lock(fn) { lock = fn; } });
  testDb.prepare("INSERT INTO fee_defs VALUES ('هفتم',100,'today','today',1)").run();
  let next = false; const denied = response();
  lock({ user: { ...request.user, fee_status: 'unpaid' } }, denied, () => next = true);
  assert.equal(denied.code, 403); assert.equal(next, false);
  lock({ user: { ...request.user, fee_status: 'paid' } }, response(), () => next = true);
  assert.equal(next, true);
  console.log('PASS: unpaid locked student denied, paid student allowed');
  testDb.close();
}
run().catch(error => { console.error(error); process.exitCode = 1; });
