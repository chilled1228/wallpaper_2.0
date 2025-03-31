/**
 * CLEANUP SCRIPT FOR WALLPAPER APP
 * 
 * This script uses the Firebase Admin SDK to clean up all wallpaper data.
 * It removes files from Firebase Storage and documents from Firestore.
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Check if service account file exists
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found in project root!');
  console.log('Please place your Firebase service account key file in the project root directory.');
  console.log('You can download this file from the Firebase console:');
  console.log('  1. Go to Project Settings > Service Accounts');
  console.log('  2. Click "Generate new private key"');
  console.log('  3. Save the file as "serviceAccountKey.json" in the project root');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

// Get references to Firestore and Storage
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main cleanup function
 */
async function cleanupWallpapers() {
  console.log('🧹 Starting wallpaper cleanup using Admin SDK...');
  console.log('─────────────────────────────────────────────────');
  
  try {
    // Check Firestore documents
    console.log('📂 Checking Firestore database...');
    const wallpapersSnapshot = await db.collection('wallpapers').get();
    const wallpaperDocs = wallpapersSnapshot.docs;
    
    console.log(`Found ${wallpaperDocs.length} documents in Firestore`);
    
    // Check Storage files
    console.log('\n📂 Checking Firebase Storage...');
    const [files] = await bucket.getFiles({ prefix: 'wallpapers/' });
    
    console.log(`Found ${files.length} files in Firebase Storage`);
    
    // If nothing to delete
    if (wallpaperDocs.length === 0 && files.length === 0) {
      console.log('\n✅ Nothing to clean up! Both Storage and Firestore are empty.');
      rl.close();
      return;
    }
    
    // Show sample of what will be deleted
    if (wallpaperDocs.length > 0) {
      console.log('\n📋 Sample Firestore documents:');
      wallpaperDocs.slice(0, 3).forEach((doc, i) => {
        const data = doc.data();
        console.log(`   ${i + 1}. ID: ${doc.id} - Title: ${data.title || 'Untitled'}`);
      });
      
      if (wallpaperDocs.length > 3) {
        console.log(`   ... and ${wallpaperDocs.length - 3} more documents`);
      }
    }
    
    if (files.length > 0) {
      console.log('\n📋 Sample Storage files:');
      files.slice(0, 3).forEach((file, i) => {
        console.log(`   ${i + 1}. ${file.name}`);
      });
      
      if (files.length > 3) {
        console.log(`   ... and ${files.length - 3} more files`);
      }
    }
    
    // Ask for confirmation
    rl.question(`\n⚠️  WARNING: You are about to delete ${wallpaperDocs.length} documents and ${files.length} files.\nThis action CANNOT be undone.\n\nType 'DELETE-ALL' to confirm: `, async (answer) => {
      if (answer.trim() === 'DELETE-ALL') {
        // Delete Firestore documents first
        if (wallpaperDocs.length > 0) {
          console.log('\n🗑️  Deleting Firestore documents...');
          await deleteFirestoreDocuments(wallpaperDocs);
        }
        
        // Then delete Storage files
        if (files.length > 0) {
          console.log('\n🗑️  Deleting Storage files...');
          await deleteStorageFiles(files);
        }
        
        console.log('\n\n🎉 Cleanup completed successfully!');
      } else {
        console.log('\n🛑 Cleanup cancelled. Nothing was deleted.');
      }
      
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup preparation:', error);
    rl.close();
    process.exit(1);
  }
}

/**
 * Delete Firestore documents in batches
 */
async function deleteFirestoreDocuments(docs: admin.firestore.QueryDocumentSnapshot[]) {
  let successCount = 0;
  let errorCount = 0;
  
  // Use batched writes for better performance
  const batchSize = 500; // Firestore limit is 500 operations per batch
  
  for (let i = 0; i < docs.length; i += batchSize) {
    try {
      const batch = db.batch();
      const currentBatch = docs.slice(i, i + batchSize);
      
      currentBatch.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      successCount += currentBatch.length;
      
      // Show progress
      const progress = Math.min(100, Math.round(((i + currentBatch.length) / docs.length) * 100));
      process.stdout.write(`\r   Progress: ${i + currentBatch.length}/${docs.length} (${progress}%)`);
      
    } catch (error) {
      console.error(`\n❌ Error deleting batch starting at document ${i}:`, error);
      errorCount += Math.min(batchSize, docs.length - i);
    }
  }
  
  console.log('\n✅ Firestore cleanup completed!');
  console.log(`   Successfully deleted: ${successCount} documents`);
  
  if (errorCount > 0) {
    console.log(`   Failed to delete: ${errorCount} documents`);
  }
}

/**
 * Delete Storage files in parallel with rate limiting
 */
async function deleteStorageFiles(files: any[]) {
  let successCount = 0;
  let errorCount = 0;
  
  // Process in smaller batches to avoid overwhelming the Storage API
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    try {
      // Delete files in current batch in parallel
      await Promise.all(batch.map(async (file) => {
        try {
          await file.delete();
          successCount++;
        } catch (error) {
          console.error(`\n❌ Error deleting file ${file.name}:`, error);
          errorCount++;
        }
      }));
      
      // Show progress
      const progress = Math.min(100, Math.round(((i + batch.length) / files.length) * 100));
      process.stdout.write(`\r   Progress: ${i + batch.length}/${files.length} (${progress}%)`);
      
      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`\n❌ Error processing batch starting at file ${i}:`, error);
    }
  }
  
  console.log('\n✅ Storage cleanup completed!');
  console.log(`   Successfully deleted: ${successCount} files`);
  
  if (errorCount > 0) {
    console.log(`   Failed to delete: ${errorCount} files`);
  }
}

// Run the cleanup function
cleanupWallpapers(); 