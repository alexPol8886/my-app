'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateEvent } from '@/hooks/useEvents';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Lock, Calendar, MapPin, AlignLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CreateEventPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const circleId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  
  const createEvent = useCreateEvent();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  // Check permissions
  useEffect(() => {
    if (user && circleId) {
      checkPermission();
    }
  }, [user, circleId]);

  const checkPermission = async () => {
    try {
      const { data: circle } = await supabase
        .from('circles')
        .select('who_can_create_events, creator_id')
        .eq('id', circleId)
        .single();

      if (!circle) { setCanCreate(false); return; }

      // If everyone can create, allow
      if (circle.who_can_create_events === 'all' || !circle.who_can_create_events) {
        setCanCreate(true);
        return;
      }

      // If admin only, check role
      if (circle.creator_id === user?.id) {
        setCanCreate(true);
        return;
      }

      const { data: member } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', circleId)
        .eq('user_id', user?.id)
        .single();

      setCanCreate(member?.role === 'admin');
    } catch {
      setCanCreate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!title.trim()) { setError('Event title is required'); return; }
    if (!locationName.trim()) { setError('Location is required'); return; }
    if (!startTime) { setError('Start time is required'); return; }
    if (new Date(startTime) <= new Date()) { setError('Start time must be in the future'); return; }
    if (endTime && new Date(endTime) <= new Date(startTime)) { setError('End time must be after start time'); return; }

    try {
      await createEvent.mutateAsync({
        circleId,
        title: title.trim(),
        description: description.trim() || undefined,
        locationName: locationName.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        creatorId: user!.id,
      });
      router.push(`/circles/${circleId}/events`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    }
  };

  if (!mounted || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (canCreate === false) {
    return (
      <div className="min-h-screen pb-8 px-6 pt-10 bg-background flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-[2rem] bg-secondary flex items-center justify-center mb-6">
           <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">Only admins can create events in this circle</p>
        <Link
          href={`/circles/${circleId}`}
          className="px-8 py-4 rounded-[1.5rem] bg-primary text-primary-foreground font-bold shadow-lg shadow-mint/30 hover:shadow-mint/50 transition-all hover:scale-[1.02]"
        >
          Back to Circle
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 bg-background transition-colors duration-300">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 px-2">
          <Link href={`/circles/${circleId}/events`} className="p-3 rounded-[1.2rem] bg-card border border-border/50 text-foreground shadow-sm hover:shadow-md transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
        </div>

        {/* Form Card */}
        <div className="p-6 rounded-[2.5rem] bg-card border border-border/50 shadow-sm">
           <form onSubmit={handleSubmit} className="space-y-6">
             {error && (
               <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 text-destructive text-sm font-medium">
                 <div className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                 {error}
               </div>
             )}
   
             <div className="space-y-4">
                {/* Title */}
               <div className="space-y-2">
                 <label htmlFor="title" className="text-sm font-bold text-foreground ml-1">Event Title</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                       <Calendar className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Friday Night Hangout"
                      className="w-full pl-12 pr-4 py-4 rounded-[1.2rem] bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground placeholder-muted-foreground font-medium outline-none"
                      disabled={createEvent.isPending}
                    />
                 </div>
               </div>
   
               {/* Description */}
               <div className="space-y-2">
                 <label htmlFor="description" className="text-sm font-bold text-foreground ml-1">Description</label>
                 <div className="relative">
                    <div className="absolute left-4 top-4 text-muted-foreground">
                       <AlignLeft className="h-5 w-5" />
                    </div>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's the plan?"
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 rounded-[1.2rem] bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground placeholder-muted-foreground font-medium outline-none resize-none"
                      disabled={createEvent.isPending}
                    />
                 </div>
               </div>
   
               {/* Location */}
               <div className="space-y-2">
                 <label htmlFor="location" className="text-sm font-bold text-foreground ml-1">Location</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                       <MapPin className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g., Central Park"
                      className="w-full pl-12 pr-4 py-4 rounded-[1.2rem] bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground placeholder-muted-foreground font-medium outline-none"
                      disabled={createEvent.isPending}
                    />
                 </div>
               </div>
   
               <div className="grid grid-cols-1 gap-4">
                  {/* Start Time */}
                 <div className="space-y-2">
                   <label htmlFor="startTime" className="text-sm font-bold text-foreground ml-1">Start Time</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                         <Clock className="h-5 w-5" />
                      </div>
                      <input
                        type="datetime-local"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-[1.2rem] bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground font-medium outline-none appearance-none"
                        disabled={createEvent.isPending}
                      />
                   </div>
                 </div>
                 
                  {/* End Time */}
                 <div className="space-y-2">
                   <label htmlFor="endTime" className="text-sm font-bold text-foreground ml-1">End Time <span className="text-muted-foreground font-normal">(Optional)</span></label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                         <Clock className="h-5 w-5" />
                      </div>
                      <input
                        type="datetime-local"
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-[1.2rem] bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground font-medium outline-none appearance-none"
                        disabled={createEvent.isPending}
                      />
                   </div>
                 </div>
               </div>
             </div>
   
             <button
               type="submit"
               disabled={createEvent.isPending}
               className="w-full py-4 rounded-[1.5rem] bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-mint/30 hover:shadow-mint/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all mt-4"
             >
               {createEvent.isPending ? 'Creating...' : 'Create Event'}
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}
