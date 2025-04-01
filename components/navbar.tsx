'use client';

import Link from 'next/link';
import { LoginButton } from './auth/login-button';
import { Button } from './ui/button';
import { ChevronDown, Menu, X, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from './mode-toggle';
import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { CreditsDisplay } from './credits-display';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import NextImage from 'next/image';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useAuthState(auth);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b glass-effect">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 transition-opacity hover:opacity-90">
              <div className="relative w-6 h-6 sm:w-7 sm:h-7">
                <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span key="navbar-logo" className="font-heading text-lg sm:text-xl font-bold">
                GetWallpapersFree
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              href="/"
              className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/categories"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Categories
            </Link>
            <Link 
              href="/latest"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Latest
            </Link>
            <Link 
              href="/featured"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Featured
            </Link>
            <Link 
              href="/blog"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link 
              href="/about"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ModeToggle />
            <div className="hidden md:flex items-center gap-2">
              {user && <CreditsDisplay />}
              <LoginButton />
              {user && (
                <Button variant="outline" size="sm" className="hidden lg:flex">
                  Upload Wallpaper
                </Button>
              )}
            </div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4 mt-4">
                  <Link 
                    href="/"
                    className="text-base sm:text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
                    onClick={closeSheet}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/categories"
                    className="text-base sm:text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={closeSheet}
                  >
                    Categories
                  </Link>
                  <Link 
                    href="/latest"
                    className="text-base sm:text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={closeSheet}
                  >
                    Latest
                  </Link>
                  <Link 
                    href="/featured"
                    className="text-base sm:text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={closeSheet}
                  >
                    Featured
                  </Link>
                  <Link 
                    href="/blog"
                    className="text-base sm:text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={closeSheet}
                  >
                    Blog
                  </Link>
                  <Link 
                    href="/about"
                    className="text-base sm:text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={closeSheet}
                  >
                    About
                  </Link>
                  <div className="pt-4 flex flex-col gap-3">
                    {user && <CreditsDisplay />}
                    <LoginButton />
                    {user && (
                      <Button variant="default" className="w-full" onClick={closeSheet}>
                        Upload Wallpaper
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
} 