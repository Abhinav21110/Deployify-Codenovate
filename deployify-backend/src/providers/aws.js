import {
  S3Client,
  CreateBucketCommand,
  PutBucketWebsiteCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutPublicAccessBlockCommand,
  PutBucketAclCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize S3 client with credentials from environment variables
const getS3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

// Recursively get all files in a directory
const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

// Upload a single file to S3
const uploadFileToS3 = async (s3Client, bucketName, filePath, baseDir) => {
  const fileContent = fs.readFileSync(filePath);
  const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: relativePath,
    Body: fileContent,
    ContentType: contentType,
    // Don't set ACL - bucket policy will handle public access
  });

  await s3Client.send(command);
  return relativePath;
};

// Check if bucket exists
const bucketExists = async (s3Client, bucketName) => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

// Create S3 bucket
const createBucket = async (s3Client, bucketName, region) => {
  const createBucketParams = {
    Bucket: bucketName,
  };

  // Only add LocationConstraint if region is not us-east-1
  if (region !== 'us-east-1') {
    createBucketParams.CreateBucketConfiguration = {
      LocationConstraint: region,
    };
  }

  await s3Client.send(new CreateBucketCommand(createBucketParams));
};

// Configure bucket for static website hosting
const configureBucketWebsite = async (s3Client, bucketName, logs = []) => {
  // First, disable Block Public Access for this bucket
  try {
    logs.push('Disabling block public access...');
    const blockPublicAccessParams = {
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    };
    await s3Client.send(new PutPublicAccessBlockCommand(blockPublicAccessParams));
  } catch (error) {
    console.warn('Could not disable block public access:', error.message);
  }

  // Set website configuration
  const websiteConfig = {
    Bucket: bucketName,
    WebsiteConfiguration: {
      IndexDocument: { Suffix: 'index.html' },
      ErrorDocument: { Key: 'index.html' }, // For SPA routing
    },
  };
  await s3Client.send(new PutBucketWebsiteCommand(websiteConfig));

  // Set bucket policy for public read access (now should work after disabling block public access)
  try {
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    };

    const policyParams = {
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy),
    };

    await s3Client.send(new PutBucketPolicyCommand(policyParams));
  } catch (error) {
    console.warn('Could not set bucket policy:', error.message);
    // Files will still be accessible via object ACLs
  }
};

const deployToAWS = async (project, client) => {
  const logs = [];
  
  try {
    logs.push('Starting AWS S3 deployment...');
    
    const s3Client = getS3Client();
    const projectName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const timestamp = Date.now();
    const bucketName = `deployify-${projectName}-${timestamp}`;
    const region = process.env.AWS_REGION || 'ap-southeast-2';

    logs.push(`Bucket name: ${bucketName}`);
    logs.push(`Region: ${region}`);

    // Check if bucket exists, create if not
    const exists = await bucketExists(s3Client, bucketName);
    if (!exists) {
      logs.push('Creating S3 bucket...');
      await createBucket(s3Client, bucketName, region);
      logs.push('Bucket created successfully.');
      
      // Wait a bit for bucket to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      logs.push('Bucket already exists.');
    }

    // Configure bucket for website hosting
    logs.push('Configuring bucket for static website hosting...');
    await configureBucketWebsite(s3Client, bucketName, logs);
    logs.push('Bucket configured for web hosting.');

    // Upload all files from the build directory
    const buildDir = project.outputPath || path.join(project.path, 'dist');
    logs.push(`Uploading files from: ${buildDir}`);

    if (!fs.existsSync(buildDir)) {
      throw new Error(`Build directory not found: ${buildDir}`);
    }

    const allFiles = getAllFiles(buildDir);
    logs.push(`Found ${allFiles.length} files to upload.`);

    let uploadedCount = 0;
    for (const file of allFiles) {
      const relativePath = await uploadFileToS3(s3Client, bucketName, file, buildDir);
      uploadedCount++;
      if (uploadedCount % 10 === 0 || uploadedCount === allFiles.length) {
        logs.push(`Uploaded ${uploadedCount}/${allFiles.length} files...`);
      }
    }

    // Generate the website URL
    const websiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;
    logs.push(`Deployment successful!`);
    logs.push(`Website URL: ${websiteUrl}`);

    return {
      ok: true,
      url: websiteUrl,
      logs: logs.join('\n'),
      bucketName,
      region,
    };
  } catch (error) {
    logs.push(`Error during deployment: ${error.message}`);
    console.error('AWS deployment error:', error);
    return {
      ok: false,
      url: '',
      logs: logs.join('\n'),
      error: error.message,
    };
  }
};

const inspect = async (deployment, client) => {
  try {
    const s3Client = getS3Client();
    const bucketName = deployment.bucketName;

    if (!bucketName) {
      return {
        ok: false,
        deployment: {
          ...deployment,
          status: 'error',
          error: 'No bucket name found in deployment data',
        },
      };
    }

    // Check if bucket still exists and get object count
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    });

    await s3Client.send(listCommand);

    return {
      ok: true,
      deployment: {
        ...deployment,
        status: 'ready',
      },
    };
  } catch (error) {
    return {
      ok: true,
      deployment: {
        ...deployment,
        status: 'error',
        error: error.message,
      },
    };
  }
};

export { deployToAWS, inspect };
