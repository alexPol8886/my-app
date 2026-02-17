'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateCirclePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsSubmitting(true);

    if (!name.trim()) {
      setError('Circle name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error: dbError } = await supabase
        .from('circles')
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            creator_id: user?.id,
            invite_code: inviteCode,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Error creating circle:', dbError);
        setError(dbError.message || 'Failed to create circle');
        setIsSubmitting(false);
        return;
      }

      if (data) {
        // Add creator as member
        const { error: memberError } = await supabase
          .from('circle_members')
          .insert([
            {
              circle_id: data.id,
              user_id: user?.id,
              role: 'admin',
            },
          ]);

        if (memberError) {
          console.error('Error adding member:', memberError);
        }
      }

      router.push('/');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
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
          <Link href="/" className="p-2 hover:bg-zinc-800 rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Create Circle</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-600/20 border border-red-600/50 p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Circle Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Friday Crew"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-600 focus:outline-none transition"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this circle about?"
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-600 focus:outline-none transition resize-none"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Creating...' : 'Create Circle'}
          </button>
        </form>
      </div>
    </div>
  );
}
