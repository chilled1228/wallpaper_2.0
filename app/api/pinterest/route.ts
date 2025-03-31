import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token server-side
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      
      // Check if user is in the admin collection
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get search query from the URL
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Construct Pinterest API URL
    // Note: You'll need to set up proper API keys in your environment variables
    const apiUrl = `https://api.pinterest.com/v5/pins/search?query=${encodeURIComponent(query)}&page_size=10`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Pinterest API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to a simplified format
    const wallpapers = data.items?.map((pin: any) => ({
      id: pin.id,
      title: pin.title || query,
      description: pin.description || '',
      imageUrl: pin.image?.original?.url,
      sourceUrl: `https://pinterest.com/pin/${pin.id}/`,
      tags: pin.hashtags || []
    })) || [];

    return NextResponse.json({ wallpapers });
  } catch (error) {
    console.error('Pinterest API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 