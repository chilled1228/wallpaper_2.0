import { NextRequest, NextResponse } from 'next/server';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * GET handler for checking R2 configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    
    // Prepare status object
    const status = {
      endpoint: !!endpoint,
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
      bucketName: !!bucketName,
      publicDomain: !!publicDomain,
      bucketExists: false
    };
    
    // Fast response if missing critical config
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ status });
    }
    
    // Check if bucket exists by attempting to connect to R2
    try {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: accessKeyId || '',
          secretAccessKey: secretAccessKey || '',
        },
        forcePathStyle: true,
      });
      
      if (bucketName) {
        const command = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(command);
        status.bucketExists = true;
      }
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      // We keep bucketExists as false
    }
    
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error checking R2 configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check R2 configuration' },
      { status: 500 }
    );
  }
} 