const { cloneRepo, cleanupRepo } = require('../utils/git');
const fs = require('fs-extra');
const path = require('path');
const { analyzeRepositoryWithAI } = require('../services/gemini-analyzer.js');

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
    const candidateFolders = ['build', 'dist', 'public', 'out', '.next'];
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
      hasPrebuilt,
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

async function summarize(req, res) {
  const { repoUrl, branch = 'main' } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  let clonePath = null;

  try {
    console.log(`Summarizing repo: ${repoUrl}, branch: ${branch}`);
    
    // Clone repo
    clonePath = await cloneRepo(repoUrl, branch);

    // Analyze repository with Gemini AI
    console.log('Analyzing repository with AI...');
    const aiAnalysis = await analyzeRepositoryWithAI(clonePath);

    res.json({
      repoUrl,
      aiAnalysis: aiAnalysis.success ? aiAnalysis.analysis : null,
      aiError: aiAnalysis.success ? null : aiAnalysis.error,
    });

  } catch (error) {
    console.error('Summarize error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup
    if (clonePath) {
      await cleanupRepo(clonePath);
    }
  }
}

module.exports = { inspect, summarize };