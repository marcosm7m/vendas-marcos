'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };
  
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-headline text-5xl font-bold text-primary">TintTrack</h1>
        <p className="mt-2 text-lg text-muted-foreground">Seu assistente para controle de vendas.</p>
        <div className="mt-8 flex justify-center">
          <Button onClick={handleSignIn} size="lg">
            Entrar com Google
          </Button>
        </div>
      </div>
    </div>
  );
}
