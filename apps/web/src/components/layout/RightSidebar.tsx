'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import { apiClient } from '@/lib/apiClient';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import type { UserProfile } from '@shared-types';

const TRENDING = [
  { topic: '#buildinpublic', posts: '24.1K' },
  { topic: '#webdev', posts: '18.7K' },
  { topic: '#typescript', posts: '15.2K' },
  { topic: '#nextjs', posts: '12.4K' },
  { topic: '#opensource', posts: '9.8K' },
];

interface DiscoverResponse {
  success: boolean;
  data: {
    users: UserProfile[];
  };
}

export function RightSidebar() {
  const router = useRouter();
  const followingIds = useSocialStore((state) => state.followingIds);
  const toggleFollow = useSocialStore((state) => state.toggleFollow);
  const hydrateProfiles = useSocialStore((state) => state.hydrateProfiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>([]);
  const suggestedPeople = discoverUsers.filter((person) => !followingIds.includes(person.id));

  useEffect(() => {
    let cancelled = false;

    const loadDiscoverUsers = async () => {
      try {
        const response = await apiClient.get<DiscoverResponse>('/api/users/discover');
        if (!cancelled) {
          const users = response.data.users ?? [];
          hydrateProfiles(users);
          setDiscoverUsers(users);
        }
      } catch {
        if (!cancelled) {
          setDiscoverUsers([]);
        }
      }
    };

    void loadDiscoverUsers();

    return () => {
      cancelled = true;
    };
  }, [hydrateProfiles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length === 0) {
      router.push('/explore');
      return;
    }
    router.push(`/explore?q=${encodeURIComponent(q)}`);
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
            onClick={() => router.push(`/explore?q=${encodeURIComponent(topic)}`)}
            className="flex flex-col w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <span className="text-[15px] font-bold text-white">{topic}</span>
            <span className="text-xs text-slate-400 mt-0.5">{posts} posts</span>
          </button>
        ))}
        <button 
          onClick={() => router.push('/explore?tab=top')}
          className="px-4 py-3 text-sm text-sky-400 hover:bg-white/5 w-full text-left transition-colors"
        >
          Show more
        </button>
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl bg-slate-800/60 border border-white/6 overflow-hidden">
        <h3 className="px-4 pt-4 pb-2 text-[19px] font-extrabold text-white">Who to follow</h3>
        {suggestedPeople.map((person) => {
          const isFollowing = followingIds.includes(person.id);
          return (
            <div key={person.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
              <button
                onClick={() => router.push(`/profile/${person.username}`)}
                className="shrink-0"
              >
                <img
                  src={person.avatar}
                  alt={person.displayName}
                  className="w-10 h-10 rounded-full bg-slate-700 hover:opacity-80 transition-opacity"
                />
              </button>
              <button
                onClick={() => router.push(`/profile/${person.username}`)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white truncate hover:underline">{person.displayName}</span>
                  {person.isVerified && (
                    <VerifiedBadge size={14} className="shrink-0" />
                  )}
                </div>
                <span className="text-xs text-slate-400 hover:underline">@{person.username}</span>
              </button>
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
        {suggestedPeople.length === 0 && (
          <p className="px-4 py-4 text-sm text-slate-400">
            You are all caught up. Try Explore to discover more people.
          </p>
        )}
        <button 
          onClick={() => router.push('/explore?tab=people')}
          className="px-4 py-3 text-sm text-sky-400 hover:bg-white/5 w-full text-left transition-colors"
        >
          Show more
        </button>
      </div>

      <p className="text-xs text-slate-600 px-1 leading-relaxed">
        NemApp Demo · Local storage only · No data leaves your browser
      </p>
    </aside>
  );
}
