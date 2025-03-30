import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { z } from 'zod'

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

const auth = getAuth(firebaseAdmin);
const db = getFirestore(firebaseAdmin);

// Function to generate URL-friendly slug
async function generateUniqueSlug(title: string, db: FirebaseFirestore.Firestore): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens

  // Check if the base slug exists
  const snapshot = await db.collection('wallpapers')
    .where('slug', '>=', baseSlug)
    .where('slug', '<=', baseSlug + '\uf8ff')
    .get();

  if (snapshot.empty) {
    return baseSlug;
  }

  // Find the highest number suffix
  const existingSlugs = snapshot.docs.map(doc => doc.data().slug);
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }

  return newSlug;
}

// Validation schemas
const ImageMetadataSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  caption: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal(''))
});

export const WallpaperSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must not exceed 500 characters'),
  promptText: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url('Invalid main image URL'),
  imageMetadata: ImageMetadataSchema.optional().or(z.null()),
  additionalImages: z.array(ImageMetadataSchema).max(5, 'Maximum 5 additional images allowed').optional().or(z.array(z.any())).default([]),
  isPublic: z.boolean().default(true),
  price: z.coerce.number().min(0).default(0),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  featured: z.boolean().default(false),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export async function POST(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user claims
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user exists and is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse and validate the request body
    const rawData = await request.json();
    console.log('POST: Received wallpaper data:', JSON.stringify(rawData, null, 2));
    
    try {
      const validatedData = WallpaperSchema.safeParse(rawData);
      
      if (!validatedData.success) {
        // Format Zod validation errors into a more readable format
        const formattedErrors = validatedData.error.format();
        console.error('Validation errors:', formattedErrors);
        
        // Convert Zod errors to readable string
        const errorMessages = validatedData.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        
        return NextResponse.json({ 
          error: 'Validation error', 
          details: errorMessages,
          validationErrors: formattedErrors
        }, { status: 400 });
      }
      
      const { 
        id, 
        title, 
        description, 
        promptText, 
        category, 
        imageUrl,
        imageMetadata,
        additionalImages,
        isPublic,
        price,
        status,
        featured,
        slug: providedSlug
      } = validatedData.data;

      // If id is provided, update existing wallpaper
      if (id) {
        const wallpaperRef = db.collection('wallpapers').doc(id);
        const wallpaperDoc = await wallpaperRef.get();
        
        if (!wallpaperDoc.exists) {
          return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
        }

        const currentData = wallpaperDoc.data();
        
        // Only generate new slug if title has changed
        let newSlug = id;
        if (currentData?.title !== title) {
          newSlug = await generateUniqueSlug(title, db);
          
          if (newSlug !== id) {
            // Create new document with new slug
            const newWallpaperRef = db.collection('wallpapers').doc(newSlug);
            
            // Copy data to new document with updated fields
            await newWallpaperRef.set({
              ...currentData,
              title,
              description,
              promptText,
              category,
              imageUrl,
              imageMetadata,
              additionalImages,
              isPublic,
              price,
              status,
              featured,
              updatedAt: new Date().toISOString(),
              updatedBy: decodedToken.uid,
              slug: newSlug,
            });
            
            // Delete old document
            await wallpaperRef.delete();
            
            return NextResponse.json({ 
              success: true, 
              message: 'Wallpaper updated successfully',
              wallpaperId: newSlug,
              slug: newSlug
            });
          }
        }
        
        // Update existing document if slug hasn't changed
        await wallpaperRef.update({
          title,
          description,
          promptText,
          category,
          imageUrl,
          imageMetadata,
          additionalImages,
          isPublic,
          price,
          status,
          featured,
          updatedAt: new Date().toISOString(),
          updatedBy: decodedToken.uid,
          slug: newSlug,
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Wallpaper updated successfully',
          wallpaperId: newSlug,
          slug: newSlug
        });
      }

      // Create new wallpaper
      // Use provided slug or generate a new one
      const slug = providedSlug || await generateUniqueSlug(title, db);
      console.log('Generated slug:', slug);
      
      const wallpaperRef = db.collection('wallpapers').doc(slug);
      
      try {
        const wallpaperData = {
          title,
          description,
          promptText,
          category,
          imageUrl,
          imageMetadata,
          additionalImages,
          isPublic,
          price,
          status,
          featured,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: decodedToken.uid,
          views: 0,
          favorites: 0,
          slug,
          version: 1,
        };
        
        console.log('Creating wallpaper with data:', wallpaperData);
        await wallpaperRef.set(wallpaperData);
        console.log('Wallpaper successfully created with slug:', slug);

        return NextResponse.json({ 
          success: true, 
          message: 'Wallpaper created successfully',
          wallpaperId: slug,
          slug
        });
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        return NextResponse.json({ 
          error: 'Database error', 
          details: firestoreError instanceof Error ? firestoreError.message : 'Failed to save wallpaper to database'
        }, { status: 500 });
      }

    } catch (validationError: any) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ 
        error: 'Validation error', 
        details: validationError.message || 'Invalid data',
        stack: process.env.NODE_ENV === 'development' ? validationError.stack : undefined
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Individual Wallpaper Operations
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user claims
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user exists and is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Wallpaper ID is required' }, { status: 400 });
    }

    const wallpaperRef = db.collection('wallpapers').doc(id);
    const wallpaperDoc = await wallpaperRef.get();
    
    if (!wallpaperDoc.exists) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      wallpaper: {
        id: wallpaperDoc.id,
        ...wallpaperDoc.data()
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user claims
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user exists and is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Wallpaper ID is required' }, { status: 400 });
    }

    const wallpaperRef = db.collection('wallpapers').doc(id);
    const wallpaperDoc = await wallpaperRef.get();
    
    if (!wallpaperDoc.exists) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    await wallpaperRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Wallpaper deleted successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 