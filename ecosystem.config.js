// PM2 Configuration for Rosh Platform
module.exports = {
  apps: [
    {
      name: 'rosh-backend',
      script: './backend/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0'
      }
    }
  ]
};
