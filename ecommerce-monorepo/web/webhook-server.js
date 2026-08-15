/**
 * GitHub Webhook Server for YIWU EXPRESS
 * 
 * Listens for GitHub push events and triggers automated deployments
 * 
 * Usage:
 *   node webhook-server.js
 *   pm2 start webhook-server.js --name webhook-dromkok
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.WEBHOOK_PORT || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/www/wwwroot/www.dromkok.com/web/deploy.sh';
const ALLOWED_BRANCH = process.env.ALLOWED_BRANCH || 'main';
const LOG_FILE = '/www/logs/dromkok/webhook.log';

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Log message to file and console
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    log('WARNING: No webhook secret configured - skipping signature verification');
    return true;
  }
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Execute deployment script
 */
function runDeployment(commitInfo) {
  log('========================================');
  log('Starting deployment...');
  log(`Commit: ${commitInfo.sha.substring(0, 7)}`);
  log(`Author: ${commitInfo.author}`);
  log(`Message: ${commitInfo.message}`);
  log('========================================');
  
  const deployProcess = exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
    if (error) {
      log(`ERROR: Deployment failed with code ${error.code}`);
      log(`Error: ${error.message}`);
      return;
    }
    
    if (stderr) {
      log(`STDERR: ${stderr}`);
    }
    
    log('========================================');
    log('✓ Deployment completed successfully');
    log('========================================');
  });
  
  // Stream deployment output to log
  deployProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
    fs.appendFileSync(LOG_FILE, data);
  });
  
  deployProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
    fs.appendFileSync(LOG_FILE, data);
  });
}

/**
 * Handle webhook request
 */
function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      // Verify signature
      const signature = req.headers['x-hub-signature-256'];
      
      if (!verifySignature(body, signature)) {
        log('ERROR: Invalid signature');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }
      
      // Parse payload
      const payload = JSON.parse(body);
      const event = req.headers['x-github-event'];
      
      log(`Received ${event} event from GitHub`);
      
      // Handle ping event
      if (event === 'ping') {
        log('Ping received - webhook configured successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Pong!' }));
        return;
      }
      
      // Handle push event
      if (event === 'push') {
        const branch = payload.ref.replace('refs/heads/', '');
        
        // Check if push is to allowed branch
        if (branch !== ALLOWED_BRANCH) {
          log(`Ignoring push to branch: ${branch} (allowed: ${ALLOWED_BRANCH})`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Branch ignored' }));
          return;
        }
        
        // Extract commit information
        const commits = payload.commits || [];
        const headCommit = payload.head_commit || commits[0];
        
        if (!headCommit) {
          log('ERROR: No commit information found');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No commit information' }));
          return;
        }
        
        const commitInfo = {
          sha: headCommit.id,
          author: headCommit.author.name,
          message: headCommit.message,
          timestamp: headCommit.timestamp,
        };
        
        // Trigger deployment
        runDeployment(commitInfo);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Deployment triggered',
          commit: commitInfo.sha.substring(0, 7),
        }));
        return;
      }
      
      // Unknown event
      log(`Unknown event type: ${event}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Event ignored' }));
      
    } catch (error) {
      log(`ERROR: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

/**
 * Health check endpoint
 */
function handleHealthCheck(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));
}

/**
 * Create HTTP server
 */
const server = http.createServer((req, res) => {
  const url = req.url;
  
  // Health check endpoint
  if (url === '/health' || url === '/ping') {
    handleHealthCheck(req, res);
    return;
  }
  
  // Webhook endpoint
  if (url === '/webhook' || url === '/') {
    handleWebhook(req, res);
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

/**
 * Start server
 */
server.listen(PORT, () => {
  log('========================================');
  log('GitHub Webhook Server Started');
  log('========================================');
  log(`Port: ${PORT}`);
  log(`Deploy script: ${DEPLOY_SCRIPT}`);
  log(`Allowed branch: ${ALLOWED_BRANCH}`);
  log(`Webhook secret: ${WEBHOOK_SECRET ? 'Configured' : 'NOT CONFIGURED'}`);
  log(`Log file: ${LOG_FILE}`);
  log('========================================');
  log('Endpoints:');
  log(`  - POST http://localhost:${PORT}/webhook (GitHub webhook)`);
  log(`  - GET  http://localhost:${PORT}/health  (Health check)`);
  log('========================================');
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

/**
 * Error handling
 */
process.on('uncaughtException', (error) => {
  log(`UNCAUGHT EXCEPTION: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});
