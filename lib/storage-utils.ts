import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';
import { uploadToR2, isR2Path } from './r2-storage-utils';

/**
 * Uploads an image to Firebase Storage and returns the download URL
 * @param file The file to upload
 * @param path The storage path where the file should be stored
 * @returns Promise<string> The download URL for the uploaded image
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // Check if this should go to R2
    if (isR2Path(path)) {
      return await uploadToR2(file, path);
    }

    // If not R2, use Firebase Storage
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
    
    console.log(`Uploading image: name=${file.name}, type=${file.type}, size=${(file.size / 1024).toFixed(2)}KB to path=${path}`);
    
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
        throw new Error('Upload failed: You do not have permission to upload files');
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
  // Sanitize file name to remove any potential problematic characters
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace any non-alphanumeric char with underscore
    .toLowerCase();
    
  // Generate a unique file name with timestamp to avoid collisions
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${sanitizedName}`;
  
  return `${folder}/${uniqueFileName}`;
} 