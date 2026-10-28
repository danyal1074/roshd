#!/usr/bin/env bash
# ==============================================================================
# اسکریپت استقرار امن نسخه پایدار (Production) سامانه رشد
# دامنه اختصاصی: roshd.digiral.ir | پورت داخلی امن: 127.0.0.1:5000
# کاملاً ایزوله شده و بدون تداخل با سایر سرویس‌های روی سرور (نظیر سامانه هنر روی پورت ۸۰۰۰)
# ==============================================================================
set -e

INSTALL_DIR="/var/www/roshd"

echo "🚀 در حال اجرای فرآیند استقرار امن سامانه رشد..."

if [ ! -d "$INSTALL_DIR" ]; then
    echo "📁 کلون اولیه ریپازیتوری در $INSTALL_DIR..."
    git clone https://github.com/danyal1074/roshd.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
else
    cd "$INSTALL_DIR"
    
    # ۱. پشتیبان‌گیری اتمیک خودکار قبل از هرگونه تغییر
    echo "💾 ایجاد نسخه پشتیبان اتمیک از پایگاه‌داده قبل از اعمال تغییرات..."
    if [ -f "$INSTALL_DIR/backend/rosh.db" ]; then
        node backend/backup.js || true
    fi

    # ۲. دریافت آخرین کد از گیت‌هاب
    echo "📥 دریافت آخرین تغییرات نسخه Production از Git..."
    git pull origin main
fi

# ۳. آماده‌سازی مسیرهای دایرکتوری داده و آپلودها
mkdir -p backend/uploads/images backend/uploads/videos backend/uploads/homeworks backend/uploads/receipts backend/backups
chmod -R 775 backend/uploads backend/backups

# ۴. نصب وابستگی‌های بک‌اند
echo "⚙️ بررسی و نصب وابستگی‌های بک‌اند..."
cd "$INSTALL_DIR/backend"
npm ci --omit=dev --prefer-offline --no-audit

# ۵. بیلد بهینه فرانت‌اند برای Production
echo "🎨 ساخت پکیج نهایی فرانت‌اند (Production Build)..."
cd "$INSTALL_DIR/frontend"
npm ci --prefer-offline --no-audit
npm run build
mkdir -p "$INSTALL_DIR/backend/public"
cp -r dist/* "$INSTALL_DIR/backend/public/"

# ۶. راه‌اندازی مجدد پروسه در PM2 با نام roshd
echo "⚡ بارگذاری مجدد سرویس با PM2..."
cd "$INSTALL_DIR"
pm2 startOrReload ecosystem.config.js
pm2 save

# بررسی سلامت سرویس پس از استقرار
echo "🩺 بررسی سلامت سرویس محلی..."
HEALTHY=0
for i in {1..6}; do
    sleep 2
    if curl -sf http://127.0.0.1:5000/api/health > /dev/null; then
        echo "✅ سرویس سلامت است: /api/health پاسخ 200 ارسال کرد."
        HEALTHY=1
        break
    else
        echo "⏳ در حال انتظار برای فعال‌شدن سرویس ($i/۶)..."
    fi
done

if [ "$HEALTHY" -ne 1 ]; then
    echo "❌ خطا در استقرار: سرویس پس از ری‌استارت پاسخگو نیست." >&2
    pm2 logs roshd --lines 20 --nostream >&2 || true
    exit 1
fi

# ۷. همگام‌سازی تنظیمات امنیتی Nginx برای roshd.digiral.ir
echo "🌐 بررسی پیکربندی Nginx..."
sudo cp "$INSTALL_DIR/nginx.conf" /etc/nginx/sites-available/roshd.digiral.ir.conf

if [ ! -f /etc/nginx/sites-enabled/roshd.digiral.ir.conf ]; then
    sudo ln -s /etc/nginx/sites-available/roshd.digiral.ir.conf /etc/nginx/sites-enabled/
fi

# بررسی صحت تنظیمات Nginx جهت جلوگیری از هرگونه تداخل با سایر دامنه‌ها
echo "🔍 بررسی سلامت تنظیمات Nginx..."
sudo nginx -t

# ریلود بدون قطعی (Zero-downtime) انجین‌ایکس
sudo systemctl reload nginx

echo ""
echo "===================================================================="
echo "🎉 استقرار نسخه Production سامانه رشد با موفقیت به پایان رسید."
echo "🌐 دامنه: https://roshd.digiral.ir"
echo "🛡️ پروسه PM2: roshd (متصل به 127.0.0.1:5000)"
echo "🔒 کلیه فایل‌های خصوصی (رسیدها و تکالیف) از طریق احراز هویت کنترل می‌شوند."
echo "===================================================================="
