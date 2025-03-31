import { db, storage } from '../lib/firebase';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Deletes all wallpapers from both Firebase Storage and Firestore
 */
async function cleanupAllWallpapers() {
  console.log('🧹 Starting COMPLETE cleanup of wallpapers...');
  console.log('────────────────────────────────────────────────');
  
  // Step 1: Gather information about storage files
  let storageFiles: any[] = [];
  let firestoreDocuments: any[] = [];
  
  try {
    // Check storage
    console.log('📂 Checking Firebase Storage...');
    const wallpapersRef = ref(storage, 'wallpapers');
    const storageResult = await listAll(wallpapersRef);
    storageFiles = storageResult.items;
    
    console.log(`✅ Found ${storageFiles.length} files in Firebase Storage`);
    
    // Check Firestore
    console.log('\n📂 Checking Firestore database...');
    const wallpapersCollection = collection(db, 'wallpapers');
    const snapshot = await getDocs(query(wallpapersCollection));
    firestoreDocuments = snapshot.docs;
    
    console.log(`✅ Found ${firestoreDocuments.length} documents in Firestore`);
    
    // If nothing to delete
    if (storageFiles.length === 0 && firestoreDocuments.length === 0) {
      console.log('\n🎉 Nothing to clean up! Both Storage and Firestore are empty.');
      rl.close();
      return;
    }
    
    // Summary
    console.log('\n📋 Cleanup Summary:');
    console.log(`   - Storage files to delete: ${storageFiles.length}`);
    console.log(`   - Firestore documents to delete: ${firestoreDocuments.length}`);
    
    // Confirm before deletion
    rl.question(`\n⚠️  WARNING: This will delete ALL ${storageFiles.length} files from Storage and ALL ${firestoreDocuments.length} documents from Firestore.\nThis action CANNOT be undone.\n\nType 'DELETE-ALL' to confirm: `, async (answer) => {
      if (answer.trim() === 'DELETE-ALL') {
        // Delete Storage files
        if (storageFiles.length > 0) {
          console.log('\n🗑️  Step 1/2: Deleting files from Firebase Storage...');
          await deleteStorageFiles(storageFiles);
        }
        
        // Delete Firestore documents
        if (firestoreDocuments.length > 0) {
          console.log('\n🗑️  Step 2/2: Deleting documents from Firestore...');
          await deleteFirestoreDocuments(firestoreDocuments);
        }
        
        console.log('\n\n🎉 Complete cleanup finished successfully!');
      } else {
        console.log('\n🛑 Cleanup cancelled. Nothing was deleted.');
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup preparation:', error);
    rl.close();
  }
}

async function deleteStorageFiles(files: any[]) {
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const itemRef = files[i];
    try {
      await deleteObject(itemRef);
      successCount++;
      
      // Show progress every 10 items or at the end
      if (i % 10 === 0 || i === files.length - 1) {
        process.stdout.write(`\r   Progress: ${i + 1}/${files.length} (${Math.round(((i + 1) / files.length) * 100)}%)`);
      }
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error deleting ${itemRef.name}:`, error);
    }
  }
  
  console.log('\n\n✅ Storage cleanup completed!');
  console.log(`   Successfully deleted: ${successCount} files`);
  
  if (errorCount > 0) {
    console.log(`   Failed to delete: ${errorCount} files`);
  }
}

async function deleteFirestoreDocuments(documents: any[]) {
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < documents.length; i++) {
    const docSnapshot = documents[i];
    try {
      await deleteDoc(doc(db, 'wallpapers', docSnapshot.id));
      successCount++;
      
      // Show progress every 10 items or at the end
      if (i % 10 === 0 || i === documents.length - 1) {
        process.stdout.write(`\r   Progress: ${i + 1}/${documents.length} (${Math.round(((i + 1) / documents.length) * 100)}%)`);
      }
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error deleting document ${docSnapshot.id}:`, error);
    }
  }
  
  console.log('\n\n✅ Firestore cleanup completed!');
  console.log(`   Successfully deleted: ${successCount} records`);
  
  if (errorCount > 0) {
    console.log(`   Failed to delete: ${errorCount} records`);
  }
}

// Run the cleanup function
cleanupAllWallpapers(); 