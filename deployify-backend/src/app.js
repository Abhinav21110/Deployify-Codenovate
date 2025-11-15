const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const inspectController = require('./controllers/inspectController');
const deployController = require('./controllers/deployController');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Simple in-memory log storage
const logs = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Override console methods to capture logs
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.join(' ');
  logs.push({ level: 'info', timestamp, message });
  // Keep only last 100 logs
  if (logs.length > 100) logs.shift();
  originalConsoleLog(...args);
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.join(' ');
  logs.push({ level: 'error', timestamp, message });
  // Keep only last 100 logs
  if (logs.length > 100) logs.shift();
  originalConsoleError(...args);
};

// Debug environment variables
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('NETLIFY_AUTH_TOKEN:', process.env.NETLIFY_AUTH_TOKEN ? 'Set' : 'Not set');
console.log('VERCEL_TOKEN:', process.env.VERCEL_TOKEN ? 'Set' : 'Not set');
console.log('TEMP_DIR:', process.env.TEMP_DIR);

const app = express();
const PORT = process.env.PORT || 4000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Routes
app.post('/api/repo/inspect', inspectController.inspect);
app.post('/api/deploy', deployController.deploy);
app.get('/api/deploy/status/:id', deployController.getStatus);
app.get('/api/deploy/logs/:id', deployController.getLogs);
app.post('/api/deploy/container/:id', deployController.manageContainer);

// Logs endpoint
app.get('/api/logs', (req, res) => {
  res.json({ logs: logs.slice(-50) }); // Return last 50 logs
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Deployify backend is running' });
});

app.listen(PORT, () => {
  console.log(`Deployify backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});