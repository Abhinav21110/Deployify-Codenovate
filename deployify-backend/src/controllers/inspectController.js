const { cloneRepo, cleanupRepo } = require('../utils/git');
const fs = require('fs-extra');
const path = require('path');

async function inspect(req, res) {
  const { repoUrl, branch = 'main' } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  let clonePath = null;

  try {
    console.log(`Inspecting repo: ${repoUrl}, branch: ${branch}`);
    
    // Clone repo
    clonePath = await cloneRepo(repoUrl, branch);
    
    // Look for prebuilt folders in priority order
    const candidateFolders = ['build', 'dist', 'public'];
    const candidates = [];
    
    for (const folder of candidateFolders) {
      const folderPath = path.join(clonePath, folder);
      if (await fs.pathExists(folderPath)) {
        const stat = await fs.stat(folderPath);
        if (stat.isDirectory()) {
          candidates.push(folder);
        }
      }
    }

    const hasPrebuilt = candidates.length > 0;

    console.log(`Found candidates: ${candidates.join(', ')}`);

    res.json({
      repoUrl,
      candidates,
      hasPrebuilt
    });

  } catch (error) {
    console.error('Inspect error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup
    if (clonePath) {
      await cleanupRepo(clonePath);
    }
  }
}

module.exports = { inspect };