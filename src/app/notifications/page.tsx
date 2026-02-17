'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Calendar, UserPlus, Check, Info, Clock, CheckCircle2, FlaskConical } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Import supabase directly for simulation

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  // DEV FUNCTION: Simulate a notification
  const simulateNotification = async () => {
    if (!user) return;
    
    try {
       const { error } = await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'system',
          title: 'System Test',
          message: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
          is_read: false,
          // circle_id, event_id are optional
       });
       
       if (error) {
          alert('Error creating notification: ' + error.message);
       }
    } catch (err) {
       console.error(err);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_create': return <Calendar className="h-5 w-5" />;
      case 'circle_invite': return <UserPlus className="h-5 w-5" />;
      case 'member_join': return <UserPlus className="h-5 w-5" />;
      case 'system': return <Info className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getColors = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return 'bg-secondary text-muted-foreground border-transparent';
    
    switch (type) {
      case 'event_create': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'circle_invite': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'member_join': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!mounted || loading) return null;

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 bg-background transition-colors duration-300">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-foreground">Activity</h1>
              <p className="text-muted-foreground text-sm">
                 {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
              </p>
           </div>
           <div className="flex items-center gap-2">
              <ThemeToggle />
              
              {/* Test Button - Only to verify setup */}
              <button 
                onClick={simulateNotification}
                className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"
                title="Simulate Test Notification"
              >
                <FlaskConical className="h-5 w-5" />
              </button>

              {unreadCount > 0 && (
                 <button 
                    onClick={() => markAllAsRead()}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                    title="Mark all as read"
                 >
                    <CheckCircle2 className="h-5 w-5" />
                 </button>
              )}
           </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-secondary/50 rounded-[1rem] border border-border/50">
           <button 
              onClick={() => setActiveTab('all')}
              className={cn(
                 "flex-1 py-2.5 rounded-[0.8rem] text-sm font-bold transition-all relative z-10",
                 activeTab === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
           >
              All
           </button>
           <button 
              onClick={() => setActiveTab('unread')}
              className={cn(
                 "flex-1 py-2.5 rounded-[0.8rem] text-sm font-bold transition-all relative z-10",
                 activeTab === 'unread' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
           >
              Unread
              {unreadCount > 0 && (
                 <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-destructive text-white rounded-full">{unreadCount}</span>
              )}
           </button>
        </div>

        {/* List */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 min-h-[300px]">
           {isLoading ? (
              <div className="py-20 text-center">
                 <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
           ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                 <div 
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={cn(
                       "relative p-5 rounded-[2rem] border transition-all cursor-pointer group",
                       notif.is_read 
                          ? 'bg-card border-border/40 hover:bg-secondary/30' 
                          : 'bg-card border-l-4 border-l-primary shadow-sm hover:shadow-md border-y-border/50 border-r-border/50'
                    )}
                 >
                    <div className="flex gap-4">
                       <div className={cn(
                          "h-12 w-12 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 border transition-colors",
                          getColors(notif.type, notif.is_read)
                       )}>
                          {getIcon(notif.type)}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground mb-0.5 block">
                             {getTimeAgo(notif.created_at)}
                          </span>
                          <h3 className={cn("font-bold text-lg leading-tight mb-1 truncate", notif.is_read ? "text-muted-foreground" : "text-foreground")}>
                             {notif.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                             {notif.message}
                          </p>
                          
                          {notif.link && (
                             <Link 
                                href={notif.link} 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   markAsRead(notif.id);
                                }}
                                className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:underline"
                             >
                                View Details
                             </Link>
                          )}
                       </div>
                       
                       {!notif.is_read && (
                          <div className="self-center">
                             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          </div>
                       )}
                    </div>
                 </div>
              ))
           ) : (
              <div className="py-20 text-center">
                 <div className="h-20 w-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bell className="h-10 w-10 text-muted-foreground opacity-50" />
                 </div>
                 <h3 className="text-lg font-bold text-foreground mb-2">No notifications yet</h3>
                 <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    {activeTab === 'unread' 
                       ? "You've read all your updates!" 
                       : "Use the test button (Flask icon) to simulate a notification."}
                 </p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}
