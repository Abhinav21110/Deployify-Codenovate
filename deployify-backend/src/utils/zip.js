const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/deployify';

async function zipFolder(folderPath, deploymentId) {
  await fs.ensureDir(TEMP_DIR);
  
  const zipPath = path.join(TEMP_DIR, `deploy-${deploymentId}.zip`);
  
  // Log what files we're adding
  console.log('Files being added to zip from:', folderPath);
  try {
    const files = await fs.readdir(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        console.log(`  - ${file}`);
      } else if (stat.isDirectory()) {
        console.log(`  - ${file}/ (directory)`);
      }
    }
  } catch (error) {
    console.error('Error reading folder contents:', error.message);
  }
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zip created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      reject(new Error(`Zip creation failed: ${err.message}`));
    });

    archive.pipe(output);
    
    // Add all files from the folder
    archive.directory(folderPath, false);
    
    archive.finalize();
  });
}

module.exports = { zipFolder };