# اقدامات دستی و الزامی مدیر سیستم (MANUAL_STEPS.md)
**کانون نخبه‌پروری شهید کاظم آشتیانی — پلتفرم رشد**  
**اولویت اقدام:** **فوری و اضطراری (CRITICAL / URGENT)**

این فایل شامل اقداماتی است که **تنها توسط انسان (مدیر سرور)** باید روی سرور عملیاتی و مخزن گیت‌هاب اجرا شوند و نباید توسط اسکریپت یا هوش مصنوعی به‌صورت خودکار اجرا گردند.

---

## ۱. تغییر فوری کلمه عبور Root سرور (فوری‌ترین اقدام)
> [!CAUTION]
> کلمه عبور قدیمی سرور (`c6khenbR98FpxqnM`) به دلیل وجود در تاریخچه عمومی گیت کاملاً سوخته و ناامن تلقی می‌شود. باید فوراً تغییر کند.

دستور اجرا روی سرور:
```bash
ssh root@<SERVER_IP>
passwd root
# رمز عبور جدید و پیچیده (حداقل ۲۰ نویسه تصادفی) وارد کنید
```

---

## ۲. غیرفعال‌سازی ورود SSH با کلمه عبور (PasswordAuthentication no)
جهت جلوگیری از حملات Brute-Force به سرور:
1. ابتدا کلید عمومی SSH خود را به سرور منتقل کنید:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<SERVER_IP>
   ```
2. تنظیمات SSH را در `/etc/ssh/sshd_config` یا `/etc/ssh/sshd_config.d/` ویرایش کنید:
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
   مقادیر زیر را تنظیم کنید:
   ```text
   PasswordAuthentication no
   PubkeyAuthentication yes
   PermitRootLogin prohibit-password
   ```
3. سرویس SSH را ریلود کنید:
   ```bash
   sudo systemctl reload ssh
   ```
4. **هشدار مهم:** قبل از بستن ترمینال فعلی، یک ترمینال جدید باز کرده و اتصال با کلید SSH را تست کنید تا مطمئن شوید دسترسی شما قطع نمی‌شود.

---

## ۳. پاک‌سازی تاریخچه گیت یا خصوصی‌سازی مخزن GitHub
چون در کامیت‌های اولیه مخزن، اسرار به صورت عمومی قرار گرفته بودند:
### راهکار الف (توصیه‌شده و سریع):
مخزن `https://github.com/danyal1074/roshd` را در تنظیمات گیت‌هاب از حالت **Public** به **Private** تغییر دهید.

### راهکار ب (پاک‌سازی دائمی با git-filter-repo):
```bash
pip install git-filter-repo

# ساخت فایل تعویض اسرار
cat << 'EOF' > /tmp/replace_secrets.txt
c6khenbR98FpxqnM==>***REMOVED_SECRET***
89.46.217.44==>***REMOVED_IP***
roshd_secure_educational_platform_jwt_secret_key_2026==>***REMOVED_JWT***
EOF

git filter-repo --replace-text /tmp/replace_secrets.txt
git push origin --force --all
```

---

## ۴. تولید کلید اختصاصی و امن JWT
روی سرور دستور زیر را اجرا کنید تا کلید ۶۴ بایتی تصادفی تولید شود:
```bash
openssl rand -hex 48
```
خروجی این دستور را در فایل `/var/www/roshd/.env` قرار دهید:
```ini
JWT_SECRET=مقدار_تولید_شده_توسط_دستور_بالا
```

---

## ۵. تنظیم فایل متغیرهای محیطی (`.env`) روی سرور
یک فایل `.env` در مسیر ریشه پروژه روی سرور بسازید:
```bash
nano /var/www/roshd/.env
```
محتوای پیشنهادی:
```ini
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
JWT_SECRET=مقدار_تولید_شده_حداقل_۳۲_کاراکتر
DB_PATH=/var/www/roshd/backend/rosh.db
UPLOADS_PATH=/var/www/roshd/backend/uploads
BACKUPS_PATH=/var/www/roshd/backend/backups
CORS_ORIGIN=https://roshd.digiral.ir
RATE_LIMIT_MAX=10000

# اطلاعات مدیر اولیه (تنها در صورتی که دیتابیس خالی باشد استفاده می‌شود)
ADMIN_NATIONAL_ID=0011223344
ADMIN_INITIAL_PASSWORD=رمز_دلخواه_مدیر_یا_خالی_برای_تولید_تصادفی
```
مجوز دسترسی را محدود کنید:
```bash
chmod 600 /var/www/roshd/.env
```

---

## ۶. صدور گواهی SSL و اتصال به دامنه roshd.digiral.ir
پس از اتصال رکورد A در DNS دامنه به آی‌پی سرور:
```bash
sudo certbot --nginx -d roshd.digiral.ir --non-interactive --agree-tos -m admin@digiral.ir --redirect
sudo certbot renew --dry-run
```
