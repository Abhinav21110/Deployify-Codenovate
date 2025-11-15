#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Deployify...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed');

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  execSync('npm run backend:install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Create backend .env.local if it doesn't exist
const backendEnvPath = path.join(__dirname, 'backend', '.env.local');
if (!fs.existsSync(backendEnvPath)) {
  console.log('\n📝 Creating backend environment file...');
  const envContent = `PORT=3001
NETLIFY_ACCESS_TOKEN=your_netlify_access_token_here
TEMP_DIR=./temp`;
  
  fs.writeFileSync(backendEnvPath, envContent);
  console.log('✅ Backend .env.local created');
  console.log('⚠️  Please update your Netlify access token in backend/.env.local');
} else {
  console.log('✅ Backend environment file already exists');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Get your Netlify access token from: https://app.netlify.com/user/applications#personal-access-tokens');
console.log('2. Update backend/.env.local with your token');
console.log('3. Run "npm run dev:full" to start both frontend and backend');
console.log('4. Open http://localhost:5173 in your browser');
console.log('\n🚀 Happy deploying!');