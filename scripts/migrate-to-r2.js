/**
 * Script to migrate images from Firebase Storage to Cloudflare R2
 * 
 * Usage: 
 * 1. Ensure all environment variables are set
 * 2. Run with: node scripts/migrate-to-r2.js
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getStorage, ref, listAll, getDownloadURL } = require('firebase/storage');
const { initializeApp } = require('firebase/app');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

// Initialize S3 client with Cloudflare R2 credentials
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
  // Fix for "Resolved credential object is not valid" error
  forcePathStyle: true, // Required for Cloudflare R2
  signatureVersion: 'v4', // Required for R2
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images';

// Folders to migrate
const FOLDERS_TO_MIGRATE = [
  'wallpaper-images',
  'wallpapers',
  'prompt-images'
];

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Utility to get file content type based on extension
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

// Function to download file to temp directory
async function downloadFile(url, filePath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(filePath, buffer);
  return buffer;
}

// Function to upload file to R2
async function uploadToR2(buffer, key, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error uploading ${key} to R2:`, error);
    return false;
  }
}

// Function to migrate files from a specific folder
async function migrateFolder(folderPath) {
  console.log(`\nMigrating folder: ${folderPath}`);
  
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    console.log(`Found ${result.items.length} files in ${folderPath}`);
    
    // Create stats
    const stats = {
      total: result.items.length,
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process each file
    for (let i = 0; i < result.items.length; i++) {
      const item = result.items[i];
      const fileName = item.name;
      const fullPath = item.fullPath;
      
      console.log(`[${i+1}/${result.items.length}] Processing: ${fullPath}`);
      
      try {
        // Get download URL from Firebase
        const downloadUrl = await getDownloadURL(item);
        
        // Download the file to temp directory
        const tempFilePath = path.join(tempDir, fileName);
        const fileBuffer = await downloadFile(downloadUrl, tempFilePath);
        
        // Get content type
        const contentType = getContentType(fileName);
        
        // Upload to R2
        const success = await uploadToR2(fileBuffer, fullPath, contentType);
        
        if (success) {
          console.log(`  ✅ Successfully migrated ${fullPath}`);
          stats.success++;
        } else {
          console.log(`  ❌ Failed to migrate ${fullPath}`);
          stats.failed++;
        }
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${fullPath}:`, error);
        stats.failed++;
      }
    }
    
    // Process subfolders recursively
    for (const subfolder of result.prefixes) {
      await migrateFolder(subfolder.fullPath);
    }
    
    // Return stats for this folder
    return stats;
    
  } catch (error) {
    console.error(`Error listing files in ${folderPath}:`, error);
    return {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }
}

// Main migration function
async function migrateToR2() {
  console.log('Starting migration from Firebase Storage to Cloudflare R2');
  console.log('---------------------------------------------------');
  console.log(`Target R2 bucket: ${BUCKET_NAME}`);
  
  // Check environment variables
  if (
    !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !process.env.CLOUDFLARE_R2_ENDPOINT
  ) {
    console.error('❌ ERROR: Missing required environment variables for R2');
    console.error('Please set CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_ENDPOINT');
    process.exit(1);
  }
  
  const totalStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  // Migrate each folder
  for (const folder of FOLDERS_TO_MIGRATE) {
    const stats = await migrateFolder(folder);
    
    // Add to total stats
    totalStats.total += stats.total;
    totalStats.success += stats.success;
    totalStats.failed += stats.failed;
    totalStats.skipped += stats.skipped;
  }
  
  // Print summary
  console.log('\n---------------------------------------------------');
  console.log('Migration Summary:');
  console.log(`Total files: ${totalStats.total}`);
  console.log(`Successfully migrated: ${totalStats.success}`);
  console.log(`Failed: ${totalStats.failed}`);
  console.log(`Skipped: ${totalStats.skipped}`);
  console.log('---------------------------------------------------');
  
  // Clean up temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Cleaned up temporary files');
  } catch (error) {
    console.warn('Warning: Could not clean up temporary directory:', error);
  }
  
  if (totalStats.failed > 0) {
    console.log('⚠️ Some files failed to migrate. Check the logs for details.');
    process.exit(1);
  } else {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  }
}

// Run the migration
migrateToR2().catch(error => {
  console.error('Unhandled error during migration:', error);
  process.exit(1);
}); 