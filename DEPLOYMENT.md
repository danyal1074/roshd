# راهنمای جامع استقرار عملیاتی پلتفرم رشد (DEPLOYMENT.md)
**کانون نخبه‌پروری شهید کاظم آشتیانی**  
**دامنه عملیاتی:** `https://roshd.digiral.ir`  
**آدرس آی‌پی سرور:** `<SERVER_IP>` (Ubuntu 24.04 LTS)  
**سیاست همجواری:** حفظ کامل، پایدار و بدون وقفه سامانه `honar.digiral.ir` (پورت ۸۰۰۰)

استقرار خودکار با هر push به `main` در بخش ۹ آمده است.

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

---

## ۹. استقرار خودکار با هر push به `main`

هر دو روش زیر در نهایت همین اسکریپت `deploy-on-existing-server.sh` را اجرا می‌کنند: پشتیبان دیتابیس، `git pull --ff-only`، نصب وابستگی، بیلد فرانت، `pm2 startOrReload`، بررسی `http://127.0.0.1:5000/api/health`، سپس فقط کپی فایل سایت Nginx و `reload`. اگر health check موفق نباشد اسکریپت با کد ۱ خارج می‌شود و استقرار ناموفق است.

- **روش الف (GitHub Actions):** با هر push به `main`، یا با اجرای دستی workflow، رانر گیت‌هاب با SSH به سرور وصل می‌شود. مناسب وقتی است که پورت SSH از اینترنت به سمت سرور باز باشد.
- **روش ب (اختیاری، pull از خود سرور):** اگر رانرهای گیت‌هاب به VPS نرسند (timeout یا connection refused، که برای بعضی سرورها در ایران پیش می‌آید)، تایمر systemd روی خود سرور هر پنج دقیقه `origin/main` را چک می‌کند و فقط وقتی کامیت جدید باشد اسکریپت را اجرا می‌کند.

قفل `~/.roshd-deploy.lock` نمی‌گذارد دو استقرار هم‌زمان جلو بروند. اگر روش الف همیشه روی SSH خطا می‌دهد، روش ب را روشن کنید. می‌توانید workflow را در تب Actions گیت‌هاب غیرفعال کنید تا هر push یک علامت قرمز نسازد.

### ۹.۱ یک‌بار روی سرور

کاربر اختصاصی `deploy` را بسازید و او را به گروه `sudo` اضافه **نکنید**. Node، npm، pm2، git، curl و nginx باید برای شل غیرتعاملی روی PATH پیش‌فرض باشند (نصب سیستمی). شل این کاربر باید bash باشد.

```bash
sudo adduser --disabled-password --gecos "Roshd deploy" deploy
sudo mkdir -p /var/www/roshd
sudo chown -R deploy:deploy /var/www/roshd
sudo -u deploy git clone https://github.com/danyal1074/roshd.git /var/www/roshd
```

اگر پوشه از قبل کلون شده، همان `chown` کافی است و دستور `git clone` را رد کنید. فایل `.env` عملیاتی سرور را دست نزنید؛ فقط مالکیتش با بقیهٔ پوشه به `deploy` می‌رسد و باید `chmod 600` بماند.

اگر پروسهٔ `roshd` امروز زیر PM2 خود root بالا است، یک‌بار آن را به کاربر `deploy` منتقل کنید (چند ثانیه وقفه دارد):

```bash
sudo pm2 delete roshd || true
sudo -u deploy -H bash -lc 'cd /var/www/roshd && pm2 startOrReload ecosystem.config.js && pm2 save'
sudo env PATH="$PATH:/usr/bin:/usr/local/bin" pm2 startup systemd -u deploy --hp /home/deploy
```

`pm2 startup` یک خط `sudo ...` چاپ می‌کند. همان خط را عیناً اجرا کنید تا بعد از reboot پروسه برگردد.

`origin` باید HTTPS بماند تا سرور به کلید SSH گیت‌هاب نیاز نداشته باشد:

```bash
sudo -u deploy git -C /var/www/roshd remote -v
# https://github.com/danyal1074/roshd.git
```

مخزن الان عمومی است و همین URL کافی است. اگر بعداً آن را Private کنید، یک PAT فقط با دسترسی خواندن Contents بسازید و یک‌بار روی سرور (نه داخل گیت) remote را عوض کنید. `TOKEN` را با توکن واقعی جایگزین کنید و هیچ‌جا commit نکنید:

```bash
sudo -u deploy git -C /var/www/roshd remote set-url origin 'https://x-access-token:TOKEN@github.com/danyal1074/roshd.git'
sudo -u deploy chmod 600 /var/www/roshd/.git/config
```

### ۹.۲ ساخت کلید SSH مخصوص استقرار

روی کامپیوتر خودتان (نه روی سرور) یک کلید جدا، بدون passphrase، بسازید:

```bash
ssh-keygen -t ed25519 -f "$HOME/roshd_github_deploy" -C "github-actions-roshd" -N ""
```

فقط کلید عمومی را روی سرور بگذارید:

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys < "$HOME/roshd_github_deploy.pub" >/dev/null
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

پیشنهاد: جلوی همان خط در `authorized_keys` گزینهٔ `restrict` را بگذارید تا این کلید port-forward و pty نداشته باشد، ولی خود فرمان استقرار همچنان اجرا شود:

```text
restrict ssh-ed25519 AAAA... github-actions-roshd
```

کلید خصوصی (`roshd_github_deploy` بدون `.pub`) فقط در Secrets گیت‌هاب قرار می‌گیرد. آن را روی سرور کپی نکنید و در گیت commit نکنید. بعد از ذخیره‌شدن در گیت‌هاب، فایل خصوصی را از کامپیوتر خود پاک کنید.

### ۹.۳ Secrets گیت‌هاب

در مخزن: **Settings → Secrets and variables → Actions → New repository secret**. نام‌ها باید دقیقاً همین‌ها باشند. هیچ‌کدام را داخل مخزن ننویسید.

| نام | الزامی؟ | مقدار |
| --- | --- | --- |
| `SSH_HOST` | بله | نام دامنه یا IP سرور. همان رشته‌ای که در known_hosts هست، بدون `http://` و بدون یوزر |
| `SSH_PORT` | خیر | پورت SSH. اگر نسازید، ۲۲ فرض می‌شود |
| `SSH_USER` | بله | `deploy` |
| `SSH_PRIVATE_KEY` | بله | متن کامل کلید خصوصی، شامل خط‌های `BEGIN` و `END` |
| `SSH_KNOWN_HOSTS` | خیلی توصیه‌شده | خروجی `ssh-keyscan` |

از ماشینی که به سرور SSH می‌زند:

```bash
ssh-keyscan -T 10 -p 22 roshd.digiral.ir
```

اگر پورت SSH چیز دیگری است، همان پورت را به `-p` بدهید. برای پورت غیر از ۲۲، خروجی به‌شکل `[host]:port` است و `SSH_HOST` باید همان host (بدون کروشه) باشد و `SSH_PORT` همان پورت. کل خروجی را در secret `SSH_KNOWN_HOSTS` بگذارید. بدون این secret، workflow وصل می‌شود ولی کلید سرور را pin نمی‌کند.

### ۹.۴ قانون sudoers (فقط چهار دستور)

فایل `scripts/sudoers-roshd-deploy` فقط این‌ها را بدون رمز عبور اجازه می‌دهد:

- `/usr/bin/cp` از `/var/www/roshd/nginx.conf` به `/etc/nginx/sites-available/roshd.digiral.ir.conf`
- `/usr/bin/ln -s` همان فایل به `/etc/nginx/sites-enabled/roshd.digiral.ir.conf`
- `/usr/sbin/nginx -t`
- `/usr/bin/systemctl reload nginx`

اگر نام کاربر `deploy` نیست، قبل از کپی، هر دو جای کلمهٔ `deploy` را در آن فایل عوض کنید. سپس:

```bash
sudo visudo -cf /var/www/roshd/scripts/sudoers-roshd-deploy
sudo cp /var/www/roshd/scripts/sudoers-roshd-deploy /etc/sudoers.d/roshd-deploy
sudo chown root:root /etc/sudoers.d/roshd-deploy
sudo chmod 440 /etc/sudoers.d/roshd-deploy
sudo visudo -c
sudo -u deploy -H sudo -n /usr/sbin/nginx -t
```

دستور آخر نباید رمز بپرسد. `NOPASSWD: ALL` نگذارید. اگر sudo گفت به ترمینال نیاز دارد، در همان فایل کنار `Defaults` این را هم بگذارید: `Defaults:deploy !use_pty`. این فقط پرسش ترمینال را برمی‌دارد و دستور تازه‌ای اضافه نمی‌کند. مسیرها برای اوبونتو ۲۴.۰۴ است (`/usr/bin/cp`، `/usr/bin/ln`، `/usr/sbin/nginx`، `/usr/bin/systemctl`). اگر `command -v nginx` مسیر دیگری نشان داد، همان مسیر واقعی را هم در این فایل و هم در `run_root` داخل `deploy-on-existing-server.sh` بگذارید تا عیناً یکی باشند.

### ۹.۵ اجرای دستی و هر push

بعد از merge این تنظیمات، هر push به `main` workflow به نام **Deploy production** را اجرا می‌کند. اول بیلد فرانت و نحو اسکریپت‌ها چک می‌شود؛ اگر آن مرحله بشکند، SSH انجام نمی‌شود. مهلت جاب استقرار ۳۰ دقیقه است و استقرارها پشت سر هم می‌مانند (روی هم نمی‌افتند).

اجرای دستی: تب **Actions** → **Deploy production** → **Run workflow** → شاخهٔ `main`.

اگر health check شکست بخورد، لاگ همان جاب قرمز می‌شود و جملهٔ `Deploy failed: /api/health did not return HTTP 200` را می‌بینید. در آن حالت Nginx reload نمی‌شود.

### ۹.۶ روش ب: تایمر روی سرور (وقتی SSH از بیرون نمی‌رسد)

```bash
sudo cp /var/www/roshd/scripts/systemd/roshd-pull-deploy.service /etc/systemd/system/
sudo cp /var/www/roshd/scripts/systemd/roshd-pull-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now roshd-pull-deploy.timer
systemctl list-timers roshd-pull-deploy.timer
sudo systemctl start roshd-pull-deploy.service
journalctl -u roshd-pull-deploy.service -n 80 --no-pager
```

اگر نام کاربر `deploy` نیست، قبل از کپی، `User=` و `Group=` را در فایل service اصلاح کنید. لاگ فایل هم در `/var/www/roshd/logs/pull-deploy.log` است. وقتی `origin/main` تغییری نداشته باشد، سرویس بلافاصله با موفقیت خارج می‌شود و استقرار را تکرار نمی‌کند.

خاموش کردن:

```bash
sudo systemctl disable --now roshd-pull-deploy.timer
```

اگر خود سرور هم مستقیم به GitHub نمی‌رسد، پروکسی محلی را فقط روی سرور بگذارید (این فایل را commit نکنید). هر دو اسکریپت آن را source می‌کنند، به شرطی که مالک root باشد و برای گروه/دیگران قابل نوشتن نباشد:

```bash
sudo mkdir -p /etc/roshd
sudo tee /etc/roshd/deploy.env >/dev/null <<'EOF'
HTTPS_PROXY=http://127.0.0.1:PORT
https_proxy=http://127.0.0.1:PORT
HTTP_PROXY=http://127.0.0.1:PORT
http_proxy=http://127.0.0.1:PORT
NO_PROXY=127.0.0.1,localhost
no_proxy=127.0.0.1,localhost
EOF
sudo chown root:deploy /etc/roshd/deploy.env
sudo chmod 640 /etc/roshd/deploy.env
```

به‌جای `PORT` پورت پروکسی واقعی همان سرور را بگذارید. فایل باید فقط خط‌های `KEY=value` باشد، چون shell آن را source می‌کند.
