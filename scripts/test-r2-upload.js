/**
 * Script to test Cloudflare R2 upload functionality
 * 
 * Usage: node scripts/test-r2-upload.js
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Get configuration values
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images';

// Check if config is valid
if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Error: Missing required environment variables');
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

// Create a sample test file
const createTestFile = () => {
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, 'test-image.txt');
  fs.writeFileSync(filePath, 'This is a test file to verify R2 upload functionality');
  return filePath;
};

// Upload to R2
const uploadToR2 = async (filePath) => {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const key = `test-uploads/${Date.now()}-${fileName}`;
  
  console.log(`Uploading test file to R2: ${key}`);
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'text/plain',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        testUpload: 'true'
      }
    });
    
    await s3Client.send(command);
    console.log(`✅ Successfully uploaded test file to R2: ${key}`);
    return key;
  } catch (error) {
    console.error('❌ Error uploading to R2:', error.message);
    throw error;
  }
};

// Run the test
(async () => {
  console.log('Testing R2 upload functionality...');
  
  try {
    const testFilePath = createTestFile();
    console.log(`Created test file: ${testFilePath}`);
    
    const uploadedKey = await uploadToR2(testFilePath);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log(`Removed test file: ${testFilePath}`);
    
    console.log('\n✅ R2 upload test completed successfully!');
    console.log(`The test file was uploaded to: ${bucketName}/${uploadedKey}`);
    
    if (process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN) {
      console.log(`Public URL: ${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${uploadedKey}`);
    }
  } catch (error) {
    console.error('\n❌ R2 upload test failed!');
    process.exit(1);
  }
})(); 