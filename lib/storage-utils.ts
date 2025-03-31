import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';
import { uploadToR2, generateR2Path } from './cloudflare-r2';

// Define content types that should use R2 storage
const R2_FOLDER_PREFIXES = ['wallpaper-images', 'wallpapers', 'prompt-images'];

/**
 * Checks if the given path should use R2 storage
 * @param path The storage path
 * @returns boolean indicating if R2 should be used
 */
function shouldUseR2(path: string): boolean {
  // Determine if this path matches any R2 folder prefixes
  return R2_FOLDER_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * Uploads an image to the appropriate storage system (Firebase or R2)
 * and returns the download URL
 * @param file The file to upload
 * @param path The storage path where the file should be stored
 * @returns Promise<string> The download URL for the uploaded image
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
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
    
    // Check if this path should use R2
    if (shouldUseR2(path)) {
      console.log(`Using Cloudflare R2 for upload to path: ${path}`);
      return uploadToR2(file, path, file.type);
    }
    
    // Otherwise use Firebase Storage
    console.log(`Using Firebase Storage for upload: name=${file.name}, type=${file.type}, size=${(file.size / 1024).toFixed(2)}KB to path=${path}`);
    
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload the file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log('Starting upload with metadata:', metadata);
    
    let snapshot: UploadResult;
    try {
      snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Upload successful:', snapshot.metadata.name);
    } catch (uploadError: any) {
      console.error('Upload failed:', uploadError);
      if (uploadError.code === 'storage/unauthorized') {
        throw new Error('Upload permission denied');
      } else if (uploadError.code === 'storage/canceled') {
        throw new Error('Upload was canceled');
      } else if (uploadError.code === 'storage/unknown') {
        throw new Error('Upload failed: Unknown error. Check your network connection');
      }
      throw new Error(`Upload failed: ${uploadError.message || 'Storage error'}`);
    }
    
    // Get the download URL
    let downloadURL: string;
    try {
      downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained successfully');
    } catch (urlError: any) {
      console.error('Failed to get download URL:', urlError);
      throw new Error('Upload completed but failed to get download URL');
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error in uploadImage function:', error);
    throw error;
  }
}

/**
 * Generates a unique storage path for a file
 * @param folder The folder name in storage
 * @param fileName The original file name
 * @returns A unique path including timestamp and sanitized filename
 */
export function generateStoragePath(folder: string, fileName: string): string {
  // Check if this folder should use R2
  if (shouldUseR2(folder)) {
    return generateR2Path(folder, fileName);
  }
  
  // Sanitize the filename
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9-.]/g, '_');
  
  // Create a unique timestamp-based prefix
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Return full path
  return `${folder}/${timestamp}-${randomSuffix}-${sanitizedName}`;
} 