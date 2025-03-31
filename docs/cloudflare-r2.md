# Cloudflare R2 Integration

This document explains how the Cloudflare R2 integration works in this application.

## Overview

Cloudflare R2 is used as an optimized storage solution specifically for wallpaper and prompt images to:

1. Improve image delivery performance
2. Reduce storage costs
3. Provide better caching and CDN capabilities
4. Enable smooth downloads for users

Firebase Storage is still used for other types of content like blog images.

## Implementation Details

### Architecture

The integration uses a hybrid storage approach:

- **Cloudflare R2**: Used for wallpaper and prompt images
- **Firebase Storage**: Used for blog images and other content

The system automatically routes uploads to the appropriate storage backend based on the folder path.

### Key Components

1. **R2 Client (`lib/cloudflare-r2.ts`)**
   - Handles direct interaction with Cloudflare R2
   - Manages uploads, signed URLs, and path generation

2. **Storage Utilities (`lib/storage-utils.ts`)**
   - Provides a unified API for uploads regardless of backend
   - Routes requests to Firebase or R2 based on content type

3. **R2 Image Component (`components/ui/r2-image.tsx`)**
   - Optimized image component for R2-stored images 
   - Handles loading states and provides download functionality

4. **R2 Upload Hook (`hooks/useR2Upload.tsx`)**
   - Custom React hook for simplified integration with forms
   - Provides progress feedback and error handling

5. **R2 API Endpoints (`app/api/storage/r2/route.ts`)**
   - Server-side API for R2 operations
   - Handles listing objects and generating presigned URLs

6. **Admin Interface (`app/admin/storage/r2/page.tsx`)**
   - Admin dashboard for R2 storage management
   - Upload testing, browsing, and monitoring

### Configuration

The application uses the following environment variables:

```
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
CLOUDFLARE_R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
CLOUDFLARE_R2_BUCKET_NAME="wallpaper-images"
CLOUDFLARE_R2_PUBLIC_DOMAIN="https://pub-<hash>.r2.dev" # Optional, for public URLs
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN="pub-<hash>.r2.dev" # Without protocol for Next.js images
```

## Usage Guide

### In React Components

To use R2 for image uploads:

```tsx
import { R2ImageUpload } from '@/components/wallpaper/r2-image-upload';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  return (
    <R2ImageUpload
      onChange={(url) => setImageUrl(url)}
      onRemove={() => setImageUrl(null)}
      value={imageUrl}
      folder="wallpaper-images" // Optional, defaults to wallpaper-images
    />
  );
}
```

To display R2-hosted images with download capability:

```tsx
import { R2Image } from '@/components/ui/r2-image';

function MyComponent({ imageUrl }: { imageUrl: string }) {
  return (
    <R2Image
      src={imageUrl}
      alt="My image"
      width={1200}
      height={800}
      showDownload={true}
      downloadFileName="my-image.jpg" // Optional
    />
  );
}
```

### Using the useR2Upload Hook

For more control over the upload process:

```tsx
import { useR2Upload } from '@/hooks/useR2Upload';

function MyUploadComponent() {
  const { upload, isUploading, error, progress } = useR2Upload({
    folder: 'wallpaper-images',
    maxSize: 10, // MB
    onSuccess: (url) => console.log('Upload success:', url),
    onError: (err) => console.error('Upload failed:', err)
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = await upload(file);
      console.log('Uploaded image URL:', imageUrl);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {isUploading && <progress value={progress} max="100" />}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Migration Tools

A migration script is provided to move existing images from Firebase Storage to Cloudflare R2:

```bash
npm run migrate:to-r2
```

The script can be found in `scripts/migrate-to-r2.js`.

## Performance Considerations

1. **Caching**: R2-stored images have a 1-year cache policy for optimal performance.
2. **Size Limits**: Maximum file size is 10MB per image.
3. **Content Types**: The system accepts JPG, PNG, GIF, WebP, and SVG formats.

## Security

1. **Access Control**: R2 credentials are only accessible server-side.
2. **Public URLs**: If enabled, images can be accessed directly via Cloudflare's CDN.
3. **Signed URLs**: For non-public buckets, the system generates secure signed URLs.

## Extending

To add support for additional content types in R2:

1. Update the `R2_FOLDER_PREFIXES` array in `lib/storage-utils.ts`:

```typescript
const R2_FOLDER_PREFIXES = [
  'wallpaper-images', 
  'wallpapers', 
  'prompt-images',
  'your-new-folder'
];
```

## Troubleshooting

Common issues:

1. **Missing Environment Variables**: Check that all required R2 variables are set.
2. **CORS Errors**: Configure CORS rules in your R2 bucket settings.
3. **Image Display Issues**: Verify that the R2 domain is added to Next.js image domains.

For detailed setup instructions, see `docs/cloudflare-r2-setup.md`. 