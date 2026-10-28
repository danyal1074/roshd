#!/usr/bin/env bash
# ========================================================
# One-Click Deployment Script for Roshd Platform (Ubuntu/Debian)
# Domain: roshd.digiral.ir
# ========================================================
set -euo pipefail

echo "🚀 شروع آماده‌سازی و استقرار امن پلتفرم رشد روی سرور..."

# 0. Safety Pre-deployment Backup (if existing db found)
if [ -f "backend/rosh.db" ] || [ -f "/app/data/rosh.db" ]; then
    echo "💾 در حال تهیه نسخه پشتیبان اتمیک قبل از استقرار..."
    node backend/backup.js || echo "⚠️ اخطار: پشتیبان‌گیری خودکار رد شد، ادامه فرآیند..."
fi

# 1. Update packages
echo "📦 به‌روزرسانی پکیج‌های سیستم..."
sudo apt-get update -y
sudo apt-get install -y curl git nginx ufw

# 2. Install Node.js 22 LTS if not present
if ! command -v node &> /dev/null; then
    echo "⚙️ نصب Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ نصب PM2 Process Manager..."
    sudo npm install -g pm2
fi

# 4. Install backend dependencies
echo "📥 نصب پیش‌نیازهای بک‌اند..."
cd backend
npm ci --omit=dev --prefer-offline --no-audit
cd ..

# 5. Build frontend
echo "🎨 ساخت و بیلد نهایی فرانت‌اند..."
cd frontend
npm ci --prefer-offline --no-audit
npm run build
mkdir -p ../backend/public
cp -r dist/* ../backend/public/
cd ..

# 6. Setup upload and backup folders with proper permissions
echo "📁 آماده‌سازی پوشه آپلودها و دایرکتوری بکاپ..."
mkdir -p backend/uploads/images backend/uploads/videos backend/uploads/homeworks backend/uploads/receipts backend/backups
chmod -R 775 backend/uploads backend/backups

# 7. Start or reload PM2 safely without seed/reset
echo "⚡ راه‌اندازی یا به‌روزرسانی پروسه roshd با PM2..."
pm2 startOrReload ecosystem.config.js
pm2 save
sudo pm2 startup | tail -n 1 | bash || true

# 8. Firewall setup (Protect internal Node.js port 5000, only expose 80 and 443)
echo "🛡️ تنظیم فایروال سرور (بستن پورت‌های داخلی)..."
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw deny 5000/tcp || true
sudo ufw allow 'Nginx Full' || true

# 9. Verify local health with retry loop and rollback guard
echo "🩺 بررسی وضعیت سلامت سرویس..."
HEALTHY=0
for i in {1..6}; do
    sleep 2
    if curl -sf http://127.0.0.1:5000/api/health > /dev/null; then
        echo "✅ سرویس سلامت است: /api/health پاسخ 200 ارسال کرد."
        HEALTHY=1
        break
    else
        echo "⏳ در حال انتظار برای آماده‌سازی سرویس (تلاش $i از ۶)..."
    fi
done

if [ "$HEALTHY" -ne 1 ]; then
    echo "❌ خطا: سرویس در زمان مقرر به حالت سالم نرسید. لاگ‌های خطا:" >&2
    pm2 logs roshd --lines 20 --nostream >&2 || true
    echo "⚠️ پیشنهاد: بررسی فایل .env و پورت‌های سرور یا بازگردانی به بکاپ قبلی." >&2
    exit 1
fi

echo "✅ استقرار سامانه رشد با موفقیت به پایان رسید!"
echo "🌐 پلتفرم آماده اتصال به دامنه roshd.digiral.ir است."
