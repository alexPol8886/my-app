'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useJoinRide, useLeaveRide } from '@/hooks/useRides';
import { ArrowLeft, Car, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

interface Ride {
  id: string;
  driver_id: string;
  origin_text: string;
  total_seats: number;
  remaining_seats: number;
}

interface RidePassenger {
  ride_id: string;
  passenger_id: string;
}

export default function RidesListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  const circleId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<RidePassenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningRideId, setJoiningRideId] = useState<string | null>(null);
  const [leavingRideId, setLeavingRideId] = useState<string | null>(null);
  
  const joinRide = useJoinRide(user?.id);
  const leaveRide = useLeaveRide(user?.id);

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
      fetchRides();
    }
  }, [user, eventId]);

  const fetchRides = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all rides for this event
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .eq('event_id', eventId);

      if (ridesError) throw ridesError;
      setRides(ridesData as Ride[] || []);

      // Fetch my ride memberships
      const { data: passengersData } = await supabase
        .from('ride_passengers')
        .select('*')
        .eq('passenger_id', user?.id);

      setMyRides(passengersData as RidePassenger[] || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRide = async (rideId: string) => {
    setJoiningRideId(rideId);
    try {
      await joinRide.mutateAsync(rideId);
      await fetchRides(); // Refresh
    } catch (error) {
      console.error('Error joining ride:', error);
      alert('Failed to join ride. It might be full.');
    } finally {
      setJoiningRideId(null);
    }
  };

  const handleLeaveRide = async (rideId: string) => {
    setLeavingRideId(rideId);
    try {
      await leaveRide.mutateAsync(rideId);
      await fetchRides(); // Refresh
    } catch (error) {
      console.error('Error leaving ride:', error);
    } finally {
      setLeavingRideId(null);
    }
  };

  const isInRide = (rideId: string) => {
    return myRides.some(mr => mr.ride_id === rideId);
  };

  const isMyRide = (ride: Ride) => {
    return ride.driver_id === user?.id;
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
          <p className="text-zinc-400">Loading rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/circles/${circleId}/events/${eventId}`} className="p-2 hover:bg-zinc-800 rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Find a Ride 🎒</h1>
            <p className="text-sm text-zinc-400">{rides.length} ride{rides.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>

        {/* Rides List */}
        {rides.length > 0 ? (
          <div className="space-y-3">
            {rides.map((ride) => {
              const inRide = isInRide(ride.id);
              const myRide = isMyRide(ride);
              const isFull = ride.remaining_seats === 0;

              return (
                <div
                  key={ride.id}
                  className={`rounded-lg border p-4 space-y-3 ${
                    myRide
                      ? 'border-cyan-500 bg-cyan-600/10'
                      : inRide
                      ? 'border-green-500 bg-green-600/10'
                      : 'border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        myRide ? 'bg-cyan-600/20' : inRide ? 'bg-green-600/20' : 'bg-purple-600/20'
                      }`}>
                        <Car className={`h-5 w-5 ${
                          myRide ? 'text-cyan-400' : inRide ? 'text-green-400' : 'text-purple-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-zinc-400" />
                          <p className="font-medium">{ride.origin_text}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-zinc-400" />
                          <p className={isFull ? 'text-red-400' : 'text-zinc-400'}>
                            {ride.remaining_seats} / {ride.total_seats} seats available
                          </p>
                        </div>
                        {myRide && (
                          <p className="text-xs text-cyan-400 mt-1">Your ride</p>
                        )}
                        {inRide && !myRide && (
                          <p className="text-xs text-green-400 mt-1">✓ You're in this ride</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!myRide && (
                    <div>
                      {inRide ? (
                        <button
                          onClick={() => handleLeaveRide(ride.id)}
                          disabled={leavingRideId === ride.id}
                          className="w-full rounded-lg bg-red-600 hover:bg-red-700 py-2 text-sm font-medium transition disabled:opacity-50"
                        >
                          {leavingRideId === ride.id ? 'Leaving...' : 'Leave Ride'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinRide(ride.id)}
                          disabled={isFull || joiningRideId === ride.id}
                          className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 py-2 text-sm font-medium transition disabled:opacity-50"
                        >
                          {joiningRideId === ride.id
                            ? 'Joining...'
                            : isFull
                            ? 'Full'
                            : 'Join Ride'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-700 border-dashed p-8 text-center">
            <Car className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No rides available yet</p>
            <Link
              href={`/circles/${circleId}/events/${eventId}/offer-ride`}
              className="inline-block rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-700 transition"
            >
              Be the first to offer a ride
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
