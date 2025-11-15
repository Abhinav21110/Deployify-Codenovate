const axios = require('axios');

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

async function importProjectFromRepo(repoUrl) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  console.log('Importing project to Vercel...');
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
  console.log('Full repo path:', `${owner}/${repoName}`);
  
  // Create a more unique project name to avoid collisions
  // Include owner name and add timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const baseProjectName = `${owner}-${repoName}-${timestamp}`;
  
  // Sanitize project name for Vercel requirements:
  // - Max 100 characters
  // - Lowercase only
  // - Can contain letters, digits, '.', '_', '-'
  // - Cannot contain '---'
  const sanitizedName = baseProjectName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-') // Replace invalid chars with dash
    .replace(/---+/g, '--') // Replace triple+ dashes with double dash
    .replace(/^[-._]+|[-._]+$/g, '') // Remove leading/trailing special chars
    .substring(0, 100); // Limit to 100 characters

  console.log('Base project name:', baseProjectName);
  console.log('Sanitized project name:', sanitizedName);

  try {
    // Step 1: Create the project
    const projectPayload = {
      name: sanitizedName,
      gitRepository: {
        type: 'github',
        repo: `${owner}/${repoName}`
      }
    };
    
    console.log('Creating Vercel project with payload:', JSON.stringify(projectPayload, null, 2));
    
    const projectResponse = await axios.post(`${VERCEL_API_BASE}/v10/projects`, projectPayload, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Vercel project created:', projectResponse.data.name);
    console.log('Project ID:', projectResponse.data.id);
    console.log('Connected repository:', projectResponse.data.link?.repo);
    
    // Step 2: Create deployment from Git
    console.log('Creating deployment from Git repository...');
    const deployment = await createDeploymentFromGit(
      projectResponse.data.id, 
      owner, 
      repoName, 
      sanitizedName
    );
    
    let deploymentUrl = `https://${sanitizedName}.vercel.app`;
    let deploymentStatus = 'created';
    
    if (deployment) {
      deploymentUrl = `https://${deployment.url}`;
      deploymentStatus = deployment.readyState || 'BUILDING';
      
      console.log('✅ Deployment initiated successfully');
      console.log('🔗 Deployment URL:', deploymentUrl);
      console.log('📊 Initial status:', deploymentStatus);
      
      // Wait for deployment to complete (with timeout)
      console.log('⏳ Waiting for deployment to complete...');
      const finalStatus = await waitForDeployment(deployment.id);
      
      if (finalStatus.success) {
        deploymentUrl = finalStatus.url;
        deploymentStatus = 'READY';
        console.log('🎉 Deployment completed! Live at:', deploymentUrl);
      } else if (finalStatus.timeout) {
        console.log('⏰ Deployment timeout - but it may still complete');
        deploymentStatus = 'BUILDING';
      } else {
        console.log('❌ Deployment failed:', finalStatus.error);
        deploymentStatus = 'ERROR';
      }
    } else {
      console.log('❌ Could not create deployment - trying project-only approach');
      console.log('🔄 Vercel may auto-deploy from GitHub connection');
    }
    
    return {
      ...projectResponse.data,
      projectUrl: deploymentUrl,
      deploymentUrl: deploymentUrl,
      deployment: deployment,
      deploymentStatus: deploymentStatus,
      hasDeployment: !!deployment,
      autoDeployNote: deployment 
        ? 'Deployment initiated - building now' 
        : 'Vercel will automatically deploy from GitHub within a few minutes'
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
  waitForDeployment 
};