'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { AuthButtons } from '@/components/auth/auth-buttons';

export default function AuthPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user && !loading) {
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    }
  }, [user, loading, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-4 bg-background/60 backdrop-blur-xl rounded-xl border border-primary/10 shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to PersonalAIWalls</h1>
          <p className="text-muted-foreground">
            Sign in to save and upload your favorite wallpapers
          </p>
        </div>
        
        <div className="mt-8">
          <AuthButtons />
        </div>
      </div>
    </div>
  );
} 