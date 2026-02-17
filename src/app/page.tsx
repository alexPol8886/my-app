'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCircles } from '@/hooks/useCircles';
import Link from 'next/link';
import { MapPin, Calendar, Plus, MoreHorizontal, Check, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

// Helper to get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 18) return 'Good Afternoon,';
  return 'Good Evening,';
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: circles, isLoading } = useCircles(user?.id);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<'going' | 'maybe' | 'cant_go' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  // Fetch next upcoming event across all circles
  useEffect(() => {
    const fetchNextEvent = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('events')
        .select(`*, circles(name)`)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .single();
        
      if (data) {
         setNextEvent(data);
         // Check current status
         const { data: attendance } = await supabase
            .from('event_attendees')
            .select('status')
            .eq('event_id', data.id)
            .eq('user_id', user.id)
            .single();
         
         if (attendance) setUserStatus(attendance.status);
      }
    };
    
    fetchNextEvent();
  }, [user]);

  const handleRSVP = async (status: 'going' | 'maybe' | 'cant_go') => {
     if (!user || !nextEvent || isUpdating) return;
     
     setIsUpdating(true);
     try {
        const { error } = await supabase
           .from('event_attendees')
           .upsert({
              event_id: nextEvent.id,
              user_id: user.id,
              status: status,
              updated_at: new Date().toISOString(),
           }, { onConflict: 'event_id, user_id' }); // Ensure unique constraint on DB or use policy

        if (error) throw error;
        
        setUserStatus(status);
        if (status === 'going') toast.success(`You're going to ${nextEvent.title}!`);
        else if (status === 'maybe') toast.info(`Marked as maybe for ${nextEvent.title}`);
        else toast.info(`Marked as not going`);

     } catch (err: any) {
        console.error('RSVP Error:', err);
        toast.error('Failed to update status');
     } finally {
        setIsUpdating(false);
     }
  };

  if (!mounted || loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen pb-32 pt-6 px-6 bg-background transition-colors duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#FFD166] to-[#EF476F] p-1 shadow-lg shadow-orange-200/50 dark:shadow-none">
               <div className="h-full w-full rounded-full bg-card border-2 border-card overflow-hidden flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
               </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {user?.email?.split('@')[0]}
            </h1>
          </div>
        </div>
        
        {/* Only ThemeToggle remains here */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Circles Scroller */}
      <div className="mb-10 animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">My Circles</h2>
          <Link href="/circles" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">
            See all
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
          {/* Add New Circle Button */}
          <Link href="/circles/create" className="flex flex-col items-center gap-2 min-w-[80px] snap-center group">
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300 bg-card">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Add New</span>
          </Link>

          {/* Circles List */}
          {circles?.map((circle, idx) => (
            <Link 
              key={circle.id} 
              href={`/circles/${circle.id}`}
              className="flex flex-col items-center gap-2 min-w-[80px] snap-center group"
            >
              <div className={cn(
                "h-16 w-16 rounded-full p-1 shadow-sm transition-transform group-hover:scale-105",
                idx % 3 === 0 ? "bg-gradient-to-tr from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800" :
                idx % 3 === 1 ? "bg-gradient-to-tr from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800" :
                "bg-gradient-to-tr from-orange-100 to-orange-50 dark:from-orange-900 dark:to-orange-800"
              )}>
                 <div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center border-2 border-card shadow-inner">
                    <span className="text-lg font-bold text-foreground">
                      {circle.name.charAt(0).toUpperCase()}
                    </span>
                 </div>
              </div>
              <span className="text-xs font-medium text-foreground truncate max-w-[80px] text-center">
                {circle.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Next Event Card */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <h2 className="text-lg font-bold text-foreground mb-4">Next Event</h2>
        
        {nextEvent ? (
          <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="px-3 py-1.5 rounded-full bg-primary/10 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-bold text-primary tracking-wide uppercase">Happening Soon</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            
            {/* Title & Host */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-1 leading-tight">{nextEvent.title}</h3>
              <p className="text-sm text-muted-foreground">Hosted by {nextEvent.circles?.name || 'Circle'}</p>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 text-orange-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Date & Time</p>
                  <p className="text-sm font-bold text-foreground">
                    {new Date(nextEvent.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' • '}
                    {new Date(nextEvent.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Location</p>
                  <p className="text-sm font-bold text-foreground truncate w-full">
                    {nextEvent.location_name}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-[1.5rem]">
              <button 
                onClick={() => handleRSVP('going')}
                disabled={isUpdating}
                className={cn(
                  "flex-1 py-3 rounded-[1.2rem] font-bold text-sm flex items-center justify-center gap-2 transition-all",
                  userStatus === 'going' 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-mint/40 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                {userStatus === 'going' && <Check className="h-3 w-3" />}
                Going
              </button>
              
              <button 
                onClick={() => handleRSVP('maybe')}
                disabled={isUpdating}
                className={cn(
                  "flex-1 py-3 rounded-[1.2rem] font-bold text-sm flex items-center justify-center gap-2 transition-all",
                  userStatus === 'maybe' 
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 shadow-sm" 
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                Maybe
              </button>
              
              <button 
                onClick={() => handleRSVP('cant_go')}
                disabled={isUpdating}
                className={cn(
                  "flex-1 py-3 rounded-[1.2rem] font-bold text-sm flex items-center justify-center gap-2 transition-all",
                  userStatus === 'cant_go' 
                    ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 shadow-sm" 
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-card p-10 text-center border border-dashed border-border/80">
            <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No upcoming events</h3>
            <p className="text-sm text-muted-foreground mb-6">Join a circle to see events & create new ones</p>
            <Link 
              href="/circles"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[1rem] bg-primary text-primary-foreground font-bold shadow-lg shadow-mint/20 hover:scale-105 transition-transform text-sm"
            >
              Browse Circles
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
