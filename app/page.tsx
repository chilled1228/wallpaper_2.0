import { Metadata } from 'next'
import { defaultMetadata } from './metadata'
import { Suspense } from "react"
import { Loader2, ChevronRight, Download, ArrowRight, SearchIcon, Flame, SparklesIcon, HeartIcon, TrendingUpIcon, ImageIcon } from 'lucide-react'
import { WallpaperGrid } from '@/components/wallpaper-grid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { Input } from '@/components/ui/input'
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
      {/* Hero Section - Enhanced */}
      <section className="relative w-full overflow-hidden mb-12 sm:mb-16 md:mb-20 py-10 md:py-16">
        {/* Background decorative elements */}
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
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search for wallpapers..." 
                    className="pl-10 pr-20 h-12 rounded-full border-primary/20 focus:border-primary shadow-sm"
                  />
                  <Button size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full px-4 h-10">
                    Search
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Popular:</span>
                  <Link href="/search?q=mountain" className="hover:text-primary transition-colors">Mountain</Link>
                  <Link href="/search?q=ocean" className="hover:text-primary transition-colors">Ocean</Link>
                  <Link href="/search?q=minimal" className="hover:text-primary transition-colors">Minimal</Link>
                  <Link href="/search?q=space" className="hover:text-primary transition-colors">Space</Link>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full">
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
            
            {/* Featured Image Side */}
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
                  quality={85}
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
              
              {/* Stats overlay */}
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
      
      {/* Categories Section - Enhanced */}
      <section className="w-full py-16 mb-16">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold">Popular Categories</h2>
              <p className="text-muted-foreground mt-2">Browse wallpapers by your favorite themes</p>
            </div>
            <Button variant="outline" asChild className="group rounded-full">
              <Link href="/categories">
                View All Categories <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {popularCategories.map((category) => (
              <Link href={`/category/${category.name.toLowerCase()}`} key={category.name}>
                <div className="group relative overflow-hidden rounded-xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-90 transition-opacity duration-300`}></div>
                  <div className="relative p-6 md:p-8 h-40 flex flex-col justify-between">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="text-white font-medium text-lg">{category.name}</h3>
                      <p className="text-white/90 text-sm mt-1 flex items-center">
                        <ImageIcon className="h-3 w-3 mr-1 inline-block" /> 
                        {category.count} wallpapers
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/25 rounded-xl transition-all duration-300"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Trending Section - Updated with Dynamic Content */}
      <section className="w-full py-12 mb-16 bg-muted/30">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUpIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Trending now</span>
              </div>
              <h2 className="text-3xl font-bold">Most Popular This Week</h2>
            </div>
            <Button variant="outline" asChild className="group rounded-full">
              <Link href="/trending">
                View All Trending <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Feature larger trending wallpaper */}
            <div className="md:col-span-2 group relative aspect-[4/3] md:aspect-square rounded-xl overflow-hidden shadow-lg">
              <ServerImage
                src={getWallpaperImage(trendingWallpapers[0], '/trending-wallpaper-1.jpg')}
                alt={trendingWallpapers[0].title}
                fallbackSrc="/trending-wallpaper-1.jpg"
                fill={true}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={75}
                loading="lazy"
                placeholder="blur"
                blurDataURL={blurDataURL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80"></div>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-white/90 text-black text-xs font-medium rounded-full">{trendingWallpapers[0].trending}</span>
                <span className="flex items-center gap-1 px-3 py-1 bg-black/50 text-white text-xs font-medium rounded-full">
                  <HeartIcon className="h-3 w-3" /> {trendingWallpapers[0].likes}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-medium text-lg">{trendingWallpapers[0].title}</h3>
                <p className="text-white/80 text-sm mt-1">{trendingWallpapers[0].description}</p>
              </div>
              <Link 
                href={`/wallpapers/${trendingWallpapers[0].slug}`} 
                className="absolute inset-0 z-10"
                aria-label={`View ${trendingWallpapers[0].title} wallpaper`} 
              />
            </div>
            
            {/* Three smaller trending wallpapers */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-rows-2 gap-4 md:gap-6">
              {trendingWallpapers.slice(1, 4).map((item: TrendingWallpaper, i: number) => (
                <div key={i} className={`group relative ${i === 2 ? 'sm:col-span-2 md:col-span-1' : ''} aspect-video md:aspect-square rounded-xl overflow-hidden shadow-lg`}>
                  <ServerImage
                    src={getWallpaperImage(item, `/trending-wallpaper-${i+2}.jpg`)}
                    alt={item.title}
                    fallbackSrc={`/trending-wallpaper-${i+2}.jpg`}
                    fill={true}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                    quality={75}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80"></div>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white/90 text-black text-xs font-medium rounded-full">{item.trending}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-black/50 text-white text-xs font-medium rounded-full">
                      <HeartIcon className="h-2.5 w-2.5" /> {item.likes}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <p className="text-white/80 text-xs mt-1">{item.description}</p>
                  </div>
                  <Link 
                    href={`/wallpapers/${item.slug}`}
                    className="absolute inset-0 z-10"
                    aria-label={`View ${item.title} wallpaper`} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Collections Section - Updated */}
      <section className="w-full py-12 mb-16">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Handpicked for you</span>
              </div>
              <h2 className="text-3xl font-bold">Curated Collections</h2>
              <p className="text-muted-foreground mt-2">Discover themed wallpaper sets for every mood and occasion</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="absolute bottom-5 left-5 right-5">
                    <h3 className="text-white font-medium text-xl">{collection.title}</h3>
                    <p className="text-white/80 text-sm mt-1">{collection.count}</p>
                    <Button variant="outline" size="sm" className="mt-4 border-white/30 text-white hover:bg-white/20 rounded-full">
                      View Collection
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Recent Wallpapers - Full Width */}
      <section id="explore" className="w-full py-12 mb-16">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold">Latest Wallpapers</h2>
              <p className="text-muted-foreground mt-2">Fresh and new additions to our collection</p>
            </div>
            <Button variant="outline" asChild className="group rounded-full">
              <Link href="/latest">
                View All Latest <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }>
            <WallpaperGrid />
          </Suspense>
        </div>
      </section>
      
      {/* Newsletter/Download App CTA - Enhanced */}
      <section className="w-full py-8 mb-16">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-xl rounded-2xl border border-primary/10 p-8 md:p-12 shadow-lg">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Get Premium Wallpapers</h2>
                <p className="text-muted-foreground max-w-md">
                  Subscribe to our newsletter for exclusive wallpapers, early access to new collections, and special updates.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <div className="flex-1">
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="h-12 rounded-full border-primary/20"
                    />
                  </div>
                  <Button className="h-12 rounded-full px-6">
                    Subscribe Now
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  By subscribing, you agree to our privacy policy. We'll never spam you.
                </p>
              </div>
              
              <div className="relative h-60 md:h-72 -mb-8 md:mb-0">
                <div className="absolute inset-y-0 right-0 w-full md:w-[120%] h-full">
                  <div className="relative h-full w-full">
                    <ServerImage
                      src="/devices-mockup.png"
                      alt="Our wallpapers on multiple devices"
                      fallbackSrc="/devices-generic.png"
                      fill
                      className="object-contain object-bottom"
                      loading="lazy"
                      quality={75}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

