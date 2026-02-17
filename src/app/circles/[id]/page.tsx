'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Users, Copy, Check, Calendar, ArrowRight, MapPin, Clock, Plus, Settings, Lock, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { Circle } from '@/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

interface CircleMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  users?: {
    id: string;
    email?: string;
  };
}

interface Event {
  id: string;
  title: string;
  location_name: string;
  start_time: string;
}

export default function CircleDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const circleId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  useEffect(() => {
    if (user && circleId) {
      fetchCircleData();
    }
  }, [user, circleId]);

  const fetchCircleData = async () => {
    try {
      setIsLoading(true);
      
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', circleId)
        .single();

      if (circleError) throw circleError;
      setCircle(circleData as Circle);

      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select('*, users:user_id(email)')
        .eq('circle_id', circleId);

      if (!membersError) {
        const mappedMembers = membersData.map((member: any) => ({
          id: `${member.circle_id}-${member.user_id}`,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          users: {
            id: member.user_id,
            email: member.users?.email
          },
        }));
        setMembers(mappedMembers);
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, location_name, start_time')
        .eq('circle_id', circleId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (!eventsError) {
        setUpcomingEvents(eventsData as Event[] || []);
      }
    } catch (error) {
      console.error('Error fetching circle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (circle?.invite_code) {
      await navigator.clipboard.writeText(circle.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted || loading || isLoading || !circle) {
    return null;
  }

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin' || circle.creator_id === user?.id;
  const canCreateEvents = circle.who_can_create_events === 'all' || isAdmin;
  const canInvite = circle.who_can_invite === 'all' || isAdmin;

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-300">
      {/* Header */}
      <div className="pt-6 px-6 pb-4 flex items-center justify-between">
        <Link href="/" className="p-3 rounded-[1.2rem] bg-card border border-border/50 text-foreground shadow-sm hover:shadow-md transition-all">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        
        <div className="flex items-center gap-2">
           <ThemeToggle />
           {isAdmin && (
            <Link href={`/circles/${circleId}/settings`} className="p-3 rounded-[1.2rem] bg-card border border-border/50 text-foreground shadow-sm hover:shadow-md transition-all">
              <Settings className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      <div className="px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Circle Hero Info */}
        <div className="text-center space-y-4">
           <div className="relative mx-auto h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center shadow-mint">
              <span className="text-4xl font-bold text-primary">
                {circle.name.charAt(0).toUpperCase()}
              </span>
              {circle.is_private && (
                 <div className="absolute -bottom-2 -right-2 bg-card p-1.5 rounded-full border border-border shadow-sm">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                 </div>
              )}
           </div>
           
           <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{circle.name}</h1>
              {circle.description && (
                 <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                    {circle.description}
                 </p>
              )}
           </div>
           
           <div className="flex items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary">
                 <Users className="h-4 w-4" />
                 <span>{members.length} Members</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary">
                 <Calendar className="h-4 w-4" />
                 <span>{upcomingEvents.length} Events</span>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
           {canCreateEvents && (
              <Link 
                 href={`/circles/${circleId}/events/create`}
                 className="flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-primary text-primary-foreground shadow-lg shadow-mint/30 hover:shadow-mint/50 hover:scale-[1.02] transition-all"
              >
                 <Plus className="h-8 w-8" />
                 <span className="font-bold text-sm">New Event</span>
              </Link>
           )}
           
           <Link 
              href={`/circles/${circleId}/events`}
              className={cn(
                 "flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-card border border-border/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all",
                 !canCreateEvents && "col-span-2 flex-row gap-4"
              )}
           >
              <Calendar className="h-8 w-8 text-indigo-400" />
              <span className="font-bold text-sm text-foreground">Calendar</span>
           </Link>
           
           {!canCreateEvents && isAdmin && (
              <Link 
                 href={`/circles/${circleId}/settings`}
                 className="flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-card border border-border/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
              >
                 <Settings className="h-8 w-8 text-orange-400" />
                 <span className="font-bold text-sm text-foreground">Settings</span>
              </Link>
           )}
        </div>

        {/* Upcoming Events List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Upcoming</h2>
              {upcomingEvents.length > 0 && (
                 <Link href={`/circles/${circleId}/events`} className="text-sm text-primary font-medium hover:opacity-80">
                    See All
                 </Link>
              )}
           </div>
           
           {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                 {upcomingEvents.map((event) => (
                    <Link
                       key={event.id}
                       href={`/circles/${circleId}/events/${event.id}`}
                       className="flex items-center gap-4 p-4 rounded-[1.8rem] bg-card border border-border/40 shadow-sm hover:shadow-md transition-all group"
                    >
                       <div className="h-14 w-14 rounded-[1.2rem] bg-secondary flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary/70">
                             {new Date(event.start_time).toLocaleString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-xl font-bold text-foreground group-hover:text-primary">
                             {new Date(event.start_time).getDate()}
                          </span>
                       </div>
                       
                       <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground truncate">{event.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                             <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                             <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3" />
                                {event.location_name}
                             </span>
                          </div>
                       </div>
                    </Link>
                 ))}
              </div>
           ) : (
              <div className="p-8 rounded-[2rem] bg-secondary/30 border border-dashed border-border text-center">
                 <p className="text-muted-foreground text-sm">No upcoming events scheduled</p>
              </div>
           )}
        </div>

        {/* Invite Code */}
        {canInvite && (
           <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
              <div className="flex items-center justify-between mb-4">
                 <div>
                    <h3 className="font-bold text-foreground">Invite Friends</h3>
                    <p className="text-xs text-muted-foreground">Share this code to add members</p>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-indigo-500" />
                 </div>
              </div>
              
              <div className="flex gap-2">
                 <div className="flex-1 px-4 py-3 bg-white dark:bg-black/20 rounded-[1.2rem] border border-indigo-100 dark:border-white/5 flex items-center justify-center">
                    <code className="text-xl font-mono font-bold text-indigo-500 tracking-widest">{circle.invite_code}</code>
                 </div>
                 <button 
                    onClick={copyInviteCode}
                    className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[1.2rem] font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                 >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                 </button>
              </div>
           </div>
        )}

        {/* Members List Preview */}
        <div className="space-y-4">
           <h2 className="text-lg font-bold text-foreground">Members</h2>
           <div className="flex flex-wrap gap-2">
              {members.slice(0, 5).map((member, i) => (
                 <div key={member.id} className="flex items-center gap-2 pr-4 pl-1 py-1 rounded-full bg-card border border-border/50 shadow-sm">
                    <div className={cn(
                       "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm",
                       i % 3 === 0 ? "bg-orange-400" : i % 3 === 1 ? "bg-blue-400" : "bg-pink-400"
                    )}>
                       {(member.users?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-foreground max-w-[80px] truncate">
                       {member.users?.email?.split('@')[0]}
                    </span>
                 </div>
              ))}
              {members.length > 5 && (
                 <div className="flex items-center justify-center px-3 py-1 rounded-full bg-secondary border border-border/50 text-xs font-bold text-muted-foreground">
                    +{members.length - 5}
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
