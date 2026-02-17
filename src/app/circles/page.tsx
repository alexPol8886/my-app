'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCircles } from '@/hooks/useCircles';
import Link from 'next/link';
import { Plus, Users, Search, MoreHorizontal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function CirclesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: circles, isLoading } = useCircles(user?.id);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  const filteredCircles = circles?.filter(circle => 
    circle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted || loading) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background">
           <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-primary animate-spin"></div>
        </div>
     );
  }

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 bg-background transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-foreground">My Circles</h1>
              <p className="text-muted-foreground text-sm">
                 You are in {circles?.length || 0} circles
              </p>
           </div>
           <ThemeToggle />
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input 
                 type="text" 
                 placeholder="Search circles..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-12 pr-4 py-3 rounded-[1.2rem] bg-card border border-border/50 focus:border-primary/50 focus:ring-2 ring-primary/10 outline-none transition-all text-foreground placeholder-muted-foreground"
              />
           </div>
           <Link 
              href="/circles/join" 
              className="p-3 rounded-[1.2rem] bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all border border-border/50"
              title="Join via Code"
           >
              <MoreHorizontal className="h-5 w-5" />
           </Link>
        </div>

        {/* Circles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
           {/* New Circle Card */}
           <Link 
              href="/circles/create"
              className="flex flex-col items-center justify-center p-6 min-h-[160px] rounded-[2rem] border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all group text-center"
           >
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-3">
                 <Plus className="h-6 w-6 text-muted-foreground group-hover:text-inherit" />
              </div>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Create New Circle</h3>
              <p className="text-xs text-muted-foreground mt-1">Start a group for your friends</p>
           </Link>

           {/* List of Circles */}
           {filteredCircles?.map((circle, idx) => (
              <Link 
                 key={circle.id} 
                 href={`/circles/${circle.id}`}
                 className="flex flex-col p-6 min-h-[160px] rounded-[2rem] bg-card border border-border/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all relative overflow-hidden group"
              >
                 <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30",
                    idx % 3 === 0 ? "bg-blue-500" : idx % 3 === 1 ? "bg-purple-500" : "bg-orange-500"
                 )} />
                 
                 <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                       <div className={cn(
                          "h-12 w-12 rounded-[1rem] flex items-center justify-center text-xl font-bold shadow-sm border border-white/10 text-white",
                          idx % 3 === 0 ? "bg-gradient-to-br from-blue-400 to-blue-600" : 
                          idx % 3 === 1 ? "bg-gradient-to-br from-purple-400 to-purple-600" : 
                          "bg-gradient-to-br from-orange-400 to-orange-600"
                       )}>
                          {circle.name.charAt(0).toUpperCase()}
                       </div>
                       <div className="bg-secondary/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                       </div>
                    </div>
                    
                    <div>
                       <h3 className="text-lg font-bold text-foreground truncate mb-1">{circle.name}</h3>
                       <p className="text-sm text-muted-foreground line-clamp-2">
                          {circle.description || 'No description provided'}
                       </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                       <Users className="h-3.5 w-3.5" />
                       <span>View Details</span>
                    </div>
                 </div>
              </Link>
           ))}
           
           {filteredCircles?.length === 0 && searchQuery && (
              <div className="col-span-full py-10 text-center text-muted-foreground">
                 <p>No circles found matching "{searchQuery}"</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
