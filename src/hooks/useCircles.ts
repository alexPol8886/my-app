import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Circle } from '@/types';
import type { Database } from '@/lib/database.types';

export function useCircles(userId: string | undefined) {
  return useQuery({
    queryKey: ['circles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get circles where user is the creator
      const { data: createdCircles, error: createdError } = await supabase
        .from('circles')
        .select('*')
        .eq('creator_id', userId);
      
      if (createdError) throw createdError;

      // Get circles where user is a member
      const { data: memberCircles, error: memberError } = await supabase
        .from('circle_members')
        .select('circle_id, circles(*)')
        .eq('user_id', userId);
      
      if (memberError) throw memberError;

      // Combine and deduplicate circles
      const circleMap = new Map<string, Circle>();
      
      // Add created circles
      if (createdCircles) {
        createdCircles.forEach(circle => {
          circleMap.set(circle.id, circle as Circle);
        });
      }
      
      // Add member circles
      if (memberCircles) {
        memberCircles.forEach((member: any) => {
          if (member.circles) {
            circleMap.set(member.circles.id, member.circles as Circle);
          }
        });
      }
      
      return Array.from(circleMap.values());
    },
    enabled: !!userId,
  });
}

export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      creatorId,
    }: {
      name: string;
      description?: string;
      creatorId: string;
    }) => {
      // Generate invite code
      const { data: codeData, error: rpcError } = await supabase.rpc('generate_invite_code');
      if (rpcError) throw rpcError;
      const inviteCode = (codeData as unknown as string) || '';

      const { data, error } = await supabase
        .from('circles')
        .insert([
          {
            name,
            description,
            invite_code: inviteCode,
            creator_id: creatorId,
          } as any,
        ])
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from('circle_members').insert([
        {
          circle_id: data.id,
          user_id: creatorId,
          role: 'admin',
        } as any,
      ]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
    },
  });
}

export function useJoinCircle(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!userId) throw new Error('User not authenticated');

      // Find circle by invite code
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (circleError) throw circleError;

      // Add user to circle
      const { data, error } = await supabase
        .from('circle_members')
        .insert([
          {
            circle_id: circleData.id,
            user_id: userId,
            role: 'member',
          } as any,
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
    },
  });
}
