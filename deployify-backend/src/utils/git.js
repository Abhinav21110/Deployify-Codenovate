const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/deployify';

async function cloneRepo(repoUrl, branch = 'main') {
  // Ensure temp directory exists
  await fs.ensureDir(TEMP_DIR);
  
  const cloneId = uuidv4();
  const clonePath = path.join(TEMP_DIR, `repo-${cloneId}`);
  
  console.log(`Cloning ${repoUrl} (branch: ${branch}) to ${clonePath}`);
  
  const git = simpleGit();
  
  try {
    await git.clone(repoUrl, clonePath, ['--depth', '1', '--branch', branch]);
    console.log(`Successfully cloned to ${clonePath}`);
    return clonePath;
  } catch (error) {
    // Cleanup on failure
    await cleanupRepo(clonePath);
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

async function cleanupRepo(clonePath) {
  try {
    if (await fs.pathExists(clonePath)) {
      await fs.remove(clonePath);
      console.log(`Cleaned up ${clonePath}`);
    }
  } catch (error) {
    console.error(`Cleanup error for ${clonePath}:`, error.message);
  }
}

module.exports = { cloneRepo, cleanupRepo };