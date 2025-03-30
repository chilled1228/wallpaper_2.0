'use client';

import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User2, LogOut, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export function LoginButton() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // Set session cookie when user logs in
    const setSessionCookie = async () => {
      if (user) {
        const token = await user.getIdToken();
        // Store the token in a cookie that will be sent with requests
        document.cookie = `firebaseToken=${token}; path=/`;
      } else {
        // Clear the cookie when user logs out
        document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
    };

    setSessionCookie();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear the cookie
      document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <span className="h-4 w-4 animate-pulse rounded-full bg-primary/20"></span>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild size="sm" variant="default">
        <Link href="/auth">Sign In</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User avatar'} />
            <AvatarFallback>
              {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="flex flex-col items-start">
          <div className="text-sm font-medium">
            {user.displayName || 'User'}
          </div>
          <div className="text-xs text-muted-foreground">
            {user.email}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push('/profile')}
        >
          <User2 className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push('/upload')}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Wallpaper
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 