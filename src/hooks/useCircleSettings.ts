import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CircleSettings {
    is_private: boolean;
    who_can_invite: 'admin' | 'all';
    who_can_create_events: 'admin' | 'all';
}

export function useUpdateCircleSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ circleId, settings }: { circleId: string; settings: CircleSettings }) => {
            const { data, error } = await supabase
                .from('circles')
                .update(settings)
                .eq('id', circleId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalidate circle queries
            queryClient.invalidateQueries({ queryKey: ['circle', variables.circleId] });
            queryClient.invalidateQueries({ queryKey: ['circles'] });
        },
    });
}
