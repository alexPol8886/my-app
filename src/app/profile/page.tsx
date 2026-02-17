'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Mail, Fingerprint, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  const handleSignOut = async () => {
    try {
      await signOut(); 
      // Auth hook usually handles redirect, but we can force it
      router.push('/auth/signin');
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  if (!mounted || loading) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-primary animate-spin"></div>
       </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 bg-background transition-colors duration-300">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-bold text-foreground">Profile</h1>
           <ThemeToggle />
        </div>

        {/* Profile Card */}
        <div className="relative pt-12 pb-8 px-6 rounded-[2.5rem] bg-card border border-border/50 shadow-sm text-center mt-12">
           {/* Avatar */}
           <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-[#FFD166] to-[#EF476F] p-1.5 shadow-xl shadow-orange-200/50 dark:shadow-none">
                 <div className="h-full w-full rounded-[1.5rem] bg-card border-4 border-card overflow-hidden flex items-center justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                 </div>
              </div>
           </div>

           <h2 className="text-2xl font-bold text-foreground mt-2 mb-1">
              {user?.email?.split('@')[0]}
           </h2>
           <p className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full inline-block">
              Free Member
           </p>

           <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-secondary/30 border border-border/30">
                 <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Email</p>
                    <p className="font-medium text-foreground text-sm truncate max-w-[200px]">{user?.email}</p>
                 </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-secondary/30 border border-border/30">
                 <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                    <Fingerprint className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">User ID</p>
                    <p className="font-mono text-xs text-foreground truncate max-w-[200px]">{user?.id}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 py-4 font-bold transition-all active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>

      </div>
    </div>
  );
}
