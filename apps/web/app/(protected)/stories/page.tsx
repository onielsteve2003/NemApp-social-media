'use client';

import { StoriesRail } from '@/features/stories/components/StoriesRail';

export default function StoriesPage() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-[20px] font-extrabold text-white">Stories</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          A visual layer for quick updates, moods, and moments.
        </p>
      </header>

      <StoriesRail expanded />
    </div>
  );
}
