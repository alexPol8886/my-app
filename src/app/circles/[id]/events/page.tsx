'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import type { Circle } from '@/types';

interface Event {
  id: string;
  title: string;
  description?: string;
  location_name: string;
  start_time: string;
  end_time?: string;
  creator_id: string;
}

export default function CircleEventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const circleId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('member');

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
      fetchData();
    }
  }, [user, circleId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch circle details
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', circleId)
        .single();

      if (circleError) throw circleError;
      setCircle(circleData as Circle);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('circle_id', circleId)
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData as Event[]);

      // Check user role
      if (circleData.creator_id === user?.id) {
        setUserRole('admin');
      } else {
        const { data: member } = await supabase
          .from('circle_members')
          .select('role')
          .eq('circle_id', circleId)
          .eq('user_id', user?.id)
          .single();
        setUserRole(member?.role || 'member');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (!mounted || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-cyan-600 animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-cyan-600 animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading events...</p>
        </div>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => isUpcoming(e.start_time));
  const pastEvents = events.filter(e => !isUpcoming(e.start_time));
  const canCreateEvents = circle?.who_can_create_events === 'all' || !circle?.who_can_create_events || userRole === 'admin';

  return (
    <div className="min-h-screen pb-20 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/circles/${circleId}`} className="p-2 hover:bg-zinc-800 rounded-lg transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{circle?.name}</h1>
              <p className="text-sm text-zinc-400">Events</p>
            </div>
          </div>
          {canCreateEvents && (
            <Link
              href={`/circles/${circleId}/events/create`}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Upcoming Events
              <span className="text-xs bg-cyan-600 px-2 py-1 rounded-full">
                {upcomingEvents.length}
              </span>
            </h2>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/circles/${circleId}/events/${event.id}`}
                  className="block rounded-lg border border-zinc-700 p-4 hover:border-cyan-500 transition bg-zinc-900"
                >
                  <h3 className="font-medium text-lg mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.start_time)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location_name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-400">
              Past Events
            </h2>
            <div className="space-y-2">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/circles/${circleId}/events/${event.id}`}
                  className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-600 transition opacity-60"
                >
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="space-y-1 text-sm text-zinc-500 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.start_time)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="rounded-lg border border-zinc-700 border-dashed p-8 text-center">
            <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No events yet</p>
            {canCreateEvents && (
              <Link
                href={`/circles/${circleId}/events/create`}
                className="inline-block rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-700 transition"
              >
                Create First Event
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
