'use client';

/**
 * Checks if a URL is from Cloudflare R2
 * @param url The URL to check
 * @returns boolean indicating if the URL is from R2
 */
export function isR2Url(url: string): boolean {
  if (!url) return false;
  
  const r2PublicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN;
  return r2PublicDomain ? url.includes(r2PublicDomain) : 
    url.includes('.r2.dev') || url.includes('.cloudflarestorage.com');
}

/**
 * Extracts the filename from an R2 URL
 * @param url The R2 URL
 * @returns The filename
 */
export function getFilenameFromR2Url(url: string): string {
  if (!url) return 'image.jpg';
  
  // Remove query parameters if any
  const cleanUrl = url.split('?')[0];
  
  // Extract the last part of the path
  const parts = cleanUrl.split('/');
  return parts[parts.length - 1] || 'image.jpg';
}

/**
 * Downloads an image from an R2 URL
 * @param url The R2 URL
 * @param filename Optional custom filename for the download
 */
export async function downloadR2Image(url: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Use provided filename or extract from URL
    const downloadFilename = filename || getFilenameFromR2Url(url);
    
    // Create a download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading R2 image:', error);
    throw error;
  }
}

/**
 * Generates an optimized R2 URL with transformation parameters
 * @param url The original R2 URL
 * @param width Desired width
 * @param quality Image quality (1-100)
 * @returns The optimized URL
 */
export function getOptimizedR2Url(url: string, width?: number, quality?: number): string {
  if (!url || !isR2Url(url)) return url;
  
  // Check if the URL already has query parameters
  const hasParams = url.includes('?');
  const separator = hasParams ? '&' : '?';
  
  // Build optimization parameters
  const params: string[] = [];
  
  if (width) {
    params.push(`width=${width}`);
  }
  
  if (quality && quality > 0 && quality <= 100) {
    params.push(`quality=${quality}`);
  }
  
  // Return original URL if no optimization parameters
  if (params.length === 0) return url;
  
  // Append parameters to URL
  return `${url}${separator}${params.join('&')}`;
} 