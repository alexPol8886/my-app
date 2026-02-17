'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useJoinCircle } from '@/hooks/useCircles';
import { ArrowLeft, Hash } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function JoinCirclePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  
  const joinCircle = useJoinCircle(user?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    if (inviteCode.trim().length < 8) {
      toast.error('Invite code must be at least 8 characters');
      return;
    }

    try {
      await joinCircle.mutateAsync(inviteCode.trim().toUpperCase());
      toast.success('Successfully joined circle!');
      router.push('/');
    } catch (err: any) {
      console.error('Error joining circle:', err);
      toast.error(err.message || 'Failed to join circle. Please check the code.');
    }
  };

  if (!mounted || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-background transition-colors duration-300">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href="/circles" className="p-3 rounded-[1.2rem] bg-card border border-border/50 text-foreground shadow-sm hover:shadow-md transition-all">
                 <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Join Circle</h1>
           </div>
           <ThemeToggle />
        </div>

        {/* Info Card */}
        <div className="p-6 rounded-[2.5rem] bg-card border border-border/50 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
           <div className="text-center space-y-2">
              <div className="mx-auto h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                 <Hash className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Have an invite?</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                 Enter the 8-character code shared by a circle member to join their group.
              </p>
           </div>

           {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label htmlFor="inviteCode" className="text-sm font-bold text-foreground ml-1">
                    Invite Code
                 </label>
                 <input
                    type="text"
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC12345"
                    maxLength={8}
                    className="w-full text-center text-2xl font-mono tracking-[0.2em] font-bold py-4 rounded-[1.5rem] bg-secondary/50 border-2 border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder-muted-foreground/30 uppercase"
                    disabled={joinCircle.isPending}
                 />
              </div>

              <button
                 type="submit"
                 disabled={joinCircle.isPending || !inviteCode.trim()}
                 className="w-full py-4 rounded-[1.5rem] bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-mint/30 hover:shadow-mint/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
              >
                 {joinCircle.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                       <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                       Joining...
                    </span>
                 ) : (
                    'Join Circle'
                 )}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
