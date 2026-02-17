'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

export function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  if (!user || pathname.includes('/auth')) return null;

  return (
    <>
      {/* Spacer to prevent content overlap */}
      <div className="h-28 bg-transparent" />
      
      {/* The Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
        <div className="relative max-w-lg mx-auto bg-card border border-border/40 shadow-xl shadow-black/5 rounded-[2.5rem] h-20 flex items-center justify-between px-6 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95 dark:shadow-black/20">
          
          {/* Left Group */}
          <div className="flex items-center gap-1">
             <Link
               href="/"
               className={cn(
                 "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors rounded-2xl hover:bg-secondary/50 active:scale-95 group",
                 pathname === '/' ? "text-primary" : "text-muted-foreground hover:text-foreground"
               )}
             >
               <Home className={cn("h-6 w-6 transition-transform group-hover:-translate-y-0.5", pathname === '/' && "fill-current")} />
               <span className="text-[10px] font-bold">Home</span>
             </Link>
             
             <Link
               href="/calendar"
               className={cn(
                 "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors rounded-2xl hover:bg-secondary/50 active:scale-95 group",
                 pathname === '/calendar' ? "text-primary" : "text-muted-foreground hover:text-foreground"
               )}
             >
               <Calendar className={cn("h-6 w-6 transition-transform group-hover:-translate-y-0.5", pathname === '/calendar' && "fill-current")} />
               <span className="text-[10px] font-bold">Events</span>
             </Link>
          </div>

          {/* Floating Action Button (FAB) - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <Link
              href="/circles/create"
              aria-label="Create New Circle"
              className="group flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-mint border-[6px] border-background hover:scale-110 active:scale-95 transition-transform duration-300 relative z-10"
            >
              <Plus className="h-8 w-8 stroke-[3px]" />
            </Link>
             {/* Glow Effect behind FAB */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-16 w-16 bg-primary/40 blur-[20px] rounded-full -z-10 animate-pulse pointer-events-none" />
          </div>

          {/* Right Group */}
          <div className="flex items-center gap-1">
             <Link
               href="/notifications"
               className={cn(
                 "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors rounded-2xl hover:bg-secondary/50 active:scale-95 group relative",
                 pathname === '/notifications' ? "text-primary" : "text-muted-foreground hover:text-foreground"
               )}
             >
               <div className="relative">
                  <Bell className={cn("h-6 w-6 transition-transform group-hover:-translate-y-0.5", pathname === '/notifications' && "fill-current")} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-card flex items-center justify-center animate-pulse">
                      {/* Optional: unread count number */}
                    </span>
                  )}
               </div>
               <span className="text-[10px] font-bold">Alerts</span>
             </Link>
             
             <Link
               href="/profile"
               className={cn(
                 "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors rounded-2xl hover:bg-secondary/50 active:scale-95 group",
                 pathname === '/profile' ? "text-primary" : "text-muted-foreground hover:text-foreground"
               )}
             >
               <User className={cn("h-6 w-6 transition-transform group-hover:-translate-y-0.5", pathname === '/profile' && "fill-current")} />
               <span className="text-[10px] font-bold">Profile</span>
             </Link>
          </div>
        </div>
      </div>
    </>
  );
}
