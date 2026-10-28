#!/usr/bin/env bash
# ==============================================================================
# Roshd Platform Automated Daily Backup & Retention Script
# Usage in crontab (e.g. daily at 03:00 AM):
# 0 3 * * * /var/www/roshd/scripts/backup-cron.sh >> /var/log/roshd-backup.log 2>&1
# ==============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/roshd}"
BACKUP_DIR="${BACKUP_DIR:-/var/www/roshd/backend/backups}"
OFFSITE_BACKUP_DIR="${OFFSITE_BACKUP_DIR:-/opt/backups/roshd}"
RETENTION_COUNT=14

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated Roshd database backup..."

cd "$APP_DIR"

# 1. Execute Node SQLite atomic backup
if [ -f "$APP_DIR/backend/backup.js" ]; then
    NODE_ENV=production node "$APP_DIR/backend/backup.js"
else
    echo "[ERROR] backup.js not found at $APP_DIR/backend/backup.js" >&2
    exit 1
fi

# 2. Sync to secondary offsite / independent storage path if directory exists
if [ -d "$OFFSITE_BACKUP_DIR" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Syncing backups to offsite location: $OFFSITE_BACKUP_DIR..."
    rsync -av --update "$BACKUP_DIR/" "$OFFSITE_BACKUP_DIR/"
fi

# 3. Retention policy: Keep the most recent 14 backups, remove older ones
if [ -d "$BACKUP_DIR" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pruning old backups (retaining newest $RETENTION_COUNT)..."
    cd "$BACKUP_DIR"
    # Find and delete backup .db files beyond retention count
    ls -t rosh-backup-*.db 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | while read -r old_db; do
        echo "Pruning: $old_db"
        rm -f "$old_db" "$old_db.meta.json"
    done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Automated backup completed successfully."
