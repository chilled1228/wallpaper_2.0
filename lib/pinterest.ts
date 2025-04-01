import { z } from 'zod';

const pinterestConfig = {
  apiVersion: 'v5',
  baseUrl: 'https://api.pinterest.com',
};

export interface PinterestCredentials {
  accessToken: string;
  boardId: string;
}

export interface WallpaperData {
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
}

const pinterestPinSchema = z.object({
  id: z.string(),
  link: z.string(),
  title: z.string(),
  description: z.string(),
  media: z.object({
    images: z.object({
      original: z.object({
        url: z.string(),
      }),
    }),
  }),
});

export class PinterestService {
  private accessToken: string;
  private boardId: string;

  constructor(credentials: PinterestCredentials) {
    this.accessToken = credentials.accessToken;
    this.boardId = credentials.boardId;
  }

  async createPin(wallpaper: WallpaperData) {
    try {
      const response = await fetch(`${pinterestConfig.baseUrl}/${pinterestConfig.apiVersion}/pins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board_id: this.boardId,
          title: wallpaper.title,
          description: `${wallpaper.description}\n\nSource: ${wallpaper.sourceUrl}`,
          media_source: {
            source_type: 'image_url',
            url: wallpaper.imageUrl,
          },
          link: wallpaper.sourceUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create pin: ${response.statusText}`);
      }

      const data = await response.json();
      return pinterestPinSchema.parse(data);
    } catch (error) {
      console.error('Error creating Pinterest pin:', error);
      throw error;
    }
  }

  async checkIfPinExists(sourceUrl: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${pinterestConfig.baseUrl}/${pinterestConfig.apiVersion}/boards/${this.boardId}/pins?` +
        new URLSearchParams({
          link: sourceUrl,
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check pin existence: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items.length > 0;
    } catch (error) {
      console.error('Error checking pin existence:', error);
      throw error;
    }
  }
} 