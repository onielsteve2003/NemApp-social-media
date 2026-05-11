'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/stores/authStore';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { NemAppLogo } from '@/components/common/NemAppLogo';

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.14),_transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_38%,#020617_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <NemAppLogo size="lg" />
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
                Build your circle
              </p>
              <h1 className="text-5xl font-black leading-tight text-white">
                Create a NemApp profile that looks and feels like you.
              </h1>
              <p className="text-lg leading-8 text-slate-300">
                Claim your handle, set your presence, and step into a feed built for
                conversation, discovery, and momentum.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  What you get
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Profiles, threads, bookmarks, direct messages, and a cleaner visual system that keeps text readable from the first screen.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl justify-self-center">
          <div className="rounded-[2rem] border border-white/12 bg-slate-900/72 p-6 shadow-[0_25px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
            <div className="space-y-4 text-center sm:text-left">
              <NemAppLogo size="md" className="justify-center sm:justify-start" />
              <div>
                <h1 className="text-3xl font-black text-white">Create Account</h1>
                <p className="mt-2 text-base leading-7 text-slate-400">
                  Join NemApp today and start building your own social orbit.
                </p>
              </div>
            </div>

            <div className="mt-8 max-h-[calc(100vh-250px)] overflow-y-auto rounded-[1.75rem] border border-white/8 bg-black/20 p-5 sm:p-6">
              <RegisterForm />
            </div>

            <div className="mt-6 space-y-4 text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  Sign in
                </Link>
              </p>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
