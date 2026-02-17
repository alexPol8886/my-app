'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateRide } from '@/hooks/useRides';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfferRidePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  const circleId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [originText, setOriginText] = useState('');
  const [totalSeats, setTotalSeats] = useState(4);
  const [error, setError] = useState<string | null>(null);
  
  const createRide = useCreateRide();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!originText.trim()) {
      setError('Pickup location is required');
      return;
    }

    if (totalSeats < 1 || totalSeats > 8) {
      setError('Please select between 1 and 8 seats');
      return;
    }

    try {
      await createRide.mutateAsync({
        eventId,
        driverId: user!.id,
        originText: originText.trim(),
        totalSeats,
      });
      router.push(`/circles/${circleId}/events/${eventId}`);
    } catch (err: any) {
      console.error('Error creating ride:', err);
      setError(err.message || 'Failed to create ride');
    }
  };

  if (!mounted || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-cyan-600 animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/circles/${circleId}/events/${eventId}`} className="p-2 hover:bg-zinc-800 rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Offer a Ride 🚗</h1>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-cyan-600/10 border border-cyan-600/20 p-4">
          <p className="text-sm text-cyan-400">
            Share your ride with other attendees. They can request to join based on available seats.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-600/20 border border-red-600/50 p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="origin" className="block text-sm font-medium">
              Pickup Location *
            </label>
            <input
              type="text"
              id="origin"
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              placeholder="e.g., Downtown Coffee Shop"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-600 focus:outline-none transition"
              disabled={createRide.isPending}
            />
            <p className="text-xs text-zinc-500">
              Where will you pick up passengers?
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="seats" className="block text-sm font-medium">
              Available Seats *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalSeats(num)}
                  className={`rounded-lg border p-3 transition ${
                    totalSeats === num
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-zinc-700 hover:border-cyan-500 text-zinc-400'
                  }`}
                  disabled={createRide.isPending}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              How many passengers can you take?
            </p>
          </div>

          <button
            type="submit"
            disabled={createRide.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50 transition"
          >
            {createRide.isPending ? 'Creating Ride...' : 'Offer Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}
