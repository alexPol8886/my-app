'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on auth pages
  if (pathname.startsWith('/auth/')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl z-50">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-0',
                isActive
                  ? 'text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className="text-xs font-medium truncate">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
