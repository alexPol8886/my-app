import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Ride, RidePassenger } from '@/types';
import type { Database } from '@/lib/database.types';

export function useRides(eventId: string | undefined) {
  return useQuery({
    queryKey: ['rides', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data as Ride[];
    },
    enabled: !!eventId,
  });
}

export function useRidePassengers(rideId: string | undefined) {
  return useQuery({
    queryKey: ['ride_passengers', rideId],
    queryFn: async () => {
      if (!rideId) return [];
      const { data, error } = await supabase
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', rideId);
      if (error) throw error;
      return data as RidePassenger[];
    },
    enabled: !!rideId,
  });
}

export function useCreateRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      driverId,
      originText,
      originLat,
      originLng,
      totalSeats,
    }: {
      eventId: string;
      driverId: string;
      originText: string;
      originLat?: number;
      originLng?: number;
      totalSeats: number;
    }) => {
      const { data, error } = await supabase
        .from('rides')
        .insert([
          {
            event_id: eventId,
            driver_id: driverId,
            origin_text: originText,
            origin_lat: originLat,
            origin_lng: originLng,
            total_seats: totalSeats,
            remaining_seats: totalSeats,
          } as any,
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rides', data.event_id] });
    },
  });
}

export function useJoinRide(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rideId: string) => {
      if (!userId) throw new Error('User not authenticated');

      // Call the RPC function for atomic join
      const { data, error } = await supabase.rpc('join_ride', {
        p_ride_id: rideId,
        p_passenger_id: userId,
        p_pickup_location: null, // Optional pickup location
      });

      if (error) throw error;
      if (data && data[0] && !data[0].success) {
        throw new Error(data[0].message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride_passengers'] });
    },
  });
}

export function useLeaveRide(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rideId: string) => {
      if (!userId) throw new Error('User not authenticated');

      // Call the RPC function for atomic leave
      const { data, error } = await supabase.rpc('leave_ride', {
        p_ride_id: rideId,
        p_passenger_id: userId,
      });

      if (error) throw error;
      if (data && data[0] && !data[0].success) {
        throw new Error(data[0].message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride_passengers'] });
    },
  });
}
