import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/firebase';

// Log environment variables for debugging (without sensitive values)
console.log('[R2 API] Initializing with:');
console.log('[R2 API] ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT ? '✓ Set' : '✗ Not set');
console.log('[R2 API] ACCESS_KEY_ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set');
console.log('[R2 API] SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set');
console.log('[R2 API] BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images');

// Check if R2 is properly configured
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images';
const PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

// Validate environment variables
const isConfigValid = !!(CLOUDFLARE_R2_ENDPOINT && CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY);

if (!isConfigValid) {
  console.error('[R2 API] ERROR: Missing required environment variables for R2');
}

// Initialize S3 client with Cloudflare R2 credentials (only if configured)
const s3Client = isConfigValid
  ? new S3Client({
      region: 'auto',
      endpoint: CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      // Fix for "Resolved credential object is not valid" error
      forcePathStyle: true, // Required for Cloudflare R2
      // @ts-ignore - AWS SDK types don't include this property but it's needed for R2
      signatureVersion: 'v4', 
    })
  : null;

// Schema for presigned URL request
const PresignedUrlSchema = z.object({
  key: z.string().min(1, "Storage key is required"),
});

// Schema for listing objects request
const ListObjectsSchema = z.object({
  prefix: z.string().optional(),
  maxKeys: z.number().optional(),
  continuationToken: z.string().optional(),
});

/**
 * GET handler for generating presigned URLs and listing objects
 */
export async function GET(request: NextRequest) {
  try {
    // Check if R2 is properly configured
    if (!isConfigValid) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not properly configured. Please set up your environment variables.' },
        { status: 500 }
      );
    }
    
    // Check if S3 client was initialized
    if (!s3Client) {
      return NextResponse.json(
        { error: 'Failed to initialize S3 client for Cloudflare R2.' },
        { status: 500 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    // Handle different actions
    switch (action) {
      case 'getSignedUrl': {
        const key = searchParams.get('key');
        if (!key) {
          return NextResponse.json({ error: 'Storage key is required' }, { status: 400 });
        }
        
        // Generate a signed URL
        const url = await generatePresignedUrl(key);
        return NextResponse.json({ url });
      }
      
      case 'listObjects': {
        // Parse and validate request parameters
        const prefix = searchParams.get('prefix') || '';
        const maxKeys = parseInt(searchParams.get('maxKeys') || '100');
        const continuationToken = searchParams.get('continuationToken') || undefined;
        
        // List objects in bucket
        const data = await listObjects(prefix, maxKeys, continuationToken);
        return NextResponse.json(data);
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('R2 API error:', error);
    
    // Better error handling
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common R2 connection errors
      if (error.message.includes('Load failed') || error.message.includes('NetworkError')) {
        errorMessage = 'Failed to connect to Cloudflare R2. Please check your endpoint and network connection.';
      } else if (error.name === 'AccessDenied' || error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied to Cloudflare R2. Please check your access keys and permissions.';
        statusCode = 403;
      } else if (error.name === 'NoSuchBucket' || error.message.includes('NoSuchBucket')) {
        errorMessage = `Bucket "${BUCKET_NAME}" does not exist. Please create it in your Cloudflare R2 dashboard.`;
        statusCode = 404;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * POST handler for generating presigned upload URLs
 */
export async function POST(request: NextRequest) {
  try {
    // Check if R2 is properly configured
    if (!isConfigValid) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not properly configured. Please set up your environment variables.' },
        { status: 500 }
      );
    }
    
    // Check if S3 client was initialized
    if (!s3Client) {
      return NextResponse.json(
        { error: 'Failed to initialize S3 client for Cloudflare R2.' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { key, contentType } = body;
    
    if (!key || !contentType) {
      return NextResponse.json({ error: 'Key and contentType are required' }, { status: 400 });
    }
    
    // Get presigned URL for upload
    const url = await generatePresignedUploadUrl(key, contentType);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('R2 API error:', error);
    
    // Better error handling
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common R2 connection errors
      if (error.message.includes('Load failed') || error.message.includes('NetworkError')) {
        errorMessage = 'Failed to connect to Cloudflare R2. Please check your endpoint and network connection.';
      } else if (error.name === 'AccessDenied' || error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied to Cloudflare R2. Please check your access keys and permissions.';
        statusCode = 403;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * Lists objects in a bucket with optional prefix and pagination
 */
async function listObjects(prefix: string, maxKeys: number = 100, continuationToken?: string) {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  });
  
  const response = await s3Client.send(command);
  
  // If using public domain, transform object keys to full URLs
  const objects = response.Contents || [];
  const items = objects.map(obj => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
    url: PUBLIC_DOMAIN ? `${PUBLIC_DOMAIN}/${obj.Key}` : null,
  }));
  
  return {
    items,
    nextContinuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated,
  };
}

/**
 * Generates a presigned URL for direct browser uploads
 */
async function generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year cache
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour to complete the upload
}

/**
 * Generates a presigned URL for downloading/viewing files
 */
async function generatePresignedUrl(key: string): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  // If a public domain is configured, just use that
  if (PUBLIC_DOMAIN) {
    return `${PUBLIC_DOMAIN}/${key}`;
  }
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  // Extended expiration for viewing URLs (24 hours)
  return getSignedUrl(s3Client, command, { expiresIn: 86400 });
} 