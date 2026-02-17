'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUpdateCircleSettings } from '@/hooks/useCircleSettings';
import { ArrowLeft, Settings, Lock, Users, Calendar, Save, Check } from 'lucide-react';
import Link from 'next/link';
import type { Circle, CircleMember } from '@/types';

export default function CircleSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const circleId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    is_private: false,
    who_can_invite: 'all' as 'admin' | 'all',
    who_can_create_events: 'all' as 'admin' | 'all',
  });

  const updateSettings = useUpdateCircleSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    if (user && circleId) {
      fetchCircleAndRole();
    }
  }, [user, circleId]);

  const fetchCircleAndRole = async () => {
    try {
      setLoading(true);

      // Fetch circle
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', circleId)
        .single();

      if (circleError) throw circleError;
      setCircle(circleData as Circle);

      // Set initial settings
      setSettings({
        is_private: circleData.is_private ?? false,
        who_can_invite: circleData.who_can_invite ?? 'all',
        who_can_create_events: circleData.who_can_create_events ?? 'all',
      });

      // Check if user is admin or creator
      if (circleData.creator_id === user?.id) {
        setUserRole('admin');
      } else {
        const { data: memberData } = await supabase
          .from('circle_members')
          .select('role')
          .eq('circle_id', circleId)
          .eq('user_id', user?.id)
          .single();

        setUserRole(memberData?.role || null);
      }
    } catch (error) {
      console.error('Error fetching circle:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        circleId,
        settings,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  if (!mounted || authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-cyan-500 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Only admins/creators can access settings
  if (userRole !== 'admin' && circle?.creator_id !== user.id) {
    return (
      <div className="min-h-screen pb-8 px-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <Lock className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-zinc-400 mb-6">Only circle admins can access settings</p>
          <Link
            href={`/circles/${circleId}`}
            className="inline-block px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-medium transition-colors"
          >
            Back to Circle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 px-4">
      <div className="max-w-2xl mx-auto pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/circles/${circleId}`}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Circle Settings</h1>
            <p className="text-zinc-400 text-sm mt-1">{circle?.name}</p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          {/* Privacy Setting */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30">
                <Lock className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Privacy</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Private circles require approval to join via invite code
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSettings({ ...settings, is_private: false })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      !settings.is_private
                        ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Public</div>
                    <div className="text-xs text-zinc-500 mt-1">Anyone can join instantly</div>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, is_private: true })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      settings.is_private
                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Private</div>
                    <div className="text-xs text-zinc-500 mt-1">Requires approval</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Who Can Invite */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-600/20 border border-cyan-500/30">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Invite Members</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Control who can share the invite code
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSettings({ ...settings, who_can_invite: 'all' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      settings.who_can_invite === 'all'
                        ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Everyone</div>
                    <div className="text-xs text-zinc-500 mt-1">All members can invite</div>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, who_can_invite: 'admin' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      settings.who_can_invite === 'admin'
                        ? 'bg-orange-600/20 border-orange-500/50 text-orange-400'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Admins Only</div>
                    <div className="text-xs text-zinc-500 mt-1">Only admins can invite</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Who Can Create Events */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-green-600/20 border border-green-500/30">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Create Events</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Control who can create new events
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSettings({ ...settings, who_can_create_events: 'all' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      settings.who_can_create_events === 'all'
                        ? 'bg-green-600/20 border-green-500/50 text-green-400'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Everyone</div>
                    <div className="text-xs text-zinc-500 mt-1">All members can create</div>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, who_can_create_events: 'admin' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      settings.who_can_create_events === 'admin'
                        ? 'bg-orange-600/20 border-orange-500/50 text-orange-400'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Admins Only</div>
                    <div className="text-xs text-zinc-500 mt-1">Only admins can create</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending || saved}
            className="w-full px-6 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check className="h-5 w-5" />
                Saved!
              </>
            ) : updateSettings.isPending ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
