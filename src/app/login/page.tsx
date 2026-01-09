'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  getAuth,
  UserCredential,
  signOut,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase'; // Use this to check for auth readiness
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const StitchTrackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-12 h-12 text-primary"
  >
    <path d="M15.5 21a1.5 1.5 0 0 1-1.5-1.5V18a1.5 1.5 0 0 1 3 0v1.5a1.5 1.5 0 0 1-1.5 1.5Z" />
    <path d="M18.5 15a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 3 0v1.5a1.5 1.5 0 0 1-1.5 1.5Z" />
    <path d="M7 13.5v-1a2 2 0 1 1 4 0v1" />
    <path d="M6 18H4.5a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5H6" />
    <path d="M13 3v2" />
    <path d="M18 3v2" />
    <path d="m5 6 1-3" />
    <path d="m11 6-1-3" />
    <path d="M2 12h1.5" />
    <path d="M22 12h-1.5" />
    <path d="M7 18h1.5" />
    <path d="M17 18h-1.5" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = useFirebase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication not ready',
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter both email and password.',
      });
      return;
    }

    setIsLoading(true);
    setShowResend(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        toast({
            variant: 'destructive',
            title: 'Email Not Verified',
            description: 'Please verify your email address before logging in.',
        });
        setShowResend(true); // Show the resend link
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Login Successful',
        description: "You've been successfully signed in.",
      });
      router.push('/');
    } catch (error: any) {
      console.error('Login Error:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            description = 'The email address is not valid.';
            break;
          default:
            description = error.message;
            break;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth) return;
    setIsResending(true);
    try {
      // To resend, we need to sign in the user temporarily to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user as User);
        toast({
          title: 'Verification Email Sent',
          description: 'A new verification link has been sent to your email address.',
        });
      }
      await signOut(auth); // Sign out immediately after
    } catch (error: any) {
        console.error('Resend Verification Error:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Resend',
            description: 'Could not resend verification email. Please check your credentials and try again.',
        });
    } finally {
        setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <StitchTrackIcon />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your StitchTrack dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isResending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isResending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isResending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
               {showResend && (
                <div className="text-sm text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                    disabled={isResending}
                  >
                    {isResending ? 'Sending...' : 'Resend verification email'}
                  </button>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isResending}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
