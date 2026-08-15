// ecosystem.config.js - PM2 configuration for production

module.exports = {
  apps: [{
    name: 'dromkok-web',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0'
    },
    
    // Memory limits
    max_memory_restart: '1G',
    
    // Logging
    error_file: '/home/djdn/.pm2/logs/dromkok-web-error.log',
    out_file: '/home/djdn/.pm2/logs/dromkok-web-out.log',
    log_file: '/home/djdn/.pm2/logs/dromkok-web-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // Auto-restart settings
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Environment specific settings
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
