const { cloneRepo, cleanupRepo } = require('../utils/git');
const { zipFolder } = require('../utils/zip');
const netlify = require('../providers/netlify');
const vercel = require('../providers/vercel');
const docker = require('../providers/docker');
const aws = require('../providers/aws.js');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Simple in-memory store for deployment status and logs
const deployments = new Map();
const deploymentLogs = new Map(); // Store logs per deployment

// Helper function to add log to deployment
function addDeploymentLog(deploymentId, level, message) {
  if (!deploymentLogs.has(deploymentId)) {
    deploymentLogs.set(deploymentId, []);
  }
  
  const logs = deploymentLogs.get(deploymentId);
  logs.push({
    level,
    timestamp: new Date().toISOString(),
    message
  });
  
  // Keep only last 50 logs per deployment
  if (logs.length > 50) {
    logs.shift();
  }
  
  console.log(`[${deploymentId}] ${message}`);
}

// Function to build a Node.js project
async function buildProject(projectPath) {
  return new Promise((resolve, reject) => {
    console.log('Installing dependencies...');
    
    // First install dependencies
    const install = spawn('npm', ['install'], {
      cwd: projectPath,
      stdio: 'pipe',
      shell: true
    });
    
    install.stdout.on('data', (data) => {
      console.log(`npm install: ${data}`);
    });
    
    install.stderr.on('data', (data) => {
      console.error(`npm install error: ${data}`);
    });
    
    install.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`npm install failed with code ${code}`));
        return;
      }
      
      console.log('Building project...');
      
      // Then build the project
      const build = spawn('npm', ['run', 'build'], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: true
      });
      
      build.stdout.on('data', (data) => {
        console.log(`npm build: ${data}`);
      });
      
      build.stderr.on('data', (data) => {
        console.error(`npm build error: ${data}`);
      });
      
      build.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`npm build failed with code ${code}`));
          return;
        }
        
        // Check for common build output directories
        const possibleDirs = ['dist', 'build', 'out', '.next'];
        let buildDir = null;
        
        for (const dir of possibleDirs) {
          const dirPath = path.join(projectPath, dir);
          if (await fs.pathExists(dirPath)) {
            buildDir = dirPath;
            console.log(`Found build output in: ${dir}`);
            break;
          }
        }
        
        if (!buildDir) {
          reject(new Error('Build completed but no build output directory found'));
          return;
        }
        
        resolve(buildDir);
      });
    });
  });
}

async function deploy(req, res) {
  const { repoUrl, provider, deployMode, branch = 'main', buildDir } = req.body;

  if (!repoUrl || !provider || !deployMode) {
    return res.status(400).json({ 
      error: 'repoUrl, provider, and deployMode are required' 
    });
  }

  if (!['netlify', 'vercel', 'docker', 'aws'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be netlify, vercel, docker, or aws' });
  }

  if (!['drag-drop', 'git-import', 'docker-local'].includes(deployMode)) {
    return res.status(400).json({ error: 'deployMode must be drag-drop, git-import, or docker-local' });
  }

  const deploymentId = uuidv4();
  let clonePath = null;
  let zipPath = null;

  try {
    addDeploymentLog(deploymentId, 'info', `Starting deployment: ${provider} ${deployMode} for ${repoUrl}`);
    
    // Clone repo
    addDeploymentLog(deploymentId, 'info', 'Cloning repository...');
    clonePath = await cloneRepo(repoUrl, branch);
    addDeploymentLog(deploymentId, 'info', `Repository cloned to: ${clonePath}`);

    if (provider === 'netlify' && deployMode === 'drag-drop') {
      // Check if this is a buildable project (has package.json)
      const hasPackageJson = await fs.pathExists(path.join(clonePath, 'package.json'));
      let buildPath = clonePath;

      if (hasPackageJson) {
        addDeploymentLog(deploymentId, 'info', 'Detected Node.js project, building...');
        
        // Build the project
        buildPath = await buildProject(clonePath);
        addDeploymentLog(deploymentId, 'info', `Build completed, using built files from: ${buildPath}`);
      } else {
        // Find existing build directory
        let targetDir = buildDir;
        if (!targetDir) {
          const candidateFolders = ['build', 'dist', 'public'];
          for (const folder of candidateFolders) {
            const folderPath = path.join(clonePath, folder);
            if (await fs.pathExists(folderPath)) {
              targetDir = folder;
              break;
            }
          }
        }

        if (!targetDir) {
          return res.status(400).json({ 
            error: 'No prebuilt folder found and no package.json to build. Expected build, dist, or public directory.' 
          });
        }

        buildPath = path.join(clonePath, targetDir);
        if (!(await fs.pathExists(buildPath))) {
          return res.status(400).json({ 
            error: `Build directory '${targetDir}' not found` 
          });
        }

        addDeploymentLog(deploymentId, 'info', `Using existing build directory: ${targetDir}`);
      }

      // List all files in the build directory
      console.log(`Contents of build directory:`);
      try {
        const buildFiles = await fs.readdir(buildPath);
        for (const file of buildFiles) {
          const filePath = path.join(buildPath, file);
          const stat = await fs.stat(filePath);
          console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
        }
      } catch (error) {
        console.error('Error reading build directory:', error.message);
      }

      // Check if there's an index.html file
      const indexPath = path.join(buildPath, 'index.html');
      if (!(await fs.pathExists(indexPath))) {
        console.log('❌ No index.html found in build output!');
        
        return res.status(400).json({ 
          error: `No index.html found in build output. The build may have failed or this project type is not supported.` 
        });
      } else {
        console.log('✅ Found index.html file');
      }

      // Create zip
      addDeploymentLog(deploymentId, 'info', 'Creating deployment package...');
      zipPath = await zipFolder(buildPath, deploymentId);
      addDeploymentLog(deploymentId, 'info', `Package created: ${zipPath}`);

      // Deploy to Netlify
      addDeploymentLog(deploymentId, 'info', 'Uploading to Netlify...');
      const result = await netlify.uploadZipDeploy(zipPath);
      addDeploymentLog(deploymentId, 'info', `Netlify deployment successful: ${result.ssl_url}`);

      deployments.set(deploymentId, {
        provider: 'netlify',
        status: 'created',
        result
      });

      res.json({
        provider: 'netlify',
        site_url: result.ssl_url || null,
        deploy_id: deploymentId,
        status: 'created'
      });

    } else if (provider === 'netlify' && deployMode === 'git-import') {
      // Create site from repo
      addDeploymentLog(deploymentId, 'info', 'Creating Netlify site from repository...');
      const result = await netlify.createSiteFromRepo(repoUrl);
      addDeploymentLog(deploymentId, 'info', `Netlify site created: ${result.ssl_url}`);

      deployments.set(deploymentId, {
        provider: 'netlify',
        status: 'created',
        result
      });

      res.json(result);

    } else if (provider === 'vercel' && deployMode === 'git-import') {
      // Import project to Vercel
      addDeploymentLog(deploymentId, 'info', 'Deploying to Vercel from repository files...');
      const result = await vercel.importProjectFromRepo(repoUrl, clonePath);
      
      if (result.hasDeployment) {
        addDeploymentLog(deploymentId, 'info', `Vercel deployment initiated: ${result.deploymentUrl}`);
        addDeploymentLog(deploymentId, 'info', `Deployment status: ${result.deploymentStatus}`);
        addDeploymentLog(deploymentId, 'info', 'Building... This may take 1-3 minutes');
      } else {
        addDeploymentLog(deploymentId, 'info', `Vercel project created: ${result.projectUrl}`);
        addDeploymentLog(deploymentId, 'info', 'Waiting for auto-deployment to trigger...');
      }

      deployments.set(deploymentId, {
        provider: 'vercel',
        status: 'created',
        result
      });

      const siteUrl = result.deploymentUrl || result.projectUrl || `https://${result.name}.vercel.app`;
      
      res.json({
        provider: 'vercel',
        deploymentId: deploymentId,
        gitUrl: repoUrl,
        siteName: result.name,
        siteUrl: siteUrl,
        status: result.hasDeployment ? 'deploying' : 'created',
        deploymentStatus: result.deploymentStatus,
        note: result.autoDeployNote || 'Vercel is building and deploying your project'
      });

    } else if (provider === 'docker' && deployMode === 'docker-local') {
      // Deploy with Docker locally
      addDeploymentLog(deploymentId, 'info', 'Starting Docker deployment...');
      addDeploymentLog(deploymentId, 'info', 'Creating Dockerfile and building image...');
      
      const result = await docker.deployWithDocker(clonePath, deploymentId);
      
      addDeploymentLog(deploymentId, 'info', `Docker container started: ${result.containerName}`);
      addDeploymentLog(deploymentId, 'info', `Application running at: ${result.url}`);

      deployments.set(deploymentId, {
        provider: 'docker',
        status: 'running',
        result
      });

      res.json({
        provider: 'docker',
        deploymentId: deploymentId,
        gitUrl: repoUrl,
        siteName: result.containerName,
        siteUrl: result.url,
        status: 'running',
        containerName: result.containerName,
        imageName: result.imageName,
        port: result.port,
        note: 'Docker container is running locally'
      });

    } else if (provider === 'aws' && deployMode === 'drag-drop') {
      // Deploy to AWS S3
      const hasPackageJson = await fs.pathExists(path.join(clonePath, 'package.json'));
      let buildPath = clonePath;

      if (hasPackageJson) {
        addDeploymentLog(deploymentId, 'info', 'Detected Node.js project, building...');
        
        // Build the project
        buildPath = await buildProject(clonePath);
        addDeploymentLog(deploymentId, 'info', `Build completed, using built files from: ${buildPath}`);
      } else {
        // Find existing build directory
        let targetDir = buildDir;
        if (!targetDir) {
          const candidateFolders = ['build', 'dist', 'public'];
          for (const folder of candidateFolders) {
            const folderPath = path.join(clonePath, folder);
            if (await fs.pathExists(folderPath)) {
              targetDir = folder;
              break;
            }
          }
        }

        if (!targetDir) {
          return res.status(400).json({ 
            error: 'No prebuilt folder found and no package.json to build. Expected build, dist, or public directory.' 
          });
        }

        buildPath = path.join(clonePath, targetDir);
        if (!(await fs.pathExists(buildPath))) {
          return res.status(400).json({ 
            error: `Build directory '${targetDir}' not found` 
          });
        }

        addDeploymentLog(deploymentId, 'info', `Using existing build directory: ${targetDir}`);
      }

      // Check if there's an index.html file
      const indexPath = path.join(buildPath, 'index.html');
      if (!(await fs.pathExists(indexPath))) {
        return res.status(400).json({ 
          error: `No index.html found in build output. The build may have failed or this project type is not supported.` 
        });
      }

      addDeploymentLog(deploymentId, 'info', 'Deploying to AWS S3...');
      
      // Get repo name from URL for project naming
      const repoName = repoUrl.split('/').pop().replace('.git', '');
      
      const result = await aws.deployToAWS({
        name: repoName,
        path: clonePath,
        outputPath: buildPath
      }, null);

      if (!result.ok) {
        throw new Error(result.logs || 'AWS deployment failed');
      }

      addDeploymentLog(deploymentId, 'info', `AWS deployment successful: ${result.url}`);

      deployments.set(deploymentId, {
        provider: 'aws',
        status: 'deployed',
        result
      });

      res.json({
        provider: 'aws',
        site_url: result.url,
        deploy_id: deploymentId,
        status: 'deployed',
        bucketName: result.bucketName,
        region: result.region
      });

    } else {
      return res.status(400).json({ 
        error: `Unsupported combination: ${provider} ${deployMode}` 
      });
    }

  } catch (error) {
    addDeploymentLog(deploymentId, 'error', `Deployment failed: ${error.message}`);
    
    deployments.set(deploymentId, {
      provider,
      status: 'failed',
      error: error.message
    });

    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup
    addDeploymentLog(deploymentId, 'info', 'Cleaning up temporary files...');
    if (clonePath) {
      await cleanupRepo(clonePath);
    }
    if (zipPath) {
      await fs.remove(zipPath).catch(console.error);
    }
    addDeploymentLog(deploymentId, 'info', 'Deployment process completed');
  }
}

async function getStatus(req, res) {
  const { id } = req.params;
  
  const deployment = deployments.get(id);
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  res.json({
    id,
    provider: deployment.provider,
    status: deployment.status,
    error: deployment.error || null
  });
}

async function getLogs(req, res) {
  const { id } = req.params;
  
  const logs = deploymentLogs.get(id) || [];
  
  res.json({
    deploymentId: id,
    logs: logs
  });
}

async function manageContainer(req, res) {
  const { id } = req.params;
  const { action } = req.body; // 'stop', 'start', 'restart', 'status'
  
  const deployment = deployments.get(id);
  if (!deployment || deployment.provider !== 'docker') {
    return res.status(404).json({ error: 'Docker deployment not found' });
  }
  
  const containerName = deployment.result.containerName;
  
  try {
    switch (action) {
      case 'stop':
        await docker.stopDockerContainer(containerName);
        deployment.status = 'stopped';
        addDeploymentLog(id, 'info', `Container ${containerName} stopped`);
        break;
        
      case 'status':
        const status = await docker.getContainerStatus(containerName);
        return res.json({ 
          deploymentId: id, 
          containerStatus: status,
          url: deployment.result.url 
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json({ 
      success: true, 
      action: action,
      containerName: containerName 
    });
    
  } catch (error) {
    addDeploymentLog(id, 'error', `Container management failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { deploy, getStatus, getLogs, manageContainer };