const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const VERCEL_API_BASE = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

// Enhanced approach - create project and trigger deployment

async function createDeploymentFromGit(projectId, repoOwner, repoName, projectName) {
  try {
    console.log('Creating deployment from Git for project:', projectId);
    
    // Use the correct Vercel deployment API
    const deploymentPayload = {
      name: projectName,
      project: projectId,
      gitSource: {
        type: 'github',
        repo: `${repoOwner}/${repoName}`,
        ref: 'main'
      },
      target: 'production'
    };
    
    console.log('Deployment payload:', JSON.stringify(deploymentPayload, null, 2));
    
    const response = await axios.post(`${VERCEL_API_BASE}/v13/deployments`, deploymentPayload, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Deployment created successfully');
    console.log('Deployment ID:', response.data.id);
    console.log('Deployment URL:', response.data.url);
    console.log('Ready State:', response.data.readyState);
    
    return response.data;
  } catch (error) {
    console.error('❌ Deployment creation failed:', error.response?.data || error.message);
    
    // Try alternative approach - trigger via project settings
    try {
      console.log('Trying alternative deployment approach...');
      
      const altResponse = await axios.post(`${VERCEL_API_BASE}/v9/projects/${projectId}/deployments`, {
        name: projectName,
        gitSource: {
          type: 'github',
          repo: `${repoOwner}/${repoName}`,
          ref: 'main'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Alternative deployment successful');
      return altResponse.data;
      
    } catch (altError) {
      console.error('❌ Alternative deployment also failed:', altError.response?.data || altError.message);
      return null;
    }
  }
}

async function checkDeploymentStatus(deploymentId) {
  try {
    console.log('Checking deployment status:', deploymentId);
    
    const response = await axios.get(`${VERCEL_API_BASE}/v13/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });
    
    console.log('Deployment status:', response.data.readyState);
    console.log('Deployment URL:', response.data.url);
    
    return response.data;
  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message);
    return null;
  }
}

async function waitForDeployment(deploymentId, maxWaitTime = 180000) { // 3 minutes max
  const startTime = Date.now();
  const checkInterval = 10000; // Check every 10 seconds
  
  console.log(`⏳ Waiting for deployment ${deploymentId} to complete...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkDeploymentStatus(deploymentId);
    
    if (!status) {
      console.log('❌ Could not check deployment status');
      break;
    }
    
    console.log(`📊 Deployment status: ${status.readyState}`);
    
    if (status.readyState === 'READY') {
      console.log('✅ Deployment completed successfully!');
      return {
        ...status,
        success: true,
        url: `https://${status.url}`
      };
    }
    
    if (status.readyState === 'ERROR' || status.readyState === 'CANCELED') {
      console.log(`❌ Deployment failed with status: ${status.readyState}`);
      return {
        ...status,
        success: false,
        error: `Deployment ${status.readyState.toLowerCase()}`
      };
    }
    
    // Still building, wait and check again
    console.log(`🔄 Still building... (${status.readyState})`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  console.log('⏰ Deployment wait timeout - deployment may still be in progress');
  return {
    success: false,
    timeout: true,
    message: 'Deployment is taking longer than expected but may still complete'
  };
}

async function deployFilesToVercel(projectPath, projectName) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  console.log('📦 Deploying files directly to Vercel...');
  console.log('Project path:', projectPath);
  console.log('Project name:', projectName);

  try {
    // Read all files from the project directory
    const files = [];
    const allFiles = glob.sync('**/*', {
      cwd: projectPath,
      nodir: true,
      dot: false,
      ignore: ['node_modules/**', '.git/**', '.env*', '*.log', 'package-lock.json', 'yarn.lock']
    });

    console.log(`Found ${allFiles.length} files to deploy`);

    // Read and encode all files
    for (const file of allFiles) {
      const filePath = path.join(projectPath, file);
      const content = await fs.readFile(filePath);
      
      // Vercel expects files in this format
      files.push({
        file: file,
        data: content.toString('utf-8'),
      });
    }

    // Check if package.json exists to detect build requirements
    const hasPackageJson = files.some(f => f.file === 'package.json');
    
    // Create deployment payload according to Vercel v13 API
    const deploymentPayload = {
      name: projectName,
      files: files,
      target: 'production',
      public: false
    };

    console.log(`Uploading ${files.length} files to Vercel...`);

    const response = await axios.post(`${VERCEL_API_BASE}/v13/deployments?skipAutoDetectionConfirmation=1`, deploymentPayload, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    console.log('✅ Deployment created successfully!');
    console.log('Deployment ID:', response.data.id);
    console.log('Deployment URL:', response.data.url);
    console.log('Ready State:', response.data.readyState);

    // Wait for deployment to complete
    const finalStatus = await waitForDeployment(response.data.id);

    const deploymentUrl = `https://${response.data.url}`;

    return {
      id: response.data.id,
      name: projectName,
      projectUrl: deploymentUrl,
      deploymentUrl: deploymentUrl,
      deployment: response.data,
      deploymentStatus: finalStatus.success ? 'READY' : finalStatus.timeout ? 'BUILDING' : 'ERROR',
      hasDeployment: true,
      success: true
    };

  } catch (error) {
    console.error('❌ Vercel file deployment failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Vercel deployment failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function importProjectFromRepo(repoUrl, clonedPath = null) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  console.log('Deploying project to Vercel...');
  console.log('Repository URL:', repoUrl);

  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  const [, owner, repo] = match;
  const repoName = repo.replace('.git', '');
  
  console.log('Extracted owner:', owner);
  console.log('Extracted repo:', repoName);
  
  // Create a unique project name
  const timestamp = Date.now().toString().slice(-6);
  const baseProjectName = `${owner}-${repoName}-${timestamp}`;
  
  const sanitizedName = baseProjectName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/---+/g, '--')
    .replace(/^[-._]+|[-._]+$/g, '')
    .substring(0, 100);

  console.log('Sanitized project name:', sanitizedName);

  try {
    // If we have the cloned repository path, deploy files directly
    if (clonedPath && await fs.pathExists(clonedPath)) {
      console.log('Deploying from local files...');
      return await deployFilesToVercel(clonedPath, sanitizedName);
    }

    // Otherwise, create a project and return instructions
    console.log('Creating Vercel project...');
    
    const projectPayload = {
      name: sanitizedName,
      framework: null, // Auto-detect
    };
    
    console.log('Project payload:', JSON.stringify(projectPayload, null, 2));
    
    const projectResponse = await axios.post(`${VERCEL_API_BASE}/v10/projects`, projectPayload, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Vercel project created successfully');
    console.log('Project ID:', projectResponse.data.id);
    console.log('Project name:', projectResponse.data.name);
    
    const projectUrl = `https://${sanitizedName}.vercel.app`;
    
    // Return project info with instructions
    return {
      id: projectResponse.data.id,
      name: sanitizedName,
      projectUrl: projectUrl,
      deploymentUrl: projectUrl,
      hasDeployment: false,
      success: true,
      manualSetupRequired: true,
      setupInstructions: [
        '1. Go to your Vercel dashboard',
        '2. Find the project: ' + sanitizedName,
        '3. Click "Settings" → "Git"',
        '4. Connect to GitHub repository: ' + owner + '/' + repoName,
        '5. Vercel will automatically deploy'
      ],
      autoDeployNote: `Project created! To deploy from Git: Go to Vercel dashboard → ${sanitizedName} → Settings → Git → Connect to ${owner}/${repoName}`
    };
  } catch (error) {
    console.error('Vercel import error:', error.response?.data || error.message);
    throw new Error(`Vercel import failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = { 
  importProjectFromRepo, 
  checkDeploymentStatus, 
  createDeploymentFromGit,
  waitForDeployment,
  deployFilesToVercel
};