'use client';

import Link from 'next/link';
import { Circle } from 'lucide-react';
import { SignUpForm } from '@/components/auth-signup-form';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-600">
              <Circle className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">CircleSync</span>
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Join CircleSync</h1>
            <p className="text-sm text-zinc-400">
              Create an account to start coordinating
            </p>
          </div>

          <SignUpForm />
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
