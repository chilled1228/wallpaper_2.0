import { PinterestSyncService } from '../lib/pinterest-sync';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const REQUIRED_ENV_VARS = [
  'PINTEREST_ACCESS_TOKEN',
  'PINTEREST_BOARD_ID',
  'WALLPAPER_RSS_URL',
] as const;

// Validate environment variables
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function main() {
  const pinterestCredentials = {
    accessToken: process.env.PINTEREST_ACCESS_TOKEN!,
    boardId: process.env.PINTEREST_BOARD_ID!,
  };

  const syncService = new PinterestSyncService(
    pinterestCredentials,
    process.env.WALLPAPER_RSS_URL!
  );

  try {
    console.log('Starting Pinterest sync...');
    await syncService.syncNewWallpapers();
    console.log('Pinterest sync completed successfully');
  } catch (error) {
    console.error('Pinterest sync failed:', error);
    process.exit(1);
  }
}

main(); 