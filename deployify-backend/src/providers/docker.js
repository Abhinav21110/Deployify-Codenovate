const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function createDockerDeployment(repoPath, deploymentId) {
  console.log('Creating Docker deployment...');
  
  // Generate optimized Dockerfile for faster builds
  const dockerfile = `
# Lightweight single-stage Docker build
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy project files
COPY . .

# Create directories
RUN mkdir -p ./frontend ./backend

# Setup frontend - Copy your actual repository files
RUN echo "🎨 Setting up frontend from your repository..." && \\
    echo "Repository contents:" && \\
    ls -la && \\
    if [ -f "package.json" ]; then \\
      echo "📦 Found package.json - this is a Node.js project" && \\
      cat package.json | head -20 && \\
      echo "Installing dependencies..." && \\
      npm install && \\
      echo "Attempting to build project..." && \\
      if npm run build; then \\
        echo "✅ Build successful! Looking for build output..." && \\
        if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then \\
          echo "📁 Using dist/ directory" && \\
          cp -r dist/* ./frontend/ && \\
          cp -r dist/.[^.]* ./frontend/ 2>/dev/null || true; \\
        elif [ -d "build" ] && [ "$(ls -A build 2>/dev/null)" ]; then \\
          echo "📁 Using build/ directory" && \\
          cp -r build/* ./frontend/ && \\
          cp -r build/.[^.]* ./frontend/ 2>/dev/null || true; \\
        elif [ -d "out" ] && [ "$(ls -A out 2>/dev/null)" ]; then \\
          echo "📁 Using out/ directory" && \\
          cp -r out/* ./frontend/ && \\
          cp -r out/.[^.]* ./frontend/ 2>/dev/null || true; \\
        elif [ -d ".next" ] && [ "$(ls -A .next 2>/dev/null)" ]; then \\
          echo "📁 Next.js project - copying .next and public" && \\
          cp -r .next ./frontend/ && \\
          cp -r public/* ./frontend/ 2>/dev/null || true; \\
        else \\
          echo "⚠️  Build completed but no standard output directory found" && \\
          echo "Copying all web files from root..." && \\
          cp *.html ./frontend/ 2>/dev/null || true && \\
          cp *.css ./frontend/ 2>/dev/null || true && \\
          cp *.js ./frontend/ 2>/dev/null || true && \\
          cp -r assets ./frontend/ 2>/dev/null || true && \\
          cp -r css ./frontend/ 2>/dev/null || true && \\
          cp -r js ./frontend/ 2>/dev/null || true && \\
          cp -r images ./frontend/ 2>/dev/null || true && \\
          cp -r img ./frontend/ 2>/dev/null || true; \\
        fi; \\
      else \\
        echo "❌ Build failed or no build script. Copying source files..." && \\
        cp *.html ./frontend/ 2>/dev/null || true && \\
        cp *.css ./frontend/ 2>/dev/null || true && \\
        cp *.js ./frontend/ 2>/dev/null || true && \\
        cp -r assets ./frontend/ 2>/dev/null || true && \\
        cp -r css ./frontend/ 2>/dev/null || true && \\
        cp -r js ./frontend/ 2>/dev/null || true && \\
        cp -r images ./frontend/ 2>/dev/null || true && \\
        cp -r img ./frontend/ 2>/dev/null || true && \\
        cp -r public ./frontend/ 2>/dev/null || true && \\
        cp -r src ./frontend/ 2>/dev/null || true; \\
      fi; \\
    else \\
      echo "📄 No package.json - treating as static website" && \\
      echo "Copying all web files..." && \\
      cp *.html ./frontend/ 2>/dev/null || true && \\
      cp *.css ./frontend/ 2>/dev/null || true && \\
      cp *.js ./frontend/ 2>/dev/null || true && \\
      cp -r assets ./frontend/ 2>/dev/null || true && \\
      cp -r css ./frontend/ 2>/dev/null || true && \\
      cp -r js ./frontend/ 2>/dev/null || true && \\
      cp -r images ./frontend/ 2>/dev/null || true && \\
      cp -r img ./frontend/ 2>/dev/null || true && \\
      cp -r public ./frontend/ 2>/dev/null || true && \\
      find . -maxdepth 2 -name "*.html" -exec cp {} ./frontend/ \\; 2>/dev/null || true; \\
    fi && \\
    echo "✅ Frontend setup complete. Files in frontend directory:" && \\
    ls -la ./frontend/ && \\
    echo "Checking for index.html:" && \\
    if [ -f "./frontend/index.html" ]; then \\
      echo "✅ Found index.html - your portfolio should load!" && \\
      head -10 ./frontend/index.html; \\
    else \\
      echo "❌ No index.html found in frontend directory"; \\
    fi

# Setup backend - check for existing backend or create simple server
RUN echo "⚙️  Setting up backend..." && \\
    if [ -d "deployify-backend" ]; then \\
      echo "Found deployify-backend directory" && \\
      cp -r deployify-backend/* ./backend/ 2>/dev/null || true; \\
    elif [ -d "backend" ]; then \\
      echo "Found backend directory" && \\
      cp -r backend/* ./backend/ 2>/dev/null || true; \\
    elif [ -d "server" ]; then \\
      echo "Found server directory" && \\
      cp -r server/* ./backend/ 2>/dev/null || true; \\
    elif [ -d "api" ]; then \\
      echo "Found api directory" && \\
      cp -r api/* ./backend/ 2>/dev/null || true; \\
    else \\
      echo "No backend found, creating simple Express server..."; \\
    fi

# Create Express server if no backend exists
RUN if [ ! -f "./backend/package.json" ]; then \\
      cd ./backend && \\
      echo '{"name":"deployify-server","version":"1.0.0","main":"server.js","scripts":{"start":"node server.js"},"dependencies":{"express":"^4.18.2","cors":"^2.8.5"}}' > package.json && \\
      npm install --production && \\
      echo 'const express = require("express");' > server.js && \\
      echo 'const cors = require("cors");' >> server.js && \\
      echo 'const path = require("path");' >> server.js && \\
      echo 'const app = express();' >> server.js && \\
      echo '' >> server.js && \\
      echo 'app.use(cors());' >> server.js && \\
      echo 'app.use(express.static(path.join(__dirname, "../frontend"), { index: ["index.html", "index.htm", "main.html", "home.html"], dotfiles: "allow" }));' >> server.js && \\
      echo '' >> server.js && \\
      echo 'app.get("/api/health", (req, res) => {' >> server.js && \\
      echo '  res.json({ status: "ok", timestamp: new Date().toISOString() });' >> server.js && \\
      echo '});' >> server.js && \\
      echo '' >> server.js && \\
      echo 'app.get("*", (req, res) => {' >> server.js && \\
      echo '  if (req.path.startsWith("/api/")) {' >> server.js && \\
      echo '    res.status(404).json({ error: "API endpoint not found" });' >> server.js && \\
      echo '  } else {' >> server.js && \\
      echo '    const indexPath = path.join(__dirname, "../frontend/index.html");' >> server.js && \\
      echo '    console.log("Serving index.html from:", indexPath);' >> server.js && \\
      echo '    res.sendFile(indexPath, (err) => {' >> server.js && \\
      echo '      if (err) {' >> server.js && \\
      echo '        console.error("Error serving index.html:", err);' >> server.js && \\
      echo '        res.status(500).send("Error loading page");' >> server.js && \\
      echo '      }' >> server.js && \\
      echo '    });' >> server.js && \\
      echo '  }' >> server.js && \\
      echo '});' >> server.js && \\
      echo '' >> server.js && \\
      echo 'const PORT = process.env.PORT || 3000;' >> server.js && \\
      echo 'app.listen(PORT, () => {' >> server.js && \\
      echo '  console.log(\`🚀 Deployify app running on port \${PORT}\`);' >> server.js && \\
      echo '  console.log(\`📱 Frontend: http://localhost:\${PORT}\`);' >> server.js && \\
      echo '  console.log(\`🔧 Health: http://localhost:\${PORT}/api/health\`);' >> server.js && \\
      echo '  console.log("🔍 Analyzing your portfolio files:");' >> server.js && \\
      echo '  const fs = require("fs");' >> server.js && \\
      echo '  try {' >> server.js && \\
      echo '    const frontendPath = path.join(__dirname, "../frontend");' >> server.js && \\
      echo '    const files = fs.readdirSync(frontendPath);' >> server.js && \\
      echo '    console.log("📁 Frontend files:", files);' >> server.js && \\
      echo '    const htmlFiles = files.filter(f => f.endsWith(".html"));' >> server.js && \\
      echo '    console.log("🌐 HTML files found:", htmlFiles);' >> server.js && \\
      echo '    if (htmlFiles.length > 0) {' >> server.js && \\
      echo '      console.log("✅ Your portfolio should be accessible!");' >> server.js && \\
      echo '    } else {' >> server.js && \\
      echo '      console.log("❌ No HTML files found - showing fallback page");' >> server.js && \\
      echo '    }' >> server.js && \\
      echo '  } catch (err) {' >> server.js && \\
      echo '    console.error("❌ Error reading frontend directory:", err);' >> server.js && \\
      echo '  }' >> server.js && \\
      echo '});' >> server.js; \\
    else \\
      echo "Installing backend dependencies..." && \\
      cd ./backend && npm install --production; \\
    fi

# Only create fallback index.html if no portfolio files were found
RUN if [ ! -f "./frontend/index.html" ]; then \\
      echo "⚠️  No index.html found from your repository - creating fallback page" && \\
      echo '<!DOCTYPE html>' > ./frontend/index.html && \\
      echo '<html lang="en">' >> ./frontend/index.html && \\
      echo '<head>' >> ./frontend/index.html && \\
      echo '    <meta charset="UTF-8">' >> ./frontend/index.html && \\
      echo '    <meta name="viewport" content="width=device-width, initial-scale=1.0">' >> ./frontend/index.html && \\
      echo '    <title>Deployify App</title>' >> ./frontend/index.html && \\
      echo '    <style>' >> ./frontend/index.html && \\
      echo '        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }' >> ./frontend/index.html && \\
      echo '        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }' >> ./frontend/index.html && \\
      echo '        h1 { color: #333; margin-bottom: 20px; text-align: center; }' >> ./frontend/index.html && \\
      echo '        .status { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }' >> ./frontend/index.html && \\
      echo '        .links { margin-top: 30px; text-align: center; }' >> ./frontend/index.html && \\
      echo '        .links a { display: inline-block; margin: 0 10px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }' >> ./frontend/index.html && \\
      echo '        .links a:hover { background: #0056b3; }' >> ./frontend/index.html && \\
      echo '        .debug { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin-top: 20px; font-family: monospace; font-size: 12px; }' >> ./frontend/index.html && \\
      echo '    </style>' >> ./frontend/index.html && \\
      echo '</head>' >> ./frontend/index.html && \\
      echo '<body>' >> ./frontend/index.html && \\
      echo '    <div class="container">' >> ./frontend/index.html && \\
      echo '        <h1>⚠️ Portfolio Files Not Found</h1>' >> ./frontend/index.html && \\
      echo '        <div class="status">' >> ./frontend/index.html && \\
      echo '            <strong>Status:</strong> ❌ Your portfolio files could not be located' >> ./frontend/index.html && \\
      echo '        </div>' >> ./frontend/index.html && \\
      echo '        <p><strong>This is a fallback page.</strong> Your portfolio repository was cloned but no index.html file was found in the expected locations.</p>' >> ./frontend/index.html && \\
      echo '        <p>Common issues:</p>' >> ./frontend/index.html && \\
      echo '        <ul>' >> ./frontend/index.html && \\
      echo '            <li>Your portfolio might need to be built first (npm run build)</li>' >> ./frontend/index.html && \\
      echo '            <li>The main HTML file might not be named index.html</li>' >> ./frontend/index.html && \\
      echo '            <li>Files might be in a subdirectory</li>' >> ./frontend/index.html && \\
      echo '        </ul>' >> ./frontend/index.html && \\
      echo '        <div class="debug">' >> ./frontend/index.html && \\
      echo '            <strong>Debug Info:</strong><br>' >> ./frontend/index.html && \\
      echo '            Container is running and serving files<br>' >> ./frontend/index.html && \\
      echo '            Time: <span id="time"></span><br>' >> ./frontend/index.html && \\
      echo '            Status: ✅ All systems operational' >> ./frontend/index.html && \\
      echo '        </div>' >> ./frontend/index.html && \\
      echo '        <div class="links">' >> ./frontend/index.html && \\
      echo '            <a href="/api/health">Health Check</a>' >> ./frontend/index.html && \\
      echo '            <a href="javascript:location.reload()">Refresh Page</a>' >> ./frontend/index.html && \\
      echo '        </div>' >> ./frontend/index.html && \\
      echo '        <script>' >> ./frontend/index.html && \\
      echo '            document.getElementById("time").textContent = new Date().toLocaleString();' >> ./frontend/index.html && \\
      echo '            setInterval(() => {' >> ./frontend/index.html && \\
      echo '                document.getElementById("time").textContent = new Date().toLocaleString();' >> ./frontend/index.html && \\
      echo '            }, 1000);' >> ./frontend/index.html && \\
      echo '        </script>' >> ./frontend/index.html && \\
      echo '    </div>' >> ./frontend/index.html && \\
      echo '</body>' >> ./frontend/index.html && \\
      echo '</html>' >> ./frontend/index.html; \\
    fi

# Create simple startup script
RUN echo '#!/bin/sh' > start.sh && \\
    echo 'cd /app/backend' >> start.sh && \\
    echo 'echo "🐳 Starting Deployify container..."' >> start.sh && \\
    echo 'if [ -f "server.js" ]; then node server.js; elif [ -f "index.js" ]; then node index.js; elif [ -f "app.js" ]; then node app.js; else npm start; fi' >> start.sh && \\
    chmod +x start.sh

# Expose port
EXPOSE 3000

# Simplified health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=2 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["./start.sh"]
`;

  // Write Dockerfile
  const dockerfilePath = path.join(repoPath, 'Dockerfile');
  await fs.writeFile(dockerfilePath, dockerfile.trim());
  
  // Create .dockerignore
  const dockerignore = `
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.cache
.DS_Store
*.log
`;
  
  await fs.writeFile(path.join(repoPath, '.dockerignore'), dockerignore.trim());
  
  console.log('Docker files created successfully');
  
  return {
    dockerfilePath,
    imageName: `deployify-${deploymentId}`,
    containerName: `deployify-container-${deploymentId}`
  };
}

async function buildDockerImage(repoPath, imageName) {
  return new Promise((resolve, reject) => {
    console.log(`Building Docker image: ${imageName}`);
    
    const build = spawn('docker', ['build', '-t', imageName, '.'], {
      cwd: repoPath,
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    build.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`Docker build: ${message}`);
      output += message;
    });
    
    build.stderr.on('data', (data) => {
      const message = data.toString();
      console.error(`Docker build error: ${message}`);
      errorOutput += message;
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('Docker image built successfully');
        resolve({ success: true, output });
      } else {
        reject(new Error(`Docker build failed with code ${code}: ${errorOutput}`));
      }
    });
  });
}

async function runDockerContainer(imageName, containerName, port = 3000) {
  return new Promise((resolve, reject) => {
    console.log(`Running Docker container: ${containerName} on port ${port}`);
    
    // Stop and remove existing container if it exists (synchronously)
    try {
      require('child_process').execSync(`docker stop ${containerName}`, { stdio: 'ignore' });
      require('child_process').execSync(`docker rm ${containerName}`, { stdio: 'ignore' });
      console.log('Cleaned up existing container');
    } catch (error) {
      // Container doesn't exist, which is fine
    }
    
    // Run new container with optimized settings
    const run = spawn('docker', [
      'run', 
      '-d', 
      '--name', containerName,
      '-p', `${port}:3000`,
      '--memory', '512m',  // Limit memory usage
      '--cpus', '1',       // Limit CPU usage
      '--health-interval', '10s',
      '--health-timeout', '5s',
      '--health-retries', '3',
      imageName
    ], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    run.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`Docker run: ${message}`);
      output += message;
    });
    
    run.stderr.on('data', (data) => {
      const message = data.toString();
      console.error(`Docker run error: ${message}`);
      errorOutput += message;
    });
    
    run.on('close', async (code) => {
      if (code === 0) {
        const containerId = output.trim();
        console.log(`Docker container started: ${containerId}`);
        
        // Wait a moment for container to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if container is actually running
        try {
          const status = await getContainerStatus(containerName);
          console.log(`Container status: ${status}`);
          
          resolve({ 
            success: true, 
            containerId,
            url: `http://localhost:${port}`,
            containerName,
            port,
            status
          });
        } catch (statusError) {
          console.error('Failed to check container status:', statusError);
          resolve({ 
            success: true, 
            containerId,
            url: `http://localhost:${port}`,
            containerName,
            port,
            status: 'unknown'
          });
        }
      } else {
        reject(new Error(`Docker run failed with code ${code}: ${errorOutput}`));
      }
    });
  });
}

async function getContainerStatus(containerName) {
  return new Promise((resolve) => {
    const inspect = spawn('docker', ['inspect', containerName, '--format', '{{.State.Status}}'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    inspect.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    inspect.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        resolve('not found');
      }
    });
  });
}

async function stopDockerContainer(containerName) {
  return new Promise((resolve) => {
    console.log(`Stopping Docker container: ${containerName}`);
    
    const stop = spawn('docker', ['stop', containerName], {
      stdio: 'pipe',
      shell: true
    });
    
    stop.on('close', (code) => {
      // Remove container after stopping
      spawn('docker', ['rm', containerName], { stdio: 'ignore' });
      resolve(code === 0);
    });
  });
}

async function restartDockerContainer(containerName, imageName, port = 3000) {
  return new Promise(async (resolve, reject) => {
    console.log(`Restarting Docker container: ${containerName}`);
    
    try {
      // First stop and remove existing container
      await stopDockerContainer(containerName);
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start new container with same configuration
      const result = await runDockerContainer(imageName, containerName, port);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

async function checkDockerAvailable() {
  return new Promise((resolve) => {
    const check = spawn('docker', ['--version'], { stdio: 'pipe', shell: true });
    
    check.on('close', (code) => {
      resolve(code === 0);
    });
    
    check.on('error', () => {
      resolve(false);
    });
  });
}

async function findAvailablePort(startPort = 3000) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is busy, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function deployWithDocker(repoPath, deploymentId) {
  try {
    // Check if Docker is available
    const dockerAvailable = await checkDockerAvailable();
    if (!dockerAvailable) {
      throw new Error('Docker is not installed or not running. Please install Docker Desktop and make sure it\'s running.');
    }
    
    console.log('✅ Docker is available');
    
    // Create Docker files
    const dockerConfig = await createDockerDeployment(repoPath, deploymentId);
    
    // Build Docker image
    console.log('🔨 Building Docker image...');
    await buildDockerImage(repoPath, dockerConfig.imageName);
    
    // Find available port
    const port = await findAvailablePort(3000);
    console.log(`🔍 Found available port: ${port}`);
    
    // Run Docker container
    console.log('🚀 Starting Docker container...');
    const containerResult = await runDockerContainer(
      dockerConfig.imageName, 
      dockerConfig.containerName, 
      port
    );
    
    return {
      ...containerResult,
      imageName: dockerConfig.imageName,
      deploymentType: 'docker',
      status: containerResult.status === 'running' ? 'running' : 'starting'
    };
    
  } catch (error) {
    console.error('Docker deployment failed:', error);
    throw error;
  }
}

module.exports = {
  deployWithDocker,
  getContainerStatus,
  stopDockerContainer,
  restartDockerContainer,
  createDockerDeployment,
  buildDockerImage,
  runDockerContainer,
  checkDockerAvailable,
  findAvailablePort
};