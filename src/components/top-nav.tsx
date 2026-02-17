'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, User, Menu, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for glass bar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't show on auth pages
  if (pathname.startsWith('/auth/')) {
    return null;
  }

  return (
    <>
      {/* Floating Glass Navbar */}
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-4",
          scrolled ? "pb-4" : "pb-0"
        )}
      >
        <div 
          className={cn(
            "max-w-6xl mx-auto flex items-center justify-between h-16 px-4 rounded-3xl transition-all duration-300 border",
            scrolled 
              ? "bg-[#0a0a1a]/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-900/20" 
              : "bg-transparent border-transparent"
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-80 blur-sm"></div>
              <div className="relative h-full w-full bg-[#0a0a1a] rounded-xl border border-white/10 flex items-center justify-center font-bold text-lg text-white">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <span className={cn(
              "font-bold text-xl tracking-tight transition-opacity duration-300 hidden sm:block",
              scrolled ? "text-white" : "text-white/90"
            )}>
              CircleSync
            </span>
          </Link>

          {/* Desktop Navigation - Pill Style */}
          <div className="hidden md:flex items-center bg-white/5 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium relative',
                    isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/50 to-purple-600/50 rounded-full blur-md -z-10" />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 rounded-full border border-white/10 -z-5" />
                  )}
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button - Glass */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-colors backdrop-blur-md"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown - Glass Effect */}
        <div 
          className={cn(
            "md:hidden absolute top-24 left-4 right-4 rounded-3xl bg-[#0a0a1a]/95 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-top",
            mobileMenuOpen 
              ? "opacity-100 scale-100 translate-y-0 max-h-[400px]" 
              : "opacity-0 scale-95 -translate-y-4 max-h-0 pointer-events-none"
          )}
        >
          <div className="p-2 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-medium',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-900/40 to-purple-900/40 text-cyan-400 border border-cyan-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-lg">{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-24"></div>
    </>
  );
}
