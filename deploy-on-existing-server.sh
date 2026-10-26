#!/usr/bin/env bash
# ==============================================================================
# اسکریپت استقرار امن سامانه رشد در کنار سامانه نقش‌یار (روی همان سرور ابری)
# بدون تداخل با سامانه نقش‌یار | دامنه اختصاصی: roshd.digiral.ir | پورت اختصاصی: 5000
# ==============================================================================
set -e

echo "🚀 در حال راه‌اندازی امن سامانه رشد در کنار سامانه نقش‌یار..."

INSTALL_DIR="/var/www/roshd"

# ۱. کلون یا دریافت آخرین تغییرات از گیت‌هاب در پوشه مجزا
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "📥 دریافت آخرین تغییرات از گیت‌هاب..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "📁 کلون ریپازیتوری در $INSTALL_DIR..."
    git clone https://github.com/danyal1074/roshd.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# ۲. ایجاد پوشه‌های آپلود عکس و ویدیو
mkdir -p backend/uploads/images backend/uploads/videos backend/uploads/homeworks backend/uploads/receipts
chmod -R 775 backend/uploads

# ۳. نصب پکیج‌های بک‌اند
echo "⚙️ نصب وابستگی‌های بک‌اند..."
cd "$INSTALL_DIR/backend"
npm install --production

# ۴. بیلد فرانت‌اند
echo "🎨 بیلد بهینه فرانت‌اند..."
cd "$INSTALL_DIR/frontend"
npm install
npm run build

# ۵. راه‌اندازی بک‌اند روی PM2 با نام مستقل rosh-backend
echo "⚡ راه‌اندازی پروسه روی PM2 بدون تداخل با نقش‌یار..."
cd "$INSTALL_DIR"
pm2 startOrReload ecosystem.config.js
pm2 save

# ۶. تنظیم Nginx برای زیردامنه roshd.digiral.ir
echo "🌐 پیکربندی Nginx برای roshd.digiral.ir..."
sudo sed -i 's|/var/www/rosh-platform|/var/www/roshd|g' "$INSTALL_DIR/nginx.conf"
sudo cp "$INSTALL_DIR/nginx.conf" /etc/nginx/sites-available/roshd.digiral.ir.conf

if [ ! -f /etc/nginx/sites-enabled/roshd.digiral.ir.conf ]; then
    sudo ln -s /etc/nginx/sites-available/roshd.digiral.ir.conf /etc/nginx/sites-enabled/
fi

# بررسی صحت تنظیمات انجین‌ایکس تا به نقش‌یار آسیبی نرسد
echo "🔍 بررسی سلامت تنظیمات Nginx..."
sudo nginx -t

# ریلود نرم Nginx
sudo systemctl reload nginx

echo ""
echo "===================================================================="
echo "🎉 تبریک! سامانه رشد در کنار سامانه نقش‌یار با موفقیت فعال شد."
echo "🔗 آدرس سامانه: http://roshd.digiral.ir"
echo ""
echo "🔒 برای فعال‌سازی رایگان SSL (قفل سبز HTTPS)، این دستور را بزنید:"
echo "   sudo certbot --nginx -d roshd.digiral.ir"
echo "===================================================================="
