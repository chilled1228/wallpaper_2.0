import { NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert, getApps } from 'firebase-admin/app'

// Initialize Firebase Admin
if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
  throw new Error('Firebase Admin environment variables are missing');
}

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin app if not already initialized
const firebaseAdmin = 
  getApps().length === 0 
    ? initializeApp({
        credential: cert(firebaseAdminConfig),
      })
    : getApps()[0];

const db = getFirestore(firebaseAdmin);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Public wallpaper access for ID:', params.id);
    
    // First, try to fetch directly by ID
    let wallpaperDoc = await db.collection('wallpapers').doc(params.id).get();
    
    // If not found by ID, try to find by slug
    if (!wallpaperDoc.exists) {
      console.log('Wallpaper not found by ID, checking by slug');
      
      const slugQuery = await db.collection('wallpapers')
        .where('slug', '==', params.id)
        .limit(1)
        .get();
      
      if (!slugQuery.empty) {
        wallpaperDoc = slugQuery.docs[0];
      } else {
        return NextResponse.json({ 
          error: 'Wallpaper not found' 
        }, { status: 404 });
      }
    }

    // Wallpaper found, return it
    const wallpaperData = wallpaperDoc.data();
    
    console.log('Found wallpaper:', {
      id: wallpaperDoc.id,
      isPublic: wallpaperData?.isPublic,
      status: wallpaperData?.status
    });
    
    return NextResponse.json({ 
      success: true, 
      wallpaper: {
        id: wallpaperDoc.id,
        ...wallpaperData
      }
    });
  } catch (error) {
    console.error('Error fetching wallpaper:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch wallpaper',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 