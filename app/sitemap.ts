import { MetadataRoute } from 'next'
import { db } from '@/lib/firebase-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all wallpapers, categories, and blog posts
  const [wallpapersSnapshot, blogsSnapshot, categoriesSnapshot] = await Promise.all([
    db.collection('wallpapers').get(),
    db.collection('blogs').get(),
    db.collection('categories').get()
  ]).catch(error => {
    console.error('Error fetching data for sitemap:', error);
    return [{ docs: [] }, { docs: [] }, { docs: [] }];
  });
  
  // Base URL from environment variable or default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://freewallpapers.com'

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/featured`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic wallpaper routes
  const wallpaperRoutes = wallpapersSnapshot.docs.map((doc) => {
    const data = doc.data();
    const slug = data.slug || doc.id;
    
    // Ensure we have a valid date
    let lastModified;
    try {
      if (data.updatedAt) {
        lastModified = new Date(data.updatedAt);
      } else if (data.createdAt) {
        lastModified = new Date(data.createdAt);
      } else {
        lastModified = new Date();
      }
      
      // Validate the date - if invalid, use current date
      if (isNaN(lastModified.getTime())) {
        lastModified = new Date();
      }
    } catch (e) {
      lastModified = new Date();
    }
    
    return {
      url: `${baseUrl}/wallpapers/${slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    };
  });

  // Dynamic category routes
  const categoryRoutes = categoriesSnapshot.docs.map((doc) => {
    const data = doc.data();
    const slug = data.slug || doc.id;
    
    // Ensure we have a valid date
    let lastModified;
    try {
      if (data.updatedAt) {
        lastModified = new Date(data.updatedAt);
      } else if (data.createdAt) {
        lastModified = new Date(data.createdAt);
      } else {
        lastModified = new Date();
      }
      
      // Validate the date - if invalid, use current date
      if (isNaN(lastModified.getTime())) {
        lastModified = new Date();
      }
    } catch (e) {
      lastModified = new Date();
    }
    
    return {
      url: `${baseUrl}/categories/${slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  // Dynamic blog routes
  const blogRoutes = blogsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const slug = data.slug || doc.id;
    
    // Ensure we have a valid date
    let lastModified;
    try {
      if (data.updatedAt) {
        lastModified = new Date(data.updatedAt);
      } else if (data.createdAt) {
        lastModified = new Date(data.createdAt);
      } else {
        lastModified = new Date();
      }
      
      // Validate the date - if invalid, use current date
      if (isNaN(lastModified.getTime())) {
        lastModified = new Date();
      }
    } catch (e) {
      lastModified = new Date();
    }
    
    return {
      url: `${baseUrl}/blog/${slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  return [...routes, ...wallpaperRoutes, ...categoryRoutes, ...blogRoutes]
} 