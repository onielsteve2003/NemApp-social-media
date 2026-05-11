'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTweetStore } from '@/stores/tweetStore';
import { MOCK_USERS } from '@/mocks/auth';
import { TweetCard } from '@/features/feed/components/TweetCard';

type ExploreTab = 'top' | 'posts' | 'people';

const TREND_CANDIDATES = [
  '#buildinpublic',
  '#webdev',
  '#typescript',
  '#nextjs',
  '#opensource',
  '#ux',
  '#design',
  '#startup',
  '#react',
  '#nodejs',
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export default function ExplorePage() {
  const feed = useTweetStore((state) => state.feed);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ExploreTab>('top');

  const queryNorm = normalize(query);

  const filteredTweets = useMemo(() => {
    if (!queryNorm) return feed;
    return feed.filter((tweet) => {
      const content = normalize(tweet.content);
      const username = normalize(tweet.author.username);
      const display = normalize(tweet.author.displayName);
      return (
        content.includes(queryNorm) ||
        username.includes(queryNorm) ||
        display.includes(queryNorm)
      );
    });
  }, [feed, queryNorm]);

  const filteredPeople = useMemo(() => {
    if (!queryNorm) return MOCK_USERS;
    return MOCK_USERS.filter((person) => {
      const username = normalize(person.username);
      const display = normalize(person.displayName);
      const bio = normalize(person.bio ?? '');
      return (
        username.includes(queryNorm) ||
        display.includes(queryNorm) ||
        bio.includes(queryNorm)
      );
    });
  }, [queryNorm]);

  const trends = useMemo(() => {
    const hashtagCounts = new Map<string, number>();

    for (const tweet of feed) {
      const matches = tweet.content.match(/#\w+/g) ?? [];
      for (const raw of matches) {
        const hashtag = raw.toLowerCase();
        hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) ?? 0) + 1);
      }
    }

    for (const trend of TREND_CANDIDATES) {
      const hashtag = trend.toLowerCase();
      if (!hashtagCounts.has(hashtag)) {
        hashtagCounts.set(hashtag, Math.floor(Math.random() * 5000) + 1200);
      }
    }

    return Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .filter((item) => (!queryNorm ? true : item.hashtag.includes(queryNorm.replace('#', '')) || item.hashtag.includes(queryNorm)))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [feed, queryNorm]);

  const showTweets = activeTab === 'top' || activeTab === 'posts';
  const showPeople = activeTab === 'top' || activeTab === 'people';

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Explore</h1>
        <div className="relative mt-3">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, people, and trends"
            className="w-full rounded-full bg-slate-800 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 border border-transparent focus:border-sky-400 focus:outline-none transition-colors"
          />
        </div>
      </header>

      <section className="grid grid-cols-3 border-b border-white/8">
        <ExploreTabButton
          active={activeTab === 'top'}
          label="Top"
          onClick={() => setActiveTab('top')}
        />
        <ExploreTabButton
          active={activeTab === 'posts'}
          label="Posts"
          onClick={() => setActiveTab('posts')}
        />
        <ExploreTabButton
          active={activeTab === 'people'}
          label="People"
          onClick={() => setActiveTab('people')}
        />
      </section>

      <section className="border-b border-white/8">
        <h2 className="px-4 pt-4 pb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          Trending now
        </h2>
        {trends.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-400">No trends matched your query.</p>
        ) : (
          trends.map((trend) => (
            <article key={trend.hashtag} className="px-4 py-3 border-t border-white/8">
              <p className="text-[15px] font-bold text-white">{trend.hashtag}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatCount(trend.count)} posts</p>
            </article>
          ))
        )}
      </section>

      {showPeople && (
        <section className="border-b border-white/8">
          <h2 className="px-4 pt-4 pb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            People
          </h2>
          {filteredPeople.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-slate-400">No people found.</p>
          ) : (
            filteredPeople.slice(0, 8).map((person) => (
              <article key={person.id} className="px-4 py-3 border-t border-white/8 flex items-center gap-3">
                <img
                  src={person.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                  alt={person.displayName}
                  className="h-10 w-10 rounded-full bg-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{person.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">@{person.username}</p>
                </div>
                <Link
                  href={`/profile/${person.username}`}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  View
                </Link>
              </article>
            ))
          )}
        </section>
      )}

      {showTweets && (
        <section>
          <h2 className="px-4 pt-4 pb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            Posts
          </h2>
          {filteredTweets.length === 0 ? (
            <div className="px-6 py-12 border-t border-white/8">
              <h3 className="text-3xl font-extrabold text-white">No posts found</h3>
              <p className="text-slate-400 mt-2 text-[15px]">
                Try another keyword or hashtag.
              </p>
            </div>
          ) : (
            filteredTweets.slice(0, activeTab === 'top' ? 6 : 20).map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))
          )}
        </section>
      )}
    </div>
  );
}

function ExploreTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        py-4 text-sm font-semibold transition-colors relative
        ${active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
      `}
    >
      {label}
      {active && <span className="absolute inset-x-8 -bottom-px h-1 rounded-full bg-sky-400" />}
    </button>
  );
}
