// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cutq-backend-prod',
    script: 'scripts/environment/start-with-env.js',
    args: 'node dist/index.js',

    // Environment configuration
    env: {
      CUTQ_ENV: 'prod',
      NODE_ENV: 'production',
      PORT: 5000,
      TZ: 'asia/kolkata'
    },

    instances: 1,
    exec_mode: 'fork',
    watch: false, // Disable watch in production
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,

    // PM2 specific settings
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',

    // Kill timeout
    kill_timeout: 5000,
  }]
};