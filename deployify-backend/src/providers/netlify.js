const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';
const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

async function uploadZipDeploy(zipPath) {
  if (!NETLIFY_AUTH_TOKEN) {
    throw new Error('NETLIFY_AUTH_TOKEN environment variable is required');
  }

  console.log('Uploading zip to Netlify...');

  try {
    // Step 1: Create a new site
    console.log('Creating new Netlify site...');
    const siteResponse = await axios.post(`${NETLIFY_API_BASE}/sites`, {}, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const siteId = siteResponse.data.id;
    console.log('Site created:', siteResponse.data.name, 'ID:', siteId);

    // Step 2: Deploy the zip file to the site
    console.log('Deploying zip file to site...');
    const zipBuffer = fs.readFileSync(zipPath);
    
    const deployResponse = await axios.post(
      `${NETLIFY_API_BASE}/sites/${siteId}/deploys`,
      zipBuffer,
      {
        headers: {
          'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
          'Content-Type': 'application/zip'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('Deployment successful:', deployResponse.data.id);
    console.log('Site URL:', siteResponse.data.ssl_url);

    return {
      ...siteResponse.data,
      deploy_id: deployResponse.data.id,
      deploy_url: deployResponse.data.deploy_ssl_url || siteResponse.data.ssl_url
    };
  } catch (error) {
    console.error('Netlify deployment error:', error.response?.data || error.message);
    throw new Error(`Netlify deployment failed: ${error.response?.data?.message || error.message}`);
  }
}

async function createSiteFromRepo(repoUrl) {
  if (!NETLIFY_AUTH_TOKEN) {
    throw new Error('NETLIFY_AUTH_TOKEN environment variable is required');
  }

  console.log('Creating Netlify site from repo...');

  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  const [, owner, repo] = match;
  const repoName = repo.replace('.git', '');

  try {
    const response = await axios.post(`${NETLIFY_API_BASE}/sites`, {
      repo: {
        provider: 'github',
        repo: `${owner}/${repoName}`,
        private: false,
        branch: 'main'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Netlify site created:', response.data.name);
    return response.data;
  } catch (error) {
    console.error('Netlify site creation error:', error.response?.data || error.message);
    throw new Error(`Netlify site creation failed: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = { uploadZipDeploy, createSiteFromRepo };