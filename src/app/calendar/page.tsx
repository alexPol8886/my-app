'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, MapPin, Clock, List, Grid3x3, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

interface Event {
  id: string;
  title: string;
  location_name: string;
  start_time: string;
  circle_id: string;
  circles?: {
    name: string;
  };
}

type ViewMode = 'list' | 'calendar';
type SortBy = 'date' | 'circle' | 'location';

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterCircle, setFilterCircle] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // New state for selected date interactions
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const fetchMyEvents = async () => {
    try {
      setIsLoading(true);
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user?.id)
        .eq('status', 'going');

      if (attendanceError) throw attendanceError;

      const eventIds = attendanceData.map(a => a.event_id);

      if (eventIds.length === 0) {
        setEvents([]);
        return;
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          circles (
            name
          )
        `)
        .in('id', eventIds)
        .gte('start_time', new Date().toISOString()) // Only future events
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData as Event[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueCircles = useMemo(() => {
    const circles = events.map(e => e.circles?.name).filter(Boolean);
    return [...new Set(circles)] as string[];
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    if (filterCircle !== 'all') {
      filtered = filtered.filter(e => e.circles?.name === filterCircle);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'circle':
          return (a.circles?.name || '').localeCompare(b.circles?.name || '');
        case 'location':
          return a.location_name.localeCompare(b.location_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, filterCircle, sortBy]);

  const calendarData = useMemo(() => {
    // Always calculate calendar data if we might switch to it
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return {
      monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      days,
    };
  }, [currentMonth]);

  const getEventsForDay = (date: Date) => {
    return filteredAndSortedEvents.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const groupEventsByDate = (events: Event[]) => {
    const groups: { [key: string]: Event[] } = {};
    events.forEach(event => {
      const dateKey = new Date(event.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  };

  const groupedEvents = groupEventsByDate(filteredAndSortedEvents);
  const dateKeys = Object.keys(groupedEvents);

  if (!mounted || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-primary animate-spin"></div>
      </div>
    );
  }

  // Determine events for the selected date in Grid View
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 bg-background transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold text-foreground">Your Events</h1>
             <p className="text-muted-foreground text-sm">
                {filteredAndSortedEvents.length} upcoming events
             </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
               onClick={() => setShowFilters(!showFilters)}
               className={cn(
                 "p-3 rounded-[1.2rem] border transition-all shadow-sm",
                 showFilters ? "bg-primary/10 border-primary text-primary" : "bg-card border-border/50 text-foreground hover:bg-secondary"
               )}
            >
               <Filter className="h-5 w-5" />
            </button>
            <div className="flex p-1 bg-secondary rounded-[1rem] border border-border/50">
               <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                     "px-4 py-2 rounded-[0.8rem] text-sm font-bold transition-all",
                     viewMode === 'list' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
               >
                  List
               </button>
               <button
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                     "px-4 py-2 rounded-[0.8rem] text-sm font-bold transition-all",
                     viewMode === 'calendar' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
               >
                  Grid
               </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
           <div className="p-6 rounded-[2rem] bg-card border border-border/50 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-foreground">Filters</h3>
                 <button onClick={() => { setFilterCircle('all'); setSortBy('date'); }} className="text-xs font-bold text-primary hover:underline">
                    Reset
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Circle</label>
                    <select
                       value={filterCircle}
                       onChange={(e) => setFilterCircle(e.target.value)}
                       className="w-full px-4 py-3 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:ring-2 ring-primary/20 outline-none transition-all"
                    >
                       <option value="all">All Circles</option>
                       {uniqueCircles.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Sort By</label>
                    <select
                       value={sortBy}
                       onChange={(e) => setSortBy(e.target.value as SortBy)}
                       className="w-full px-4 py-3 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:ring-2 ring-primary/20 outline-none transition-all"
                    >
                       <option value="date">Date</option>
                       <option value="circle">Circle Name</option>
                       <option value="location">Location</option>
                    </select>
                 </div>
              </div>
           </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
           <div className="space-y-8 animate-in fade-in">
              {Object.keys(groupedEvents).length > 0 ? (
                 Object.keys(groupedEvents).map(dateKey => (
                    <div key={dateKey} className="space-y-4">
                       <h3 className="sticky top-20 z-10 inline-block px-4 py-1 rounded-full bg-secondary/80 backdrop-blur-md text-sm font-bold text-foreground border border-border/50">
                          {dateKey}
                       </h3>
                       <div className="grid gap-3">
                          {groupedEvents[dateKey].map(event => (
                             <Link
                                key={event.id}
                                href={`/circles/${event.circle_id}/events/${event.id}`}
                                className="flex items-center gap-4 p-4 rounded-[2rem] bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group"
                             >
                                <div className="h-14 w-14 rounded-[1.2rem] bg-secondary flex flex-col items-center justify-center flex-shrink-0">
                                   <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                      {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </span>
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                   <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{event.title}</h4>
                                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{event.circles?.name}</span>
                                      <span>•</span>
                                      <span className="truncate">{event.location_name}</span>
                                   </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                   <ChevronRight className="h-4 w-4" />
                                </div>
                             </Link>
                          ))}
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="text-center py-20 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No upcoming events found</p>
                    <Link href="/circles" className="text-primary font-bold hover:underline mt-2 inline-block">Browse Circles</Link>
                 </div>
              )}
           </div>
        )}

        {/* Grid View */}
        {viewMode === 'calendar' && (
           <div className="animate-in fade-in space-y-6">
              {/* Calendar Card */}
              <div className="p-6 rounded-[2.5rem] bg-card border border-border/50 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                    <button onClick={() => {
                       const d = new Date(currentMonth);
                       d.setMonth(d.getMonth() - 1);
                       setCurrentMonth(d);
                    }} className="p-2 hover:bg-secondary rounded-full transition-colors">
                       <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">
                       {calendarData.monthName}
                    </h2>
                    <button onClick={() => {
                       const d = new Date(currentMonth);
                       d.setMonth(d.getMonth() + 1);
                       setCurrentMonth(d);
                    }} className="p-2 hover:bg-secondary rounded-full transition-colors">
                       <ChevronRight className="h-5 w-5" />
                    </button>
                 </div>

                 <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                       <div key={i} className="text-xs font-bold text-muted-foreground py-2">{d}</div>
                    ))}
                 </div>

                 <div className="grid grid-cols-7 gap-1">
                    {calendarData.days.map((date, i) => {
                       if (!date) return <div key={i} className="aspect-square" />;
                       
                       const dayEvents = getEventsForDay(date);
                       const isSelected = selectedDate?.toDateString() === date.toDateString();
                       const isToday = new Date().toDateString() === date.toDateString();
                       const hasEvents = dayEvents.length > 0;

                       return (
                          <button
                             key={date.toISOString()}
                             onClick={() => setSelectedDate(date)}
                             className={cn(
                                "aspect-square rounded-[1rem] flex flex-col items-center justify-center relative transition-all",
                                isSelected ? "bg-primary text-primary-foreground shadow-md shadow-mint/30" : 
                                isToday ? "bg-secondary text-primary font-bold" :
                                "hover:bg-secondary/50 text-foreground",
                                !hasEvents && !isSelected && "text-muted-foreground"
                             )}
                          >
                             <span className="text-sm">{date.getDate()}</span>
                             {hasEvents && (
                                <div className="flex gap-0.5 mt-1">
                                   {dayEvents.slice(0,3).map((_, i) => (
                                      <div key={i} className={cn(
                                         "h-1 w-1 rounded-full",
                                         isSelected ? "bg-white" : "bg-primary"
                                      )} />
                                   ))}
                                </div>
                             )}
                          </button>
                       );
                    })}
                 </div>
              </div>

              {/* Selected Date Events */}
              {selectedDate && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-foreground px-2">
                       {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    
                    {selectedDateEvents.length > 0 ? (
                       <div className="space-y-3">
                          {selectedDateEvents.map(event => (
                             <Link
                                key={event.id}
                                href={`/circles/${event.circle_id}/events/${event.id}`}
                                className="flex items-center gap-4 p-4 rounded-[2rem] bg-card border border-border/50 hover:border-primary/30 transition-all"
                             >
                                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                   <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                   <h4 className="font-bold text-foreground">{event.title}</h4>
                                   <p className="text-xs text-muted-foreground">{event.circles?.name} • {new Date(event.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                             </Link>
                          ))}
                       </div>
                    ) : (
                       <div className="p-8 rounded-[2rem] bg-secondary/20 border border-dashed border-border/50 text-center">
                          <p className="text-sm text-muted-foreground">No events on this day</p>
                          <Link href="/circles" className="text-primary text-xs font-bold hover:underline mt-1 block">Create one in a circle?</Link>
                       </div>
                    )}
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
