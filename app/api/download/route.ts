import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Validate that the URL is from our R2 storage
    if (!url.includes('.r2.cloudflarestorage.com')) {
      return new NextResponse('Invalid storage URL', { status: 400 });
    }

    // Fetch the image from R2
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Create a new response with the image data and appropriate headers
    const imageData = await response.arrayBuffer();
    
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Failed to download image', { status: 500 });
  }
} 