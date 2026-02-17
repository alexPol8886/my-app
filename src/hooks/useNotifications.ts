import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Notification {
    id: string;
    user_id: string;
    circle_id?: string;
    event_id?: string;
    type: 'event_create' | 'circle_invite' | 'member_join' | 'system';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false); // Only update unread ones

            if (error) throw error;
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            // Revert on error if needed, but fetch usually syncs it
            fetchNotifications();
        }
    };

    const markAsRead = async (id: string) => {
        if (!user) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error(`Failed to mark notification ${id} as read:`, error);
            fetchNotifications();
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Setup Realtime Subscription
            const channel = supabase
                .channel('public:notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev]);
                        setUnreadCount((count) => count + 1);

                        // Audio cue or subtle shake could happen here
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications
    };
}
