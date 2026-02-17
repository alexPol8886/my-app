import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, EventAttendee } from '@/types';
import type { Database } from '@/lib/database.types';

export function useEvents(circleId: string | undefined) {
  return useQuery({
    queryKey: ['events', circleId],
    queryFn: async () => {
      if (!circleId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('circle_id', circleId)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!circleId,
  });
}

export function useEventAttendees(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event_attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data as EventAttendee[];
    },
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      circleId,
      title,
      description,
      locationName,
      locationLat,
      locationLng,
      startTime,
      endTime,
      creatorId,
    }: {
      circleId: string;
      title: string;
      description?: string;
      locationName: string;
      locationLat?: number;
      locationLng?: number;
      startTime: string;
      endTime?: string;
      creatorId: string;
    }) => {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            circle_id: circleId,
            title,
            description,
            location_name: locationName,
            location_lat: locationLat,
            location_lng: locationLng,
            start_time: startTime,
            end_time: endTime,
            creator_id: creatorId,
          } as any,
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events', data.circle_id] });
    },
  });
}

export function useUpdateEventStatus(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      status,
    }: {
      eventId: string;
      status: 'going' | 'maybe' | 'declined';
    }) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_attendees')
        .upsert(
          [
            {
              event_id: eventId,
              user_id: userId,
              status,
              responded_at: new Date().toISOString(),
            } as any,
          ],
          { onConflict: 'event_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_attendees'] });
    },
  });
}
