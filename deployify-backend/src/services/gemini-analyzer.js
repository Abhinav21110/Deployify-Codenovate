const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze a repository using Gemini AI
 * @param {string} repoPath - Path to the cloned repository
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeRepositoryWithAI(repoPath) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read key files from the repository
    const fileContents = await readRepoFiles(repoPath);
    
    // Build prompt for Gemini
    const prompt = buildAnalysisPrompt(fileContents);

    // Get analysis from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const analysis = parseGeminiResponse(text);

    return {
      success: true,
      analysis,
      rawResponse: text,
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Read important files from the repository
 */
async function readRepoFiles(repoPath) {
  const files = {};
  
  // List of important files to analyze
  const importantFiles = [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'README.md',
    'vite.config.js',
    'vite.config.ts',
    'next.config.js',
    'next.config.mjs',
    'nuxt.config.js',
    'nuxt.config.ts',
    'angular.json',
    'vue.config.js',
    'gatsby-config.js',
    'svelte.config.js',
    'astro.config.mjs',
    'webpack.config.js',
    'tsconfig.json',
    'vercel.json',
    'netlify.toml',
    '.env.example',
    'docker-compose.yml',
    'Dockerfile',
  ];

  for (const filename of importantFiles) {
    const filePath = path.join(repoPath, filename);
    if (await fs.pathExists(filePath)) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        files[filename] = content.slice(0, 5000); // Limit to 5000 chars per file
      } catch (error) {
        console.warn(`Could not read ${filename}:`, error.message);
      }
    }
  }

  // Get directory structure
  files['_directory_structure'] = await getDirectoryStructure(repoPath);

  return files;
}

/**
 * Get directory structure of the repo
 */
async function getDirectoryStructure(repoPath, maxDepth = 2) {
  const structure = [];
  
  async function traverse(dir, depth = 0, prefix = '') {
    if (depth > maxDepth) return;
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        // Skip node_modules, .git, and other large directories
        if (['.git', 'node_modules', 'dist', 'build', '.next', 'out'].includes(item)) {
          continue;
        }
        
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          structure.push(`${prefix}📁 ${item}/`);
          await traverse(itemPath, depth + 1, prefix + '  ');
        } else {
          structure.push(`${prefix}📄 ${item}`);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  await traverse(repoPath);
  return structure.join('\n');
}

/**
 * Build prompt for Gemini analysis
 */
function buildAnalysisPrompt(fileContents) {
  let prompt = `You are an expert at analyzing web development projects. Analyze the following project files and provide a detailed analysis.

PROJECT FILES:
`;

  for (const [filename, content] of Object.entries(fileContents)) {
    prompt += `\n--- ${filename} ---\n${content}\n`;
  }

  prompt += `

Based on these files, provide a comprehensive analysis in the following JSON format (respond ONLY with valid JSON, no markdown):

{
  "techStack": {
    "framework": "Framework name (e.g., React, Next.js, Vue, Angular, etc.)",
    "language": "Programming language (e.g., JavaScript, TypeScript)",
    "buildTool": "Build tool (e.g., Vite, Webpack, Parcel)",
    "packageManager": "Package manager detected (npm, yarn, pnpm)",
    "cssFramework": "CSS framework if any (Tailwind, Bootstrap, etc.)",
    "otherLibraries": ["List of major libraries/dependencies"]
  },
  "projectType": "Type of project (SPA, SSG, SSR, Static Site, Full-stack, etc.)",
  "buildCommand": "Most likely build command (e.g., npm run build, yarn build)",
  "outputDirectory": "Most likely output/dist directory (e.g., dist, build, out, .next)",
  "installCommand": "Install command (npm install, yarn, pnpm install)",
  "devCommand": "Development command if found (npm run dev, yarn dev)",
  "envVariables": ["List of environment variables found in .env.example if any"],
  "hasBackend": false,
  "deploymentRecommendations": {
    "bestProvider": "Recommended provider (Netlify, Vercel, AWS S3)",
    "deployMode": "Recommended deploy mode (drag-drop, git-import)",
    "reasons": ["List of reasons for this recommendation"]
  },
  "projectOverview": "A brief 2-3 sentence overview of what this project is",
  "potentialIssues": ["List any potential deployment issues or requirements"],
  "estimatedBuildTime": "Estimated build time (e.g., 1-2 minutes, 3-5 minutes)"
}

IMPORTANT: Respond with ONLY the JSON object, no additional text or markdown formatting.`;

  return prompt;
}

/**
 * Parse Gemini's response into structured data
 */
function parseGeminiResponse(text) {
  try {
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(jsonText);
    return analysis;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    // Return a fallback structure
    return {
      techStack: {
        framework: 'Unknown',
        language: 'JavaScript',
        buildTool: 'Unknown',
        packageManager: 'npm',
      },
      projectType: 'Unknown',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm install',
      projectOverview: 'Unable to analyze project automatically.',
      error: 'Failed to parse AI response',
    };
  }
}

module.exports = { analyzeRepositoryWithAI };
