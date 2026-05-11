'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TRENDING = [
  { topic: '#buildinpublic', posts: '24.1K' },
  { topic: '#webdev', posts: '18.7K' },
  { topic: '#typescript', posts: '15.2K' },
  { topic: '#nextjs', posts: '12.4K' },
  { topic: '#opensource', posts: '9.8K' },
];

const WHO_TO_FOLLOW = [
  {
    id: 'sugg-1',
    displayName: 'Vercel',
    username: 'vercel',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vercel',
    isVerified: true,
  },
  {
    id: 'sugg-2',
    displayName: 'Lee Robinson',
    username: 'leeerob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leeerob',
    isVerified: false,
  },
  {
    id: 'sugg-3',
    displayName: 'shadcn',
    username: 'shadcn',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=shadcn',
    isVerified: false,
  },
];

export function RightSidebar() {
  const router = useRouter();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length === 0) {
      router.push('/explore');
      return;
    }
    router.push(`/explore?q=${encodeURIComponent(q)}`);
  };

  const toggleFollow = (id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[350px] shrink-0 py-3 px-4">
      {/* Search */}
      <form className="relative" onSubmit={handleSearchSubmit}>
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search NemApp"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full bg-slate-800 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 border border-transparent focus:border-sky-400 focus:outline-none transition-colors"
        />
      </form>

      {/* Trending */}
      <div className="rounded-2xl bg-slate-800/60 border border-white/6 overflow-hidden">
        <h3 className="px-4 pt-4 pb-2 text-[19px] font-extrabold text-white">Trending</h3>
        {TRENDING.map(({ topic, posts }) => (
          <button
            key={topic}
            className="flex flex-col w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <span className="text-[15px] font-bold text-white">{topic}</span>
            <span className="text-xs text-slate-400 mt-0.5">{posts} posts</span>
          </button>
        ))}
        <button className="px-4 py-3 text-sm text-sky-400 hover:bg-white/5 w-full text-left transition-colors">
          Show more
        </button>
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl bg-slate-800/60 border border-white/6 overflow-hidden">
        <h3 className="px-4 pt-4 pb-2 text-[19px] font-extrabold text-white">Who to follow</h3>
        {WHO_TO_FOLLOW.map((person) => {
          const isFollowing = following.has(person.id);
          return (
            <div key={person.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
              <img
                src={person.avatar}
                alt={person.displayName}
                className="w-10 h-10 rounded-full bg-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white truncate">{person.displayName}</span>
                  {person.isVerified && (
                    <svg width="14" height="14" viewBox="0 0 24 24" className="text-sky-400 shrink-0" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-slate-400">@{person.username}</span>
              </div>
              <button
                onClick={() => toggleFollow(person.id)}
                className={`
                  shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors
                  ${isFollowing
                    ? 'border border-white/20 text-white hover:border-red-500 hover:text-red-400'
                    : 'bg-white text-slate-950 hover:bg-slate-200'
                  }
                `}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
        <button className="px-4 py-3 text-sm text-sky-400 hover:bg-white/5 w-full text-left transition-colors">
          Show more
        </button>
      </div>

      <p className="text-xs text-slate-600 px-1 leading-relaxed">
        NemApp Demo · Local storage only · No data leaves your browser
      </p>
    </aside>
  );
}
