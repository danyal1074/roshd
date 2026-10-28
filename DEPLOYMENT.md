# راهنمای جامع استقرار عملیاتی پلتفرم رشد (DEPLOYMENT.md)
**کانون نخبه‌پروری شهید کاظم آشتیانی**  
**دامنه عملیاتی:** `https://roshd.digiral.ir`  
**آدرس آی‌پی سرور:** `<SERVER_IP>` (Ubuntu 24.04 LTS)  
**سیاست همجواری:** حفظ کامل، پایدار و بدون وقفه سامانه `honar.digiral.ir` (پورت ۸۰۰۰)

---

## ۱. معماری استقرار و ایزوله‌سازی سرویس‌ها

```
                           [اینترنت / دانش‌آموزان]
                                     │ (پورت‌های 80 و 443)
                                     ▼
                    ┌─────────────────────────────────┐
                    │     وب‌سرور Nginx سرور          │
                    │          (<SERVER_IP>)          │
                    └────────────────┬────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │ Host: honar.digiral.ir                            │ Host: roshd.digiral.ir
           ▼                                                   ▼
┌──────────────────────┐                           ┌──────────────────────┐
│  سامانه هنر (HONAR)  │                           │  پلتفرم رشد (ROSHD)  │
│    پورت 8000 داخلی   │                           │    پورت 5000 داخلی   │
│     (دست‌نخورده)      │                           │   (PM2 یا کانتینر)   │
└──────────────────────┘                           └──────────┬───────────┘
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            │ فایل‌های استاتیک عمومی            │
                                            │ (/uploads/images, /uploads/videos)│
                                            │                                   │
                                            │ دیتابیس اتمیک SQLite + WAL         │
                                            │ فایل‌های خصوصی (رسیدها، تکالیف)  │
                                            └───────────────────────────────────┘
```

> [!IMPORTANT]
> **قانون طلایی:** پورت داخلی ۵۰۰۰ به هیچ عنوان نباید به اینترنت باز باشد. تمام ترافیک باید از Nginx با گواهی معتبر SSL عبور کند. به سامانه `honar` روی پورت ۸۰۰۰ نباید کوچک‌ترین دستکاری اعمال شود.

---

## ۲. پیش‌نیازهای دامنه و DNS

قبل از نهایی‌سازی گواهی SSL، رکوردهای DNS دامنه `digiral.ir` باید به درستی تنظیم شده باشند:

| نوع رکورد (Type) | نام (Host/Name) | مقدار هدف (Value/Target) | وضعیت TTL |
| :---: | :---: | :---: | :---: |
| **A Record** | `roshd` | `<SERVER_IP>` | خودکار / 300 ثانیه |

برای ارزیابی صحیح بودن تنظیم DNS قبل از اجرای سرور:
```bash
ping -c 2 roshd.digiral.ir
# باید آی‌پی سرور شما (<SERVER_IP>) را پاسخ دهد
```

---

## ۳. روش اول: استقرار با Docker و Docker Compose (توصیه‌شده برای کانتینرسازی)

اگر تمایل دارید سامانه رشد در قالب کانتینر ایزوله اجرا شود:

### ۱. ورود به پوشه پروژه:
```bash
cd /var/www/roshd
```

### ۲. بررسی فایل‌های محیطی (`.env`):
یک فایل `.env` در ریشه پروژه با مقادیر امن ایجاد یا بررسی کنید:
```ini
NODE_ENV=production
PORT=5000
JWT_SECRET=super_strong_production_jwt_secret_roshd_2026_xyz
RATE_LIMIT_MAX=10000
ALLOW_PROD_SEED=false
```

### ۳. ساخت و راه‌اندازی کانتینر در پس‌زمینه:
```bash
docker compose up -d --build
```

### ۴. ویژگی‌های این حالت:
- کانتینر با کاربر غیر ریشه `node` بالا می‌آید.
- پورت ۵۰۰۰ فقط به `127.0.0.1:5000` متصل است و مستقیماً از اینترنت دیده نمی‌شود.
- دیتابیس و فایل‌ها در ولوم پایدار `rosh_data` واقع در `/app/data` حفظ می‌شوند و ری‌استارت کانتینر داده‌ای را پاک نمی‌کند.
- بررسی سلامت کانتینر با `docker ps` ستون `STATUS` را به صورت `healthy` نشان می‌دهد.

---

## ۴. روش دوم: استقرار مستقیم با PM2 و Nginx (روش استاندارد سرور)

این روش هماهنگ‌ترین روش با ساختار فعلی سرور لینوکس ابری است:

### گام ۱: دریافت آخرین کدهای نسخه پایدار
```bash
cd /var/www/roshd
git pull origin main
```

### گام ۲: نصب وابستگی‌های بک‌اند و فرانت‌اند
```bash
# نصب پکیج‌های بک‌اند
cd /var/www/roshd/backend
npm install --production

# بیلد فرانت‌اند
cd /var/www/roshd/frontend
npm install
npm run build
cd /var/www/roshd
```

### گام ۳: ایجاد پوشه‌های ذخیره‌سازی پایدار و تنظیم دسترسی‌ها
```bash
mkdir -p backend/uploads/images backend/uploads/videos backend/uploads/homeworks backend/uploads/receipts backend/backups
chmod -R 775 backend/uploads backend/backups
```

### گام ۴: پیکربندی و راه‌اندازی با PM2
فایل `ecosystem.config.js` با نام اختصاصی `roshd` آماده است:
```bash
pm2 startOrReload ecosystem.config.js
pm2 save
```

بررسی وضعیت پروسه‌ها:
```bash
pm2 status
# بررسی کنید هر دو پروسه 'honar' و 'roshd' در وضعیت online باشند
```

### گام ۵: تنظیم وب‌سرور Nginx برای `roshd.digiral.ir`
فایل تنظیمات `nginx.conf` را در مسیر پیکربندی Nginx قرار دهید:
```bash
sudo cp /var/www/roshd/nginx.conf /etc/nginx/sites-available/roshd.conf
sudo ln -sf /etc/nginx/sites-available/roshd.conf /etc/nginx/sites-enabled/roshd.conf

# تست صحت ساختار تنظیمات Nginx
sudo nginx -t

# بازنشانی امن Nginx بدون قطعی
sudo systemctl reload nginx
```

### گام ۶: فعال‌سازی رایگان SSL و HTTPS با Certbot
```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d roshd.digiral.ir --non-interactive --agree-tos -m admin@digiral.ir --redirect

# بررسی تمدید خودکار گواهی
sudo certbot renew --dry-run
```

### گام ۷: اعمال امنیت در فایروال (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5000/tcp
sudo ufw status
```

---

## ۵. فرآیند به‌روزرسانی بدون وقفه (Zero-Downtime Rollout)

هنگامی که تغییراتی در گیت‌هاب اعمال شد و قصد به‌روزرسانی نسخه عملیاتی را دارید:

```bash
cd /var/www/roshd

# ۱. تهیه نسخه پشتیبان اتمیک قبل از آپدیت
node backend/backup.js

# ۲. دریافت تغییرات
git pull origin main

# ۳. کامپایل فرانت‌اند (در صورت تغییر فایل‌های کلاینت)
cd frontend && npm run build && cd ..

# ۴. بازلود آنی بدون توقف سرور Node.js
pm2 reload roshd

# ۵. بررسی وضعیت سلامت
curl -s http://127.0.0.1:5000/api/health | jq .
```

---

## ۶. فرآیند پشتیبان‌گیری، خروج از سرور و بازیابی اضطراری (Backup & Disaster Recovery)

### ۱. پشتیبان‌گیری اتمیک دیتابیس در حین کار:
دستور زیر بدون بستن دیتابیس یا قفل کردن دانش‌آموزان یک اسنپ‌شات اتمیک تولید می‌کند:
```bash
node backend/backup.js
```
فایل خروجی همراه با هش SHA-256 در `backend/backups/` قرار می‌گیرد.

### ۲. انتقال نسخه‌های پشتیبان به سرور امن خارجی (Offsite Sync):
جهت جلوگیری از ریسک سوختن هارد سرور یا حوادث دیتاسنتر، با یک دستور کران‌جاب لینوکس (crontab)، فایل‌های بکاپ به سرور دیگر سینک می‌شوند:
```bash
# نمونه دستور rsync روزانه به سرور پشتیبان
rsync -avz --delete /var/www/roshd/backend/backups/ backup-user@remote-storage.ir:/backups/roshd/
```

### ۳. بازیابی اضطراری دیتابیس (Disaster Recovery Restore):
در صورت بروز حادثه یا نیاز به بازیابی به یک زمان خاص:
```bash
# بازگردانی دیتابیس با اعتبارسنجی خودکار چکسام و سلامت
node backend/backup.js restore backend/backups/rosh-backup-YYYY-MM-DDTHH-mm-ss.db

# ری‌استارت سرویس جهت اتصال به نسخه بازیابی‌شده
pm2 restart roshd
```

---

## ۷. استراتژی بازگشت به نسخه قبلی (Rollback Plan)

در صورتی که نسخه جدید پس از استقرار به هر دلیلی دچار باگ ناخواسته شد:

```bash
# ۱. بازگشت کد به کامیت پایدار قبلی
cd /var/www/roshd
git log --oneline -n 5
git checkout <COMMIT_HASH_پایدار>

# ۲. بیلد مجدد فرانت‌اند
cd frontend && npm run build && cd ..

# ۳. در صورت نیاز به بازگردانی دیتابیس به پیش از استقرار
node backend/backup.js restore backend/backups/<آخرین_بکاپ_قبل_از_آپدیت>.db

# ۴. ری‌استارت پروسه
pm2 reload roshd
```

---

## ۸. نکات اختصاصی امنیت و مانیتورینگ

1. **لاگ‌های زنده:** جهت بررسی رویدادها و خطاهای احتمالی:
   ```bash
   pm2 logs roshd --lines 100
   ```
2. **پایش مصرف منابع سیستم:**
   ```bash
   pm2 monit
   ```
3. **بررسی پورت‌های فعال سرور:**
   ```bash
   sudo ss -tulpn | grep LISTEN
   # اطمینان حاصل کنید پورت 5000 فقط روی 127.0.0.1 باز باشد نه 0.0.0.0
   ```
