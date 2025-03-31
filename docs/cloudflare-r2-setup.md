# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for storing wallpaper and prompt images.

## Step 1: Create a Cloudflare Account

If you don't already have one, create a Cloudflare account at [cloudflare.com](https://www.cloudflare.com/).

## Step 2: Enable R2 Storage

1. Log in to your Cloudflare dashboard
2. Navigate to "R2" from the left sidebar
3. Click "Get Started" or "Create bucket" if you're new to R2
4. You might need to set up billing - R2 offers 10GB of free storage and 10 million free operations per month

## Step 3: Create a Storage Bucket

1. Name your bucket (e.g., `wallpaper-images`)
2. Select a region close to your target audience
3. Choose your settings (default settings are fine for most use cases)
4. Click "Create bucket"

## Step 4: Create API Tokens

1. In the R2 dashboard, navigate to "R2" > "Overview"
2. Find "Manage R2 API Tokens" and click on it
3. Click "Create API Token"
4. Set a name for your token (e.g., "Wallpaper App Storage")
5. Select the permissions:
   - For full access: Object Read and Object Write
   - For read-only access: Object Read only
6. Choose which buckets this token should have access to (your wallpaper bucket)
7. Set the TTL (time to live) - you can leave this as "Never expires" for production
8. Click "Create API Token"
9. **IMPORTANT**: Copy both the "Access Key ID" and "Secret Access Key" - these will only be shown once

## Step 5: Enable Public Access (Optional)

If you want to serve images directly from a public URL:

1. Navigate to your bucket settings
2. Find "Public Access" or "Access Control"
3. Enable "Public Access" for the bucket
4. Note the public domain provided (usually in the format `https://pub-<hash>.r2.dev`)

## Step 6: Add Environment Variables to Your Project

Add the following environment variables to your `.env.local` file:

```
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
CLOUDFLARE_R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
CLOUDFLARE_R2_BUCKET_NAME="wallpaper-images"
CLOUDFLARE_R2_PUBLIC_DOMAIN="https://pub-<hash>.r2.dev" # Only if you enabled public access
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN="pub-<hash>.r2.dev" # Without protocol for Next.js Image component
```

Replace the placeholders with your actual values:
- `<account-id>`: Your Cloudflare account ID (found in the URL when you're logged in)
- `<hash>`: The unique hash assigned to your public bucket (if enabled)

## Step 7: Verify the Configuration

1. Start your development server with `npm run dev`
2. Navigate to the admin R2 upload demo page at `/admin/storage/r2`
3. Test uploading an image to verify the connection is working
4. If the upload succeeds, you should see the image in your R2 bucket dashboard

## Step 8: Configure CORS (Optional)

If you encounter CORS issues when accessing your R2 resources:

1. In the R2 dashboard, select your bucket
2. Go to "Settings" > "CORS"
3. Add a CORS rule with the following settings:
   - Origin: `*` (for testing) or your specific domains for production
   - Allowed methods: `GET`, `HEAD`
   - Allowed headers: `*`
   - Max age: `86400` (1 day)
4. Click "Save"

## Troubleshooting

- **Upload failures**: Check that your API keys are correct and have write permissions
- **Access denied**: Verify that your API token has the correct permissions for the bucket
- **Cannot see images**: Ensure public access is enabled if you're using public URLs
- **CORS errors**: Set up CORS rules as described in Step 8
- **Next.js Image errors**: Verify that the domain is properly added in `next.config.mjs`

For more help, refer to the [Cloudflare R2 documentation](https://developers.cloudflare.com/r2/). 