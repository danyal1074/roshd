const { spawn } = require('child_process');
const path = require('path');

console.log('=====================================================');
console.log('     پلتفرم رشد - کانون نخبه‌پروری شهید کاظم آشتیانی     ');
console.log('         سامانه جامع مدیریت و آموزش ۴۵۰ دانش‌آموز         ');
console.log('=====================================================\n');

// 1. Start Backend Server
console.log('🚀 در حال راه‌اندازی سرور Backend (Port 5000)...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Frontend Vite Server
console.log('🌐 در حال راه‌اندازی سرور Frontend با Vue 3 (Port 5173)...');
const frontend = spawn('npx', ['vite', '--port', '5173', '--host', '127.0.0.1'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
