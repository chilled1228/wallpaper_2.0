import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - FreeWallpapers',
  description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex flex-col items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-md relative">
        <div className="rounded-full w-20 h-20 bg-muted/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
          <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            404
          </span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Page Not Found
        </h1>
        
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved. Check the URL or go back to the homepage.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg">
            <Link href="/">Go to Homepage</Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link href="/wallpapers">Browse Wallpapers</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 