'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsAuthenticated } from '@/stores/authStore';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { NemAppLogo } from '@/components/common/NemAppLogo';
import { useToast } from '@/components/common/Toast';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const { addToast } = useToast();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_42%,#020617_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <NemAppLogo size="lg" />
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">
                Real-time social flow
              </p>
              <h1 className="text-5xl font-black leading-tight text-white">
                Sign in and step back into your network.
              </h1>
              <p className="text-lg leading-8 text-slate-300">
                NemApp is built for live conversations, direct messages, and the
                kind of communities people actually want to come back to.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="text-2xl font-black text-sky-300">280</div>
                <p className="mt-2 text-sm text-slate-400">Quick posts with instant reactions.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="text-2xl font-black text-cyan-300">Live</div>
                <p className="mt-2 text-sm text-slate-400">Messaging and trends that move in real time.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="text-2xl font-black text-emerald-300">Clean</div>
                <p className="mt-2 text-sm text-slate-400">A sharper interface with higher contrast everywhere.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl justify-self-center">
          <div className="rounded-[2rem] border border-white/12 bg-slate-900/72 p-6 shadow-[0_25px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
            <div className="space-y-4 text-center sm:text-left">
              <NemAppLogo size="md" className="justify-center sm:justify-start" />
              <div>
                <h1 className="text-3xl font-black text-white">Sign In</h1>
                <p className="mt-2 text-base leading-7 text-slate-400">
                  Welcome back to NemApp. Pick up the conversation where you left it.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/8 bg-black/20 p-5 sm:p-6">
              <LoginForm />
              <button
                onClick={async () => {
                  clearError();
                  try {
                    await login('demo@example.com', 'Demo@1234');
                  } catch (error) {
                    const message =
                      error instanceof Error ? error.message : 'Demo login failed. Please try again.';
                    addToast(message, 'error');
                  }
                }}
                className="mt-4 w-full rounded-full border border-sky-300/40 bg-sky-500/20 px-4 py-2.5 text-sm font-bold text-sky-100 hover:bg-sky-500/30"
              >
                Enter Demo Instantly
              </button>
            </div>

            <div className="mt-6 space-y-4 text-center">
              <p className="text-slate-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-sky-300 hover:text-sky-200"
                >
                  Create one
                </Link>
              </p>
              <div className="text-xs text-slate-500">
                This is a demo experience. Account state is stored locally in your browser.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
