#!/usr/bin/env bash
# ==============================================================================
# اسکریپت استقرار امن نسخه پایدار (Production) سامانه رشد
# دامنه: roshd.digiral.ir | پورت داخلی: 127.0.0.1:5000
# برای اجرای غیرتعاملی (GitHub Actions یا تایمر systemd) با کاربر اختصاصی deploy.
# sudo فقط چهار دستور ثابت Nginx را اجرا می‌کند؛ قانون آن در scripts/sudoers-roshd-deploy است.
# اگر /api/health بعد از ری‌لود PM2 موفق نباشد، اسکریپت با کد ۱ خارج می‌شود.
# ==============================================================================
set -euo pipefail

unset CDPATH

load_deploy_env() {
  local env_file="/etc/roshd/deploy.env"
  if [ ! -e "$env_file" ]; then
    return 0
  fi
  if [ ! -f "$env_file" ]; then
    echo "❌ ${env_file} is not a regular file." >&2
    exit 1
  fi
  local mode owner group_digit other_digit
  mode="$(stat -c '%a' "$env_file")"
  owner="$(stat -c '%u' "$env_file")"
  if [ "$owner" != "0" ]; then
    echo "❌ ${env_file} must be owned by root (it is sourced by the shell)." >&2
    exit 1
  fi
  group_digit=$(( (10#$mode / 10) % 10 ))
  other_digit=$(( 10#$mode % 10 ))
  if (( (group_digit & 2) != 0 || (other_digit & 2) != 0 )); then
    echo "❌ ${env_file} must not be writable by group or others." >&2
    exit 1
  fi
  if [ ! -r "$env_file" ]; then
    echo "❌ ${env_file} برای کاربر $(id -un) خواندنی نیست. مالکیت root:deploy و مجوز 640 بگذارید." >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
}

# Absolute paths so the sudoers rule can match the command line exactly.
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/roshd.digiral.ir.conf"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/roshd.digiral.ir.conf"
NGINX_SITE_SOURCE="/var/www/roshd/nginx.conf"

run_root() {
  local status=0
  sudo -n -- "$@" || status=$?
  if [ "$status" -eq 0 ]; then
    return 0
  fi
  echo "❌ Root command failed with status ${status}: $*" >&2
  echo "❌ دستور root ناموفق بود. اگر پیام «a password is required» بود، فایل scripts/sudoers-roshd-deploy را نصب کنید. به این کاربر NOPASSWD: ALL ندهید." >&2
  exit "$status"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ فرمان '$1' در PATH این شل غیرتعاملی پیدا نشد." >&2
    echo "Node و PM2 را سیستمی نصب کنید، یا nvm را طوری بگذارید که در شل غیرتعاملی هم بارگذاری شود." >&2
    exit 1
  fi
}

install_dir="${INSTALL_DIR:-/var/www/roshd}"
load_deploy_env
# The env file may set a proxy, but it must not move the install directory:
# the sudoers rule allows cp only from /var/www/roshd/nginx.conf.
INSTALL_DIR="$install_dir"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
export GIT_TERMINAL_PROMPT=0
export DEBIAN_FRONTEND=noninteractive

if [ -n "${HOME:-}" ] && [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${HOME}/.nvm/nvm.sh" || true
fi

echo "🚀 در حال اجرای فرآیند استقرار امن سامانه رشد..."

if ! command -v flock >/dev/null 2>&1; then
  echo "❌ flock پیدا نشد (بسته util-linux)." >&2
  exit 1
fi

lock_file="${ROSHD_LOCK_FILE:-${HOME:-/tmp}/.roshd-deploy.lock}"
exec 200>>"$lock_file"
if ! flock -n 200; then
  echo "⏳ استقرار دیگری در حال اجراست (قفل: ${lock_file}). منتظر تمام شدنش می‌مانیم..."
  flock 200
fi

for cmd in git node npm pm2 curl; do
  require_cmd "$cmd"
done

if [ ! -d "$INSTALL_DIR" ]; then
  parent="$(dirname "$INSTALL_DIR")"
  if [ ! -w "$parent" ]; then
    echo "❌ ${INSTALL_DIR} وجود ندارد و ${parent} برای کاربر $(id -un) قابل نوشتن نیست." >&2
    echo "یک‌بار این را اجرا کنید: sudo mkdir -p ${INSTALL_DIR} && sudo chown $(id -un):$(id -gn) ${INSTALL_DIR}" >&2
    exit 1
  fi
  echo "📁 کلون اولیه ریپازیتوری در ${INSTALL_DIR}..."
  git clone https://github.com/danyal1074/roshd.git "$INSTALL_DIR"
elif [ ! -d "${INSTALL_DIR}/.git" ]; then
  echo "❌ ${INSTALL_DIR} کلون گیت نیست. ریپازیتوری را همان‌جا با کاربر deploy کلون کنید." >&2
  exit 1
else
  cd "$INSTALL_DIR"

  if [ ! -w "$INSTALL_DIR" ]; then
    echo "❌ ${INSTALL_DIR} برای کاربر $(id -un) قابل نوشتن نیست. مالکیت را به همین کاربر بدهید." >&2
    exit 1
  fi

  echo "📌 نسخه فعلی: $(git rev-parse --short HEAD)"

  # ۱. پشتیبان‌گیری اتمیک خودکار قبل از هرگونه تغییر
  echo "💾 ایجاد نسخه پشتیبان اتمیک از پایگاه‌داده قبل از اعمال تغییرات..."
  if [ -f "${INSTALL_DIR}/backend/rosh.db" ]; then
    node backend/backup.js || true
  fi

  # ۲. دریافت آخرین کد از گیت‌هاب (بدون ویرایشگر ادغام و بدون پرسش رمز)
  echo "📥 دریافت آخرین تغییرات نسخه Production از Git..."
  if ! git --no-pager pull --ff-only origin main; then
    echo "❌ git pull --ff-only شکست خورد. اگر گیت‌هاب از این سرور بسته است، https_proxy را در /etc/roshd/deploy.env بگذارید. origin باید https باشد." >&2
    exit 1
  fi
  echo "📌 نسخه بعد از pull: $(git rev-parse --short HEAD)"
fi

cd "$INSTALL_DIR"

# ۳. آماده‌سازی مسیرهای دایرکتوری داده و آپلودها
mkdir -p backend/uploads/images backend/uploads/videos backend/uploads/homeworks backend/uploads/receipts backend/backups
chmod -R 775 backend/uploads backend/backups

# ۴. نصب وابستگی‌های بک‌اند
echo "⚙️ بررسی و نصب وابستگی‌های بک‌اند..."
cd "${INSTALL_DIR}/backend"
npm ci --omit=dev --prefer-offline --no-audit --no-fund

# ۵. بیلد بهینه فرانت‌اند برای Production
echo "🎨 ساخت پکیج نهایی فرانت‌اند (Production Build)..."
cd "${INSTALL_DIR}/frontend"
npm ci --prefer-offline --no-audit --no-fund
npm run build
mkdir -p "${INSTALL_DIR}/backend/public"
cp -r dist/* "${INSTALL_DIR}/backend/public/"

# ۶. راه‌اندازی مجدد پروسه در PM2 با نام roshd
echo "⚡ بارگذاری مجدد سرویس با PM2..."
cd "$INSTALL_DIR"
pm2 startOrReload ecosystem.config.js
pm2 save

# بررسی سلامت سرویس پس از استقرار. شکست این حلقه یعنی شکست کل استقرار.
echo "🩺 بررسی سلامت سرویس محلی..."
HEALTHY=0
health_body=""
for ((i = 1; i <= 10; i++)); do
  sleep 3
  health_body="$(curl -sS --max-time 5 -w '\nHTTP_CODE:%{http_code}\n' http://127.0.0.1:5000/api/health 2>&1)" || true
  if printf '%s\n' "$health_body" | grep -q 'HTTP_CODE:200'; then
    echo "✅ سرویس سلامت است: /api/health پاسخ 200 ارسال کرد."
    echo "Health check passed: /api/health returned HTTP 200."
    HEALTHY=1
    break
  fi
  echo "⏳ در حال انتظار برای فعال‌شدن سرویس (${i}/10)..."
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "❌ خطا در استقرار: سرویس پس از ری‌استارت پاسخگو نیست." >&2
  echo "❌ Deploy failed: /api/health did not return HTTP 200 after PM2 reload." >&2
  printf '%s\n' "$health_body" >&2
  pm2 logs roshd --lines 20 --nostream >&2 || true
  exit 1
fi

# ۷. همگام‌سازی تنظیمات Nginx. آرگومان‌ها باید دقیقاً با scripts/sudoers-roshd-deploy یکی باشند.
echo "🌐 بررسی پیکربندی Nginx..."
if [ ! -f "$NGINX_SITE_SOURCE" ]; then
  echo "❌ ${NGINX_SITE_SOURCE} پیدا نشد." >&2
  exit 1
fi
run_root /usr/bin/cp "$NGINX_SITE_SOURCE" "$NGINX_SITE_AVAILABLE"

if [ -L "$NGINX_SITE_ENABLED" ]; then
  current="$(readlink "$NGINX_SITE_ENABLED")"
  if [ "$current" != "$NGINX_SITE_AVAILABLE" ]; then
    echo "❌ پیوند ${NGINX_SITE_ENABLED} به ${current} اشاره می‌کند، نه به فایل سایت رشد." >&2
    exit 1
  fi
elif [ -e "$NGINX_SITE_ENABLED" ]; then
  echo "❌ ${NGINX_SITE_ENABLED} وجود دارد ولی symlink نیست. آن را دستی اصلاح کنید؛ اسکریپت ln -sf نمی‌زند." >&2
  exit 1
else
  run_root /usr/bin/ln -s "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
fi

echo "🔍 بررسی سلامت تنظیمات Nginx..."
run_root /usr/sbin/nginx -t
run_root /usr/bin/systemctl reload nginx

echo ""
echo "===================================================================="
echo "🎉 استقرار نسخه Production سامانه رشد با موفقیت به پایان رسید."
echo "Deploy succeeded. /api/health returned HTTP 200 and nginx was reloaded."
echo "🌐 دامنه: https://roshd.digiral.ir"
echo "🛡️ پروسه PM2: roshd (متصل به 127.0.0.1:5000)"
echo "===================================================================="
