'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, MapPin, Users, Car, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description?: string;
  location_name: string;
  start_time: string;
  end_time?: string;
  creator_id: string;
  circle_id: string;
}

interface Attendee {
  user_id: string;
  status: 'going' | 'maybe' | 'declined';
}

interface Ride {
  id: string;
  driver_id: string;
  origin_text: string;
  total_seats: number;
  remaining_seats: number;
}

export default function EventDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  const circleId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [myAttendance, setMyAttendance] = useState<Attendee | null>(null);
  const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRideOptions, setShowRideOptions] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  useEffect(() => {
    if (user && eventId) {
      fetchData();
    }
  }, [user, eventId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData as Event);

      // Fetch my attendance
      const { data: attendanceData } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user?.id)
        .maybeSingle();

      setMyAttendance(attendanceData as Attendee | null);

      // Fetch ALL attendees
      const { data: allAttendeesData } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId);

      setAllAttendees(allAttendeesData as Attendee[] || []);

      // Fetch rides
      const { data: ridesData } = await supabase
        .from('rides')
        .select('*')
        .eq('event_id', eventId);

      setRides(ridesData as Ride[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'declined') => {
    if (!user) return;

    try {
      if (myAttendance) {
        // Update existing RSVP
        await supabase
          .from('event_attendees')
          .update({ status })
          .eq('event_id', eventId)
          .eq('user_id', user.id);
      } else {
        // Create new RSVP
        await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status,
          });
      }

      setMyAttendance({ user_id: user.id, status });
      
      // Show ride options if going
      if (status === 'going') {
        setShowRideOptions(true);
      } else {
        setShowRideOptions(false);
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
          <p className="text-zinc-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pb-8 px-4">
        <div className="max-w-md mx-auto">
          <p className="text-center text-zinc-400">Event not found</p>
        </div>
      </div>
    );
  }

  const isGoing = myAttendance?.status === 'going';

  return (
    <div className="min-h-screen pb-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/circles/${circleId}/events`} className="p-2 hover:bg-zinc-800 rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{event.title}</h1>
        </div>

        {/* Event Details */}
        <div className="rounded-lg border border-zinc-700 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-medium">When</p>
              <p className="text-sm text-zinc-400">{formatDate(event.start_time)}</p>
              {event.end_time && (
                <p className="text-sm text-zinc-400">Until {formatDate(event.end_time)}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-medium">Where</p>
              <p className="text-sm text-zinc-400">{event.location_name}</p>
            </div>
          </div>

          {event.description && (
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-sm text-zinc-300">{event.description}</p>
            </div>
          )}
        </div>

        {/* RSVP Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Are you going?</h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleRSVP('going')}
              className={`rounded-lg border p-3 transition ${
                myAttendance?.status === 'going'
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-zinc-700 hover:border-green-500'
              }`}
            >
              <CheckCircle className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Going</span>
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              className={`rounded-lg border p-3 transition ${
                myAttendance?.status === 'maybe'
                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                  : 'border-zinc-700 hover:border-yellow-500'
              }`}
            >
              <HelpCircle className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Maybe</span>
            </button>
            <button
              onClick={() => handleRSVP('declined')}
              className={`rounded-lg border p-3 transition ${
                myAttendance?.status === 'declined'
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-zinc-700 hover:border-red-500'
              }`}
            >
              <XCircle className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Can't Go</span>
            </button>
          </div>
        </div>

        {/* Lift Engine - Optional Section */}
        {isGoing && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 p-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Car className="h-5 w-5 text-cyan-400" />
                Ride Coordination (Optional)
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                Need a ride or can offer one? Coordinate transportation with other attendees.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/circles/${circleId}/events/${eventId}/offer-ride`}
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-3 text-center font-medium transition text-sm"
                >
                  🚗 I'm Driving
                </Link>
                <Link
                  href={`/circles/${circleId}/events/${eventId}/rides`}
                  className="rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-3 text-center font-medium transition text-sm"
                >
                  🎒 Need a Ride
                </Link>
              </div>

              <p className="text-xs text-zinc-500 mt-3 text-center">
                Coming by public transport or on your own? No problem! This is completely optional.
              </p>
            </div>

            {/* Available Rides Preview */}
            {rides.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-zinc-400">Available Rides ({rides.length})</h3>
                <div className="space-y-2">
                  {rides.slice(0, 3).map((ride) => (
                    <div
                      key={ride.id}
                      className="rounded-lg border border-zinc-700 p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-600/20">
                          <Car className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">From: {ride.origin_text}</p>
                          <p className="text-xs text-zinc-500">
                            {ride.remaining_seats} / {ride.total_seats} seats available
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {rides.length > 3 && (
                  <Link
                    href={`/circles/${circleId}/events/${eventId}/rides`}
                    className="block text-center text-sm text-cyan-400 hover:text-cyan-300 transition"
                  >
                    View all {rides.length} rides →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Attendees Section - מי בא */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Who's Coming?</h2>
            <span className="text-xs bg-zinc-700 px-2 py-1 rounded-full">
              {allAttendees.length}
            </span>
          </div>

          {allAttendees.length > 0 ? (
            <div className="space-y-3">
              {/* Going */}
              {allAttendees.filter(a => a.status === 'going').length > 0 && (
                <div className="rounded-lg border border-green-500/30 bg-green-600/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <h3 className="text-sm font-semibold text-green-400">
                      Going ({allAttendees.filter(a => a.status === 'going').length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allAttendees
                      .filter(a => a.status === 'going')
                      .map((attendee) => (
                        <div
                          key={attendee.user_id}
                          className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-3 py-1.5 border border-zinc-700"
                        >
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                            {attendee.user_id === user?.id ? 'Y' : '?'}
                          </div>
                          <span className="text-sm">
                            {attendee.user_id === user?.id ? 'You' : `User ${attendee.user_id.substring(0, 6)}...`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Maybe */}
              {allAttendees.filter(a => a.status === 'maybe').length > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-600/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="h-4 w-4 text-yellow-400" />
                    <h3 className="text-sm font-semibold text-yellow-400">
                      Maybe ({allAttendees.filter(a => a.status === 'maybe').length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allAttendees
                      .filter(a => a.status === 'maybe')
                      .map((attendee) => (
                        <div
                          key={attendee.user_id}
                          className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-3 py-1.5 border border-zinc-700"
                        >
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                            {attendee.user_id === user?.id ? 'Y' : '?'}
                          </div>
                          <span className="text-sm">
                            {attendee.user_id === user?.id ? 'You' : `User ${attendee.user_id.substring(0, 6)}...`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Declined */}
              {allAttendees.filter(a => a.status === 'declined').length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-600/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-red-400">
                      Can't Go ({allAttendees.filter(a => a.status === 'declined').length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allAttendees
                      .filter(a => a.status === 'declined')
                      .map((attendee) => (
                        <div
                          key={attendee.user_id}
                          className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-3 py-1.5 border border-zinc-700"
                        >
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                            {attendee.user_id === user?.id ? 'Y' : '?'}
                          </div>
                          <span className="text-sm opacity-60">
                            {attendee.user_id === user?.id ? 'You' : `User ${attendee.user_id.substring(0, 6)}...`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-700 border-dashed p-6 text-center">
              <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No RSVPs yet</p>
              <p className="text-xs text-zinc-500 mt-1">Be the first to respond!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
