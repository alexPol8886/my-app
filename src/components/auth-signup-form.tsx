'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SignUpSchema, type SignUpFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    setError(null);

    try {
      await signUp(data.email, data.password, data.fullName);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Full Name</label>
        <input
          {...register('fullName')}
          type="text"
          className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          {...register('email')}
          type="email"
          className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          {...register('password')}
          type="password"
          className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 py-2 font-medium hover:bg-cyan-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
