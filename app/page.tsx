import { Metadata } from 'next'
import { defaultMetadata } from './metadata'
import { Suspense } from "react"
import { Loader2, ChevronRight, Download, ArrowRight, SparklesIcon } from 'lucide-react'
import { WallpaperGrid } from '@/components/wallpaper-grid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { ServerImage } from '@/components/ui/server-image'

// Generate metadata for SEO
export const metadata: Metadata = defaultMetadata

interface TrendingWallpaper {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  slug: string;
  trending: string;
  likes: string;
  [key: string]: any;
}

async function getFeaturedWallpaper() {
  console.log('Starting to fetch featured wallpaper');
  try {
    // Query for featured wallpapers that are public and active
    const featuredQuery = query(
      collection(db, 'wallpapers'),
      where('featured', '==', true),
      where('isPublic', '==', true),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    console.log('Executing featured wallpapers query...');
    const snapshot = await getDocs(featuredQuery);
    console.log(`Query returned ${snapshot.size} featured wallpapers`);

    // Get all featured wallpapers (for debugging)
    const allFeaturedQuery = query(
      collection(db, 'wallpapers'),
      where('featured', '==', true)
    );
    const allFeaturedSnapshot = await getDocs(allFeaturedQuery);
    console.log(`Total featured wallpapers (regardless of status): ${allFeaturedSnapshot.size}`);
    
    if (allFeaturedSnapshot.size > 0) {
      console.log('All featured wallpapers:');
      allFeaturedSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, Title: ${data.title}, Public: ${data.isPublic}, Status: ${data.status}`);
      });
    }
    
    if (snapshot.empty) {
      console.log('No active, public featured wallpapers found, using default');
      // Return default if no featured wallpaper found
      return {
        id: 'default',
        title: 'Featured Wallpaper of the Week',
        imageUrl: '/featured-wallpaper.jpg',
        slug: ''
      };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    console.log('Found featured wallpaper to display:', doc.id, data);
    
    return {
      id: doc.id,
      ...data,
      title: data.title || 'Featured Wallpaper',
      imageUrl: data.imageUrl || '/featured-wallpaper.jpg',
      slug: data.slug || doc.id
    };
  } catch (error) {
    console.error('Error fetching featured wallpaper:', error);
    // Return default on error
    return {
      id: 'default',
      title: 'Featured Wallpaper of the Week',
      imageUrl: '/featured-wallpaper.jpg',
      slug: ''
    };
  }
}

// Get trending wallpapers
async function getTrendingWallpapers(): Promise<TrendingWallpaper[]> {
  try {
    let snapshot;
    
    try {
      // Try query with composite index first
      const trendingQuery = query(
        collection(db, 'wallpapers'),
        where('isPublic', '==', true),
        where('status', '==', 'active'),
        orderBy('views', 'desc'),
        limit(4)
      );
      
      snapshot = await getDocs(trendingQuery);
      console.log('Using indexed trending query successfully');
    } catch (error: any) {
      // If index error, fall back to simpler query
      if (error.message && error.message.includes('index')) {
        console.log('Falling back to simpler trending query due to missing index');
        
        // Simple query without complex filters that don't need composite index
        const simpleQuery = query(
          collection(db, 'wallpapers'),
          where('isPublic', '==', true),
          limit(8)
        );
        
        snapshot = await getDocs(simpleQuery);
        
        // Sort client-side instead
        const docs = snapshot.docs.filter(doc => doc.data().status === 'active');
        docs.sort((a, b) => (b.data().views || 0) - (a.data().views || 0));
        snapshot = {
          docs: docs.slice(0, 4),
          empty: docs.length === 0,
          size: docs.length
        } as any;
      } else {
        // Rethrow if not an index error
        throw error;
      }
    }
    
    if (snapshot.empty) {
      console.log('No trending wallpapers found, using defaults');
      // Return default trending wallpapers
      return [
        { 
          id: 'default-1', 
          title: 'Mystical Mountain Lake', 
          description: 'Serene landscape with vibrant colors',
          imageUrl: '/trending-wallpaper-1.jpg',
          slug: 'mystical-mountain-lake',
          trending: '#1',
          likes: '2.4k'
        },
        { 
          id: 'default-2', 
          title: 'Minimal Workspace', 
          description: 'Clean and productive setup',
          imageUrl: '/trending-wallpaper-2.jpg',
          slug: 'minimal-workspace',
          trending: '#2',
          likes: '1.8k'
        },
        { 
          id: 'default-3', 
          title: 'Neon City Nights', 
          description: 'Cyberpunk urban landscape',
          imageUrl: '/trending-wallpaper-3.jpg',
          slug: 'neon-city-nights',
          trending: '#3',
          likes: '1.5k'
        },
        { 
          id: 'default-4', 
          title: 'Ocean Sunrise', 
          description: 'Beautiful morning at the beach',
          imageUrl: '/trending-wallpaper-4.jpg',
          slug: 'ocean-sunrise',
          trending: '#4',
          likes: '1.2k'
        }
      ];
    }
    
    // Map Firestore documents to trending wallpapers
    return snapshot.docs.map((doc: any, index: number) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        title: data.title || `Trending Wallpaper ${index + 1}`,
        description: data.description || 'Beautiful high-resolution wallpaper',
        imageUrl: data.imageUrl || `/trending-wallpaper-${index + 1}.jpg`,
        slug: data.slug || doc.id,
        trending: `#${index + 1}`,
        likes: `${Math.floor((data.favorites || 0) / 100) / 10}k`
      };
    });
  } catch (error) {
    console.error('Error fetching trending wallpapers:', error);
    // Return default trending wallpapers on error
    return [
      { 
        id: 'default-1', 
        title: 'Mystical Mountain Lake', 
        description: 'Serene landscape with vibrant colors',
        imageUrl: '/trending-wallpaper-1.jpg',
        slug: 'mystical-mountain-lake',
        trending: '#1',
        likes: '2.4k'
      },
      { 
        id: 'default-2', 
        title: 'Minimal Workspace', 
        description: 'Clean and productive setup',
        imageUrl: '/trending-wallpaper-2.jpg',
        slug: 'minimal-workspace',
        trending: '#2',
        likes: '1.8k'
      },
      { 
        id: 'default-3', 
        title: 'Neon City Nights', 
        description: 'Cyberpunk urban landscape',
        imageUrl: '/trending-wallpaper-3.jpg',
        slug: 'neon-city-nights',
        trending: '#3',
        likes: '1.5k'
      },
      { 
        id: 'default-4', 
        title: 'Ocean Sunrise', 
        description: 'Beautiful morning at the beach',
        imageUrl: '/trending-wallpaper-4.jpg',
        slug: 'ocean-sunrise',
        trending: '#4',
        likes: '1.2k'
      }
    ];
  }
}

// Get popular categories
async function getPopularCategories() {
  const categories = [
    { name: 'Nature', color: 'from-green-500 to-emerald-700', icon: '🌿', count: '1.2k+' },
    { name: 'Abstract', color: 'from-purple-500 to-indigo-700', icon: '🎨', count: '850+' },
    { name: 'Minimal', color: 'from-gray-500 to-slate-700', icon: '◾', count: '760+' },
    { name: 'Space', color: 'from-blue-500 to-violet-700', icon: '🌌', count: '620+' },
    { name: 'City', color: 'from-amber-500 to-orange-700', icon: '🏙️', count: '540+' },
    { name: 'Technology', color: 'from-cyan-500 to-blue-700', icon: '💻', count: '480+' }
  ];
  
  return categories;
}

// Get curated collections
async function getCuratedCollections() {
  return [
    { title: "Work From Home", count: "24 wallpapers", image: "/collection-work.jpg", slug: "work-from-home" },
    { title: "Calm & Mindful", count: "18 wallpapers", image: "/collection-calm.jpg", slug: "calm-mindful" },
    { title: "Vibrant Colors", count: "32 wallpapers", image: "/collection-vibrant.jpg", slug: "vibrant-colors" }
  ];
}

export default async function HomePage() {
  const featuredWallpaper = await getFeaturedWallpaper();
  const popularCategories = await getPopularCategories();
  const trendingWallpapers = await getTrendingWallpapers();
  const curatedCollections = await getCuratedCollections();
  
  // Common blur placeholder for images
  const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";
  
  // Helper function to check if an image URL is valid
  function isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // Handle local file paths that start with '/'
    if (url.startsWith('/')) {
      return true;
    }
    
    // Handle external URLs
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
  
  // Helper function to sanitize R2 URLs if needed
  function sanitizeR2Url(url: string): string {
    if (!url) return url;
    
    // Handle the case where URL might be missing protocol for R2
    if (url.startsWith('pub-') && url.includes('.r2.dev')) {
      console.log('Adding protocol to R2 URL:', url);
      return `https://${url}`;
    }
    
    // Ensure R2 URLs use HTTPS
    if (url.includes('.r2.dev') && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    
    return url;
  }
  
  // Helper function to check if URL is from R2
  function isR2Image(url: string): boolean {
    if (!url) return false;
    
    const r2PublicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN;
    return (
      url.includes('.r2.dev') || 
      url.includes('.cloudflarestorage.com') ||
      (typeof r2PublicDomain === 'string' && url.includes(r2PublicDomain))
    );
  }
  
  // Helper function to get wallpaper image with sanitized URL
  function getWallpaperImage(wallpaper: TrendingWallpaper, defaultImage: string): string {
    // If no image URL, use default
    if (!wallpaper.imageUrl) {
      return defaultImage;
    }
    
    // For local paths, return directly
    if (wallpaper.imageUrl.startsWith('/')) {
      return wallpaper.imageUrl;
    }
    
    // Sanitize the URL if it's an R2 URL
    const sanitizedUrl = isR2Image(wallpaper.imageUrl) 
      ? sanitizeR2Url(wallpaper.imageUrl) 
      : wallpaper.imageUrl;
    
    // Log for debugging
    console.log('Processing wallpaper image:', {
      original: wallpaper.imageUrl,
      sanitized: sanitizedUrl,
      isR2: isR2Image(wallpaper.imageUrl),
      isValid: isValidImageUrl(sanitizedUrl)
    });
    
    // If image URL is valid, use it
    if (isValidImageUrl(sanitizedUrl)) {
      return sanitizedUrl;
    }
    
    // Otherwise, use the default
    return defaultImage;
  }
  
  return (
    <div className="w-full bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Hero Section - Optimized with minimal animations */}
      <section className="relative w-full overflow-hidden mb-8 sm:mb-12 md:mb-16 py-10 md:py-16">
        {/* Simpler, lighter background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-secondary/10 rounded-full blur-3xl opacity-70"></div>
        </div>
        
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Content Side */}
            <div className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  <SparklesIcon className="mr-1 h-3.5 w-3.5" />
                  <span>Premium quality wallpapers</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Stunning Wallpapers</span>
                  <br />
                  <span>for Every Device</span>
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-md">
                  Transform your screens with our curated collection of high-resolution wallpapers for desktops, phones, and tablets.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full shadow-sm">
                  <Link href="#explore">
                    Explore Collection <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/categories">
                    Browse Categories <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4 text-primary" />
                <span>Free downloads • No attribution required • Personal & commercial use</span>
              </div>
            </div>
            
            {/* Featured Image Side - Improved performance */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative aspect-[5/4] md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-primary/10">
                <ServerImage
                  src={featuredWallpaper.imageUrl}
                  alt={featuredWallpaper.title}
                  fallbackSrc="/featured-wallpaper.jpg"
                  fill={true}
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={true}
                  quality={90}
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full">Featured</span>
                    <span className="px-3 py-1 bg-black/50 text-white text-xs font-medium rounded-full">4K Quality</span>
                  </div>
                  <h3 className="text-white font-medium text-lg line-clamp-1">{featuredWallpaper.title}</h3>
                  <p className="text-white/80 text-sm mt-1 line-clamp-1">Elevate your desktop with our handpicked wallpaper of the week</p>
                </div>
                {featuredWallpaper.id !== 'default' && (
                  <Link 
                    href={`/wallpapers/${featuredWallpaper.slug}`} 
                    className="absolute inset-0 z-10"
                    aria-label={`View ${featuredWallpaper.title}`} 
                  />
                )}
              </div>
              
              {/* Stats overlay - simplified */}
              <div className="absolute -bottom-5 -right-5 md:-bottom-8 md:-right-8 bg-background/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-lg border border-primary/10">
                <div className="flex gap-4 md:gap-6">
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">10K+</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Wallpapers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">4K</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Resolution</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">100%</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Free</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Explore Section - Optimized */}
      <section id="explore" className="w-full py-12 sm:py-16">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sm:mb-10">
            <div>
              <h2 className="text-3xl font-bold">Explore Wallpapers</h2>
              <p className="text-muted-foreground mt-2">Discover our collection of high-quality wallpapers</p>
            </div>
            <Button variant="outline" asChild className="group rounded-full">
              <Link href="/latest">
                View All <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="relative">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[600px] w-full">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Loading wallpapers...</p>
                </div>
              </div>
            }>
              <div className="min-h-[600px]">
                <WallpaperGrid />
              </div>
            </Suspense>
          </div>
          
          <div className="flex justify-center mt-10">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/latest">
                View More Wallpapers <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Curated Collections - Optimized for performance */}
      <section className="w-full py-12 sm:py-16 bg-muted/30">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sm:mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Hand-picked</span>
              </div>
              <h2 className="text-3xl font-bold">Curated Collections</h2>
              <p className="text-muted-foreground mt-2">Themed wallpaper sets for every mood and style</p>
            </div>
            <Button variant="outline" asChild className="group rounded-full">
              <Link href="/collections">
                View All Collections <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {curatedCollections.map((collection, i) => (
              <Link href={`/collections/${collection.slug}`} key={i}>
                <div className="group relative aspect-[3/2] rounded-xl overflow-hidden shadow-lg">
                  <ServerImage
                    src={collection.image}
                    alt={collection.title}
                    fallbackSrc="/collection-generic.jpg"
                    fill={true}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={75}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-medium text-lg">{collection.title}</h3>
                    <p className="text-white/80 text-sm mt-1">{collection.count} wallpapers</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

