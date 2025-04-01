import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Define interface for wallpaper data
interface Wallpaper {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description?: string;
  isPublic?: boolean;
  status?: string;
  slug?: string;
  [key: string]: any; // Allow for other properties
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const limitParam = parseInt(searchParams.get('limit') || '4', 10);
    
    console.log('Related wallpapers request:', { id, category, limitParam });
    
    if (!id || !category) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, category' },
        { status: 400 }
      );
    }

    // Try first with just the category filter to avoid composite index issues
    const categoryQuery = await db.collection('wallpapers')
      .where('category', '==', category)
      .limit(25)
      .get();

    console.log(`Found ${categoryQuery.docs.length} wallpapers in category "${category}"`);
    
    // Filter out only the current wallpaper but accept any status
    let wallpapers = categoryQuery.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Wallpaper))
      .filter(wallpaper => wallpaper.id !== id) // Only filter by ID, not by isPublic
      .slice(0, limitParam);
      
    console.log(`After filtering: ${wallpapers.length} wallpapers excluding current ID`);

    // If not enough results, try a more general query
    if (wallpapers.length < limitParam) {
      console.log(`Not enough results, trying general query...`);
      
      // Get any wallpapers without any filters except exclusion of current ID
      const generalQuery = await db.collection('wallpapers')
        .limit(50)
        .get();
      
      console.log(`General query found ${generalQuery.docs.length} wallpapers`);
      
      const generalWallpapers = generalQuery.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Wallpaper))
        .filter(wallpaper => 
          wallpaper.id !== id && 
          !wallpapers.some(w => w.id === wallpaper.id)
        )
        .slice(0, limitParam - wallpapers.length);
        
      console.log(`General query added ${generalWallpapers.length} more wallpapers`);
      wallpapers = [...wallpapers, ...generalWallpapers];
    }

    console.log(`Returning ${wallpapers.length} related wallpapers`);
    
    // Add a sample of the first wallpaper to help debug
    if (wallpapers.length > 0) {
      const sample = {
        id: wallpapers[0].id,
        title: wallpapers[0].title,
        category: wallpapers[0].category,
        imageUrl: wallpapers[0].imageUrl?.substring(0, 30) + '...',
      };
      console.log('Sample wallpaper:', sample);
    }

    return NextResponse.json({ wallpapers });
  } catch (error) {
    console.error('Error fetching related wallpapers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related wallpapers' },
      { status: 500 }
    );
  }
} 