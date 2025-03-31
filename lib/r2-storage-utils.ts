import { PutObjectCommand } from '@aws-sdk/client-s3';
import { R2_CLIENT, WALLPAPER_BUCKET, PROMPT_BUCKET, getR2PublicUrl } from './cloudflare';

export async function uploadToR2(file: File, path: string): Promise<string> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: JPG, PNG, GIF, WebP`);
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`);
    }

    // Determine bucket based on path
    const bucket = path.includes('wallpapers') ? WALLPAPER_BUCKET : PROMPT_BUCKET;
    
    // Create a unique key for the file
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const key = `${timestamp}-${sanitizedName}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    await R2_CLIENT.send(command);
    
    // Return the public URL
    return getR2PublicUrl(key, bucket);
  } catch (error) {
    console.error('Error in uploadToR2:', error);
    throw error;
  }
}

export function isR2Path(path: string): boolean {
  return path.includes('wallpapers') || path.includes('prompt-images');
} 