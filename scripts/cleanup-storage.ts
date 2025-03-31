import { storage } from '../lib/firebase';
import { ref, listAll, deleteObject } from 'firebase/storage';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Deletes all wallpapers from Firebase Storage in the 'wallpapers' folder
 */
async function cleanupWallpaperStorage() {
  console.log('🧹 Starting cleanup of wallpapers in Firebase Storage...');
  
  try {
    // Create a reference to the wallpapers folder
    const wallpapersRef = ref(storage, 'wallpapers');
    
    // List all items in the wallpapers folder
    console.log('📂 Listing all files in wallpapers folder...');
    const result = await listAll(wallpapersRef);
    
    if (result.items.length === 0) {
      console.log('✅ No wallpapers found in storage. Nothing to clean up!');
      rl.close();
      return;
    }
    
    console.log(`\n📋 Found ${result.items.length} wallpapers in storage:`);
    // Log the first 10 files to give a sense of what will be deleted
    result.items.slice(0, 10).forEach((itemRef, index) => {
      console.log(`   ${index + 1}. ${itemRef.name}`);
    });
    
    if (result.items.length > 10) {
      console.log(`   ... and ${result.items.length - 10} more files`);
    }
    
    // Confirm before deletion
    rl.question(`\n⚠️  WARNING: You are about to delete ${result.items.length} wallpapers from Firebase Storage. This action cannot be undone.\n\nType 'DELETE' to confirm: `, async (answer) => {
      if (answer.trim() === 'DELETE') {
        console.log('\n🗑️  Deleting wallpapers...');
        
        let successCount = 0;
        let errorCount = 0;
        
        // Delete each item with a progress indicator
        for (let i = 0; i < result.items.length; i++) {
          const itemRef = result.items[i];
          try {
            await deleteObject(itemRef);
            successCount++;
            
            // Show progress every 10 items or at the end
            if (i % 10 === 0 || i === result.items.length - 1) {
              process.stdout.write(`\r   Progress: ${i + 1}/${result.items.length} (${Math.round(((i + 1) / result.items.length) * 100)}%)`);
            }
          } catch (error) {
            errorCount++;
            console.error(`\n❌ Error deleting ${itemRef.name}:`, error);
          }
        }
        
        console.log('\n\n✅ Cleanup completed!');
        console.log(`   Successfully deleted: ${successCount} files`);
        
        if (errorCount > 0) {
          console.log(`   Failed to delete: ${errorCount} files`);
        }
      } else {
        console.log('\n🛑 Cleanup cancelled. No files were deleted.');
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    rl.close();
  }
}

// Run the cleanup function
cleanupWallpaperStorage(); 