import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/firebase';

// Configure R2 client
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images';
const PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

// Validate configuration
const isConfigValid = !!(CLOUDFLARE_R2_ENDPOINT && CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY);

// Initialize S3 client
const s3Client = isConfigValid ? new S3Client({
  region: 'auto',
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Verify R2 configuration
    if (!isConfigValid || !s3Client) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not properly configured' },
        { status: 500 }
      );
    }

    // Process the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    
    if (!file || !path) {
      return NextResponse.json(
        { error: 'File and path are required' },
        { status: 400 }
      );
    }
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB` },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported types: JPG, PNG, GIF, WebP, SVG` },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`API: Uploading file to R2: ${path}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
    
    // Upload to R2
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: path,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            uploadedAt: new Date().toISOString(),
            originalFilename: file.name
          },
          CacheControl: 'public, max-age=31536000', // 1 year cache
        },
        queueSize: 4, // number of concurrent uploads
        partSize: 5 * 1024 * 1024, // 5MB part size
      });
      
      const result = await upload.done();
      console.log('API: Upload to R2 successful:', result.Key);
      
      // Generate URL for the uploaded file
      let url: string;
      
      if (PUBLIC_DOMAIN) {
        url = `${PUBLIC_DOMAIN}/${path}`;
      } else {
        // Generate a signed URL
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: path
        });
        
        url = await getSignedUrl(s3Client, command, { expiresIn: 604800 }); // 1 week
      }
      
      return NextResponse.json({ url });
    } catch (uploadError: any) {
      console.error('API: R2 upload error:', uploadError);
      
      // Better error messages for common issues
      if (uploadError.name === 'NetworkError' || uploadError.code === 'NetworkingError' || uploadError.message?.includes('Load failed')) {
        return NextResponse.json(
          { error: 'Network error connecting to Cloudflare R2. Please check your internet connection and R2 endpoint.' },
          { status: 500 }
        );
      }
      
      if (uploadError.name === 'AccessDenied' || uploadError.code === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Access denied to Cloudflare R2. Please check your access keys and permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file to R2' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API: Error in R2 upload route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 