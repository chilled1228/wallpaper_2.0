import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Log environment variables for debugging (only on server)
if (!isBrowser) {
  console.log('[R2 Config] Initializing with:');
  console.log('[R2 Config] ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT ? '✓ Set' : '✗ Not set');
  console.log('[R2 Config] ACCESS_KEY_ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set');
  console.log('[R2 Config] SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set');
  console.log('[R2 Config] BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images');
}

// Check if required environment variables are set
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images';
const PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

// Validate environment variables
const isConfigValid = !isBrowser && !!(CLOUDFLARE_R2_ENDPOINT && CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY);

if (!isConfigValid && !isBrowser) {
  console.error('[R2 Config] ERROR: Missing required environment variables for R2');
}

// Initialize S3 client with Cloudflare R2 credentials (only on server)
const s3Client = !isBrowser && isConfigValid ? new S3Client({
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
}) : null;

/**
 * Uploads a file to Cloudflare R2 storage
 * @param file The file to upload (can be File object or Buffer)
 * @param path The storage path where the file should be stored
 * @param contentType Optional content type (required if uploading a Buffer)
 * @returns Promise<string> The download URL for the uploaded image
 */
export async function uploadToR2(file: File | Buffer, path: string, contentType?: string): Promise<string> {
  try {
    // Check if we're in the browser
    if (isBrowser) {
      // Make an API call to upload the file instead of using the S3 client directly
      return uploadToR2ViaAPI(file, path, contentType);
    }
    
    // Check if R2 is properly configured
    if (!isConfigValid || !s3Client) {
      throw new Error(
        'Cloudflare R2 is not properly configured. Please check your environment variables: ' +
        'CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.'
      );
    }
    
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    let buffer: Buffer;
    let fileType: string;
    
    // Handle different file types (Browser File vs Node.js Buffer)
    if (Buffer.isBuffer(file)) {
      // Node.js Buffer
      buffer = file;
      fileType = contentType || 'application/octet-stream';
      
      if (!contentType) {
        console.warn('No content type provided for buffer upload. Using application/octet-stream as default');
      }
    } else {
      // Browser File object
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Supported types: JPG, PNG, GIF, WebP, SVG`);
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`);
      }
      
      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileType = file.type;
      
      console.log(`Uploading image to R2: name=${file.name}, type=${file.type}, size=${(file.size / 1024).toFixed(2)}KB to path=${path}`);
    }
    
    // Upload using multipart upload for larger files
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: path,
          Body: buffer,
          ContentType: fileType,
          Metadata: {
            uploadedAt: new Date().toISOString()
          },
          // Set cache control for optimal performance
          CacheControl: 'public, max-age=31536000', // 1 year cache
        },
        // Set specific upload parameters for better reliability
        queueSize: 4, // number of concurrent uploads
        partSize: 5 * 1024 * 1024, // 5MB part size
      });
      
      const result = await upload.done();
      console.log('Upload to R2 successful:', result.Key);
    } catch (uploadError: any) {
      console.error('R2 upload error details:', uploadError);
      
      // Handle common errors
      if (uploadError.name === 'NetworkError' || uploadError.code === 'NetworkingError' || 
          (uploadError.message && uploadError.message.includes('Load failed'))) {
        throw new Error(
          'Network error connecting to Cloudflare R2. Please check your internet connection and ' +
          'confirm your R2 endpoint is correct: ' + CLOUDFLARE_R2_ENDPOINT
        );
      }
      
      if (uploadError.name === 'AccessDenied' || uploadError.code === 'AccessDenied') {
        throw new Error(
          'Access denied to Cloudflare R2. Please check your access keys and permissions.'
        );
      }
      
      if (uploadError.name === 'NoSuchBucket' || uploadError.code === 'NoSuchBucket') {
        throw new Error(`Bucket "${BUCKET_NAME}" does not exist. Please create it in your Cloudflare R2 dashboard.`);
      }
      
      throw new Error(`R2 upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }
    
    // Return the public URL if a public domain is configured, otherwise generate a signed URL
    if (PUBLIC_DOMAIN) {
      return `${PUBLIC_DOMAIN}/${path}`;
    } else {
      // Generate a signed URL with extended expiration (1 week)
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 }); // 1 week
      return signedUrl;
    }
  } catch (error) {
    console.error('Error in uploadToR2 function:', error);
    throw error;
  }
}

/**
 * Upload a file to R2 via the API (for browser use)
 */
async function uploadToR2ViaAPI(file: File | Buffer, path: string, contentType?: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload');
  }
  
  // For browser uploads, we'll use the fetch API to send to our own endpoint
  let formData = new FormData();
  
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    const blob = new Blob([file], { type: contentType || 'application/octet-stream' });
    formData.append('file', blob);
  }
  
  formData.append('path', path);
  
  try {
    const response = await fetch('/api/storage/r2/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      let errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || 'Upload failed');
      } catch {
        throw new Error(`Upload failed: ${errorText || response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error in uploadToR2ViaAPI:', error);
    throw error;
  }
}

/**
 * Generates a presigned URL for direct browser uploads
 * @param key The storage key (path) for the file
 * @param contentType MIME type of the file
 * @returns Promise<string> The presigned URL for direct upload
 */
export async function generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
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
 * @param key The storage key (path) for the file
 * @returns Promise<string> The presigned URL for downloading
 */
export async function generatePresignedUrl(key: string): Promise<string> {
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

/**
 * Generates a unique storage path for a file
 * @param folder The folder name in storage
 * @param fileName The original file name
 * @returns A unique path including timestamp and sanitized filename
 */
export function generateR2Path(folder: string, fileName: string): string {
  // Sanitize the filename
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9-.]/g, '_');
  
  // Create a unique timestamp-based prefix
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  
  // Return full path
  return `${folder}/${timestamp}-${randomSuffix}-${sanitizedName}`;
} 