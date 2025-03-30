'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function AuthButtons() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSuccess = async (user: any) => {
    setIsLoading(false);
    setError('');
    
    // Get the token and set it in a cookie
    const token = await user.getIdToken();
    document.cookie = `firebaseToken=${token}; path=/`;
    
    // Get the redirect URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/';
    
    router.push(redirectUrl);
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      await handleSuccess(userCredential.user);
    } catch (error: any) {
      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : error.message;
      setError(errorMessage);
      console.error('Error with email auth:', error);
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      await handleSuccess(result.user);
    } catch (error: any) {
      const errorMessage = error.code === 'auth/popup-closed-by-user'
        ? 'Sign in was cancelled'
        : error.message;
      setError(errorMessage);
      console.error('Error signing in with Google:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="outline"
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="relative flex items-center gap-2 h-11 hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <FcGoogle className="w-5 h-5" />
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Continue with Google'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isSignUp ? 'signup' : 'signin'}
          initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 mt-2"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <MdEmail className="w-5 h-5" />
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 