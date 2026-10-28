// PM2 Production Configuration for Roshd Educational Platform
module.exports = {
  apps: [
    {
      name: 'roshd',
      script: './backend/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '127.0.0.1', // Bound to localhost only - Nginx reverse-proxies all external requests
        DB_PATH: './backend/rosh.db',
        UPLOADS_PATH: './backend/uploads',
        BACKUPS_PATH: './backend/backups'
      }
    }
  ]
};
