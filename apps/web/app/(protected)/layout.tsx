'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsAuthenticated } from '@/stores/authStore';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const login = useAuthStore((state) => state.login);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const autoDemoEnabled = useAuthStore((state) => state.autoDemoEnabled);

  const handleNewPost = () => {
    router.push('/home');
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nemapp:new-post'));
      }, 120);
    }
  };

  useEffect(() => {
    if (isAuthenticated || isAuthLoading) {
      return;
    }

    if (!autoDemoEnabled) {
      router.push('/login');
      return;
    }

    void login('demo@example.com', 'Demo@1234').catch(() => {
      router.push('/login');
    });
  }, [isAuthenticated, isAuthLoading, autoDemoEnabled, login, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950">
        <svg className="animate-spin text-sky-400" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-slate-300">Starting demo session...</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-white flex">
      <LeftSidebar onNewPost={handleNewPost} />

      {/* Main content — offset by sidebar width */}
      <div className="flex flex-1 ml-[72px] xl:ml-64 justify-center h-screen overflow-hidden">
        {/* Center column */}
        <main className="no-scrollbar flex-1 max-w-[600px] border-x border-white/8 h-screen overflow-y-auto">
          {children}
        </main>

        {/* Right sidebar */}
        <div className="no-scrollbar hidden lg:block w-[350px] px-4 py-3 shrink-0 h-screen overflow-y-auto">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

