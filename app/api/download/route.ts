import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const wallpaperId = searchParams.get('id'); // Optional wallpaper ID for analytics

    if (!url) {
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Validate that the URL is from our R2 storage or other allowed sources
    const isR2Url = url.includes('.r2.cloudflarestorage.com');
    const isAllowedUrl = isR2Url || url.startsWith('/') || url.startsWith(process.env.NEXT_PUBLIC_SITE_URL || '');
    
    if (!isAllowedUrl) {
      return new NextResponse('Invalid storage URL', { status: 400 });
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        // Add cache control for CDN optimization
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the content type and other important headers from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Create a new response with the image data and appropriate headers
    const imageData = await response.arrayBuffer();
    
    // Use a record type to allow dynamic header names
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': 'attachment',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
    
    // Add content length if available
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }
    
    return new NextResponse(imageData, { headers });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Failed to download image', { status: 500 });
  }
} 