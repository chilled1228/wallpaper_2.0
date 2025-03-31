/**
 * Script to check Cloudflare R2 configuration
 * 
 * Usage: node scripts/check-r2-config.js
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Log environment variables (without sensitive values)
console.log('Checking R2 Configuration:');
console.log('CLOUDFLARE_R2_ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT ? '✓ Set' : '✗ Not set');
console.log('CLOUDFLARE_R2_ACCESS_KEY_ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set');
console.log('CLOUDFLARE_R2_SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set');
console.log('CLOUDFLARE_R2_BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images');

// Get configuration values
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images';

// Check if config is valid
if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('\n❌ Error: Missing required environment variables');
  console.error('Please check your .env.local file and make sure all R2 variables are set');
  process.exit(1);
}

// Initialize S3 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true,
});

async function checkConfig() {
  console.log('\nTesting connection to Cloudflare R2...');
  
  try {
    // Test if bucket exists
    console.log(`Checking bucket "${bucketName}"...`);
    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(headCommand);
    console.log(`✅ Successfully connected to bucket "${bucketName}"`);
    
    // Try to list objects
    console.log('\nListing objects in bucket (first 5)...');
    const listCommand = new ListObjectsV2Command({ 
      Bucket: bucketName,
      MaxKeys: 5 
    });
    const response = await s3Client.send(listCommand);
    
    const objects = response.Contents || [];
    if (objects.length === 0) {
      console.log('No objects found in bucket (empty bucket)');
    } else {
      console.log(`Found ${objects.length} objects:`);
      objects.forEach(obj => {
        console.log(`- ${obj.Key} (${obj.Size} bytes)`);
      });
    }
    
    console.log('\n✅ R2 configuration is valid and working correctly!');
  } catch (error) {
    console.error('\n❌ Error checking R2 configuration:');
    console.error(error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.error(`\nThe bucket "${bucketName}" does not exist. Please create it in your Cloudflare R2 dashboard.`);
    } else if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
      console.error('\nAccess denied. Please check your credentials and make sure they have the correct permissions.');
    } else if (error.message.includes('Load failed')) {
      console.error('\nConnection failed. Please check your R2 endpoint URL and internet connection.');
    } else if (error.name === 'CredentialsProviderError') {
      console.error('\nInvalid credentials. Please check your access key and secret key.');
    }
    
    process.exit(1);
  }
}

checkConfig(); 