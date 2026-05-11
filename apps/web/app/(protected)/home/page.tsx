'use client';

import { useState } from 'react';
import { FeedList } from '@/features/feed/components/FeedList';
import { StoriesRail } from '@/features/stories/components/StoriesRail';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <div>
      {/* Feed header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Home</h1>
      </div>

      <StoriesRail />

      {/* Feed tabs */}
      <div className="flex border-b border-white/8">
        <button
          onClick={() => setActiveTab('for-you')}
          className={`flex-1 py-4 text-[15px] font-semibold transition-colors ${
            activeTab === 'for-you'
              ? 'text-white border-b-2 border-sky-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          For you
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-4 text-[15px] font-semibold transition-colors ${
            activeTab === 'following'
              ? 'text-white border-b-2 border-sky-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Following
        </button>
      </div>

      <FeedList tab={activeTab} />
    </div>
  );
}

