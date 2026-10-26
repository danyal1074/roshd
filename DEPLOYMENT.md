# راهنمای استقرار و آنلاین‌سازی «پلتفرم رشد» روی سرور واقعی (VPS)

این سند راهنمای گام‌به‌گام و رسمی جهت انتقال و راه‌اندازی ۲۴ ساعته سامانه کانون شهید آشتیانی روی سرورهای ابری (مثل دیتاسنترهای داخلی پارس‌پک، ابرآروان، یا سرورهای خارجی هتزنر و دیجیتال‌اوشن) است.

---

## 🏗️ روش اول: استقرار بسیار سریع با داکر (Docker & Docker Compose)

اگر روی سرور خود Docker و Docker Compose دارید، تنها با ۲ دستور زیر کل سامانه (شامل دیتابیس، استوریج ویدیوها و فرانت‌اند) آنلاین می‌شود:

```bash
# ۱. رفتن به پوشه پروژه
cd /var/www/rosh-platform

# ۲. ساخت ایمیج و اجرای کانتینر در پس‌زمینه
docker compose up -d --build
```

### مزایای استقرار با داکر:
- تمام ویدیوها و عکس‌های آپلود شده در ولوم داکر `rosh_uploads` ذخیره می‌شوند و با خاموش یا ریست سرور از بین نمی‌روند.
- دیتابیس SQLite در مسیر پایدار `rosh_db_data` ذخیره شده و از پایداری صددرصد برخوردار است.
- به صورت خودکار با روشن شدن سرور (`restart: always`) سامانه دوباره فعال می‌شود.

---

## 💻 روش دوم: استقرار مستقیم با PM2 و Nginx (روش استاندارد سرور لینوکس)

### ۱. انتقال فایل‌های پروژه به سرور:
فایل‌های پروژه را با استفاده از Git یا SFTP به سرور منتقل کنید:
```bash
git clone <آدرس_گیت_پروژه> /var/www/rosh-platform
cd /var/www/rosh-platform
```

### ۲. اجرای اسکریپت خودکار استقرار:
ما اسکریپت آماده `deploy.sh` را برای شما آماده کرده‌ایم. کافیست دستور زیر را بزنید:
```bash
chmod +x deploy.sh
./deploy.sh
```
این اسکریپت تمام مراحل شامل نصب Node.js، بیلد پروژه فرانت‌اند، تنظیم دسترسی پوشه‌های آپلود عکس و ویدیو، و اجرای پروسه روی PM2 را به طور خودکار انجام می‌دهد.

### ۳. اتصال وب‌سرور Nginx:
فایل پیکربندی آماده `nginx.conf` را در وب‌سرور Nginx سرور قرار دهید:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/rosh-platform.conf
sudo ln -s /etc/nginx/sites-available/rosh-platform.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ۴. فعال‌سازی رایگان SSL (پروتکل امن HTTPS):
برای فعال‌سازی قفل سبز HTTPS و گواهی رایگان Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.ir -d www.your-domain.ir
```

---

## 📁 مدیریت ویدیوها و تصاویر آپلودی (Storage Architecture)

- **ساختار پوشه‌ها:**
  - `backend/uploads/videos/`: ذخیره ویدیوهای باکیفیت دوره‌های آموزشی تا حجم ۱۵۰ مگابایت با قابلیت Range Streaming (پخش روان بدون گیر کردن در موبایل و دسکتاپ).
  - `backend/uploads/images/`: تصاویر آواتار دانش‌آموزان و سوالات امتحانی.
  - `backend/uploads/receipts/`: فیش‌های واریزی شهریه و خدمات سامانه.
  - `backend/uploads/homeworks/`: فایل‌های تکالیف و پاسخ‌های ارسالی.
- **پشتیبان‌گیری از اطلاعات (Backup):**
  برای بکاپ‌گیری روزانه از دیتابیس و فایل‌ها، دستور زیر کافی است:
  ```bash
  tar -czf backup-rosh-$(date +%F).tar.gz backend/rosh.db backend/uploads
  ```
