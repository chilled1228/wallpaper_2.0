import { db } from '../lib/firebase';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Deletes all wallpapers from Firestore database
 */
async function cleanupWallpaperFirestore() {
  console.log('🧹 Starting cleanup of wallpapers in Firestore database...');
  
  try {
    // Create a reference to the wallpapers collection
    const wallpapersCollection = collection(db, 'wallpapers');
    
    // Get all documents from the wallpapers collection
    console.log('📂 Fetching all wallpaper documents from Firestore...');
    const snapshot = await getDocs(query(wallpapersCollection));
    
    if (snapshot.empty) {
      console.log('✅ No wallpapers found in Firestore. Nothing to clean up!');
      rl.close();
      return;
    }
    
    const wallpapers = snapshot.docs;
    console.log(`\n📋 Found ${wallpapers.length} wallpapers in Firestore:`);
    
    // Log the first 10 wallpapers to give a sense of what will be deleted
    wallpapers.slice(0, 10).forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      console.log(`   ${index + 1}. ID: ${docSnapshot.id} - Title: ${data.title || 'Untitled'}`);
    });
    
    if (wallpapers.length > 10) {
      console.log(`   ... and ${wallpapers.length - 10} more records`);
    }
    
    // Confirm before deletion
    rl.question(`\n⚠️  WARNING: You are about to delete ${wallpapers.length} wallpaper records from Firestore. This action cannot be undone.\n\nType 'DELETE' to confirm: `, async (answer) => {
      if (answer.trim() === 'DELETE') {
        console.log('\n🗑️  Deleting wallpaper records...');
        
        let successCount = 0;
        let errorCount = 0;
        
        // Delete each document with a progress indicator
        for (let i = 0; i < wallpapers.length; i++) {
          const docSnapshot = wallpapers[i];
          try {
            await deleteDoc(doc(db, 'wallpapers', docSnapshot.id));
            successCount++;
            
            // Show progress every 10 items or at the end
            if (i % 10 === 0 || i === wallpapers.length - 1) {
              process.stdout.write(`\r   Progress: ${i + 1}/${wallpapers.length} (${Math.round(((i + 1) / wallpapers.length) * 100)}%)`);
            }
          } catch (error) {
            errorCount++;
            console.error(`\n❌ Error deleting document ${docSnapshot.id}:`, error);
          }
        }
        
        console.log('\n\n✅ Cleanup completed!');
        console.log(`   Successfully deleted: ${successCount} records`);
        
        if (errorCount > 0) {
          console.log(`   Failed to delete: ${errorCount} records`);
        }
      } else {
        console.log('\n🛑 Cleanup cancelled. No records were deleted.');
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    rl.close();
  }
}

// Run the cleanup function
cleanupWallpaperFirestore(); 