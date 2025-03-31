'use client';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID ||
    !process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !process.env.NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  throw new Error('Missing Cloudflare R2 credentials');
}

export const R2_CLIENT = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export const WALLPAPER_BUCKET = 'wallpapers';
export const PROMPT_BUCKET = 'prompt-images';

export const getR2PublicUrl = (key: string, bucket: string): string => {
  return `https://${process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_DOMAIN}/${bucket}/${key}`;
};

export const generatePresignedUrl = async (
  key: string,
  bucket: string,
  expiresIn = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(R2_CLIENT, command, { expiresIn });
}; 