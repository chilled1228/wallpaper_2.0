import { NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'wallpapers/' });
    
    // Delete files
    for (const file of files) {
      await file.delete();
    }
    
    // Delete Firestore documents
    const wallpapersSnap = await db.collection('wallpapers').get();
    
    // Use batched writes for better performance
    const batchSize = 500;
    const batches = [];
    let batch = db.batch();
    let operationCount = 0;
    
    wallpapersSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
      batch.delete(doc.ref);
      operationCount++;
      
      if (operationCount === batchSize) {
        batches.push(batch.commit());
        batch = db.batch();
        operationCount = 0;
      }
    });
    
    if (operationCount > 0) {
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    
    return NextResponse.json({
      success: true,
      filesDeleted: files.length,
      documentsDeleted: wallpapersSnap.docs.length
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 