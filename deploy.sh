#!/usr/bin/env bash
# ========================================================
# One-Click Deployment Script for Rosh Platform (Ubuntu/Debian)
# ========================================================
set -e

echo "🚀 شروع آماده‌سازی و استقرار پلتفرم رشد روی سرور..."

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
npm install --production
cd ..

# 5. Build frontend
echo "🎨 ساخت و بیلد نهایی فرانت‌اند..."
cd frontend
npm install
npm run build
cd ..

# 6. Setup upload folders with proper permissions
echo "📁 آماده‌سازی پوشه آپلودها (ویدیوها و تصاویر)..."
mkdir -p backend/uploads/images backend/uploads/videos backend/uploads/homeworks backend/uploads/receipts
chmod -R 775 backend/uploads

# 7. Start or reload PM2
echo "⚡ راه‌اندازی سرویس با PM2..."
pm2 startOrReload ecosystem.config.js
pm2 save
sudo pm2 startup | tail -n 1 | bash || true

# 8. Firewall setup
echo "🛡️ تنظیم فایروال سرور..."
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 'Nginx Full' || true

echo "✅ استقرار سامانه رشد با موفقیت به پایان رسید!"
echo "🌐 پلتفرم آماده اتصال دامنه و ارائه آنلاین به کاربران است."
