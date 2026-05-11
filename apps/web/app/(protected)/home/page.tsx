'use client';

import { FeedList } from '@/features/feed/components/FeedList';

export default function HomePage() {
  return (
    <div>
      {/* Feed header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Home</h1>
      </div>

      {/* Feed tabs */}
      <div className="flex border-b border-white/8">
        <button className="flex-1 py-4 text-[15px] font-semibold text-white border-b-2 border-sky-400 hover:bg-white/5 transition-colors">
          For you
        </button>
        <button className="flex-1 py-4 text-[15px] font-medium text-slate-400 hover:bg-white/5 transition-colors hover:text-white">
          Following
        </button>
      </div>

      <FeedList />
    </div>
  );
}

