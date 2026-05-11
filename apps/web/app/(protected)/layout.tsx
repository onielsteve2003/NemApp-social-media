'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/stores/authStore';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <svg className="animate-spin text-sky-400" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-white flex">
      <LeftSidebar onNewPost={() => setShowComposer(true)} />

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

      {/* Mobile compose modal (future: animate) */}
      {showComposer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-16"
          onClick={() => setShowComposer(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl w-full max-w-lg mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-slate-400 mb-2">New Post (use the composer in feed)</p>
            <button
              onClick={() => setShowComposer(false)}
              className="text-sky-400 text-sm hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

