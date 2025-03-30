import Link from 'next/link'
import { Github, Twitter, Instagram, Facebook, ArrowUpRight, Image as ImageIcon } from 'lucide-react'
import NewsletterForm from './newsletter-form'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:py-16">
        {/* Top Section with Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center h-8 w-8">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="font-heading text-xl font-bold">
                FreeWallpapers
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Discover and download beautiful high-quality wallpapers for your desktop, 
              laptop, tablet, or mobile device. Free for personal use.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/freewallpapers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Twitter"
                className="p-2 rounded-full bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/freewallpapers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="p-2 rounded-full bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/freewallpapers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="p-2 rounded-full bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-5">Explore</h3>
            <nav aria-label="Footer explore navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/featured" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Featured Wallpapers
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Browse Categories
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/latest" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Latest Wallpapers
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/blog" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-5">Legal</h3>
            <nav aria-label="Footer legal navigation">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/privacy" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Use
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/disclaimer" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Disclaimer
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact Us
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-sm font-semibold mb-5">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe for new wallpapers and features.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground order-2 md:order-1">
              © {currentYear} FreeWallpapers. All rights reserved.
            </p>
            <div className="flex items-center gap-6 order-1 md:order-2 text-xs text-muted-foreground">
              <span>Made with ❤️ for wallpaper enthusiasts</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 