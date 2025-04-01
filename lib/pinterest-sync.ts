import { PinterestService, WallpaperData } from './pinterest';
import { parse } from 'rss-parser';

interface WallpaperRSSItem {
  title: string;
  description: string;
  link: string;
  enclosure: {
    url: string;
  };
  pubDate: string;
}

export class PinterestSyncService {
  private pinterestService: PinterestService;
  private rssUrl: string;
  private parser: any;

  constructor(pinterestCredentials: { accessToken: string; boardId: string }, rssUrl: string) {
    this.pinterestService = new PinterestService(pinterestCredentials);
    this.rssUrl = rssUrl;
    this.parser = new parse();
  }

  private transformRSSItemToWallpaper(item: WallpaperRSSItem): WallpaperData {
    return {
      title: item.title,
      description: item.description,
      imageUrl: item.enclosure.url,
      sourceUrl: item.link,
    };
  }

  async syncNewWallpapers() {
    try {
      // Fetch and parse RSS feed
      const feed = await this.parser.parseURL(this.rssUrl);
      
      // Process each item in the feed
      for (const item of feed.items as WallpaperRSSItem[]) {
        try {
          // Check if pin already exists
          const exists = await this.pinterestService.checkIfPinExists(item.link);
          
          if (!exists) {
            // Transform and post new wallpaper
            const wallpaperData = this.transformRSSItemToWallpaper(item);
            await this.pinterestService.createPin(wallpaperData);
            console.log(`Successfully posted wallpaper: ${wallpaperData.title}`);
          } else {
            console.log(`Wallpaper already exists on Pinterest: ${item.title}`);
          }
        } catch (error) {
          console.error(`Error processing wallpaper ${item.title}:`, error);
          // Continue with next item even if one fails
          continue;
        }
      }
    } catch (error) {
      console.error('Error syncing wallpapers:', error);
      throw error;
    }
  }
} 