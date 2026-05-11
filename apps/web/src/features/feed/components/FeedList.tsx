'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTweetStore } from '@/stores/tweetStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSocialStore } from '@/stores/socialStore';
import { TweetCard } from './TweetCard';
import { TweetComposer } from './TweetComposer';

interface FeedListProps {
  tab?: 'for-you' | 'following';
}

export function FeedList({ tab = 'for-you' }: FeedListProps) {
  const { feed, isLoading, isFetchingMore, hasMore, fetchFeed, fetchMore } = useTweetStore();
  const blockedUserIds = useSettingsStore((state) => state.blockedUserIds);
  const followingIds = useSocialStore((state) => state.followingIds);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Filter based on blocked users
  let visibleFeed = feed.filter((tweet) => !blockedUserIds.includes(tweet.authorId));
  
  // Filter based on tab
  if (tab === 'following') {
    visibleFeed = visibleFeed.filter((tweet) => followingIds.includes(tweet.authorId));
  }

  // Initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Infinite scroll via IntersectionObserver
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !isFetchingMore && hasMore) {
        fetchMore();
      }
    },
    [isFetchingMore, hasMore, fetchMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // If the first page does not fill the viewport, prefetch until scroll becomes possible.
  useEffect(() => {
    if (isLoading || isFetchingMore || !hasMore) return;
    if (typeof window === 'undefined') return;

    const docHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;

    if (docHeight <= viewportHeight + 40) {
      fetchMore();
    }
  }, [visibleFeed.length, isLoading, isFetchingMore, hasMore, fetchMore]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TweetComposer />
        <div className="flex flex-col divide-y divide-white/8">
          {Array.from({ length: 5 }).map((_, i) => (
            <TweetSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state for Following tab
  if (!isLoading && visibleFeed.length === 0 && tab === 'following') {
    return (
      <div className="flex flex-col">
        <TweetComposer />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-white mb-2">No tweets yet</h2>
          <p className="text-slate-400 text-center">
            Start following people to see their tweets in your Following feed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TweetComposer />
      <div>
        {visibleFeed.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingMore && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {!hasMore && visibleFeed.length > 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          You&apos;re all caught up! 🎉
        </div>
      )}
    </div>
  );
}

function TweetSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2">
          <div className="h-3.5 w-28 rounded bg-slate-700" />
          <div className="h-3.5 w-20 rounded bg-slate-700/60" />
        </div>
        <div className="h-3.5 rounded bg-slate-700/70 w-full" />
        <div className="h-3.5 rounded bg-slate-700/50 w-4/5" />
        <div className="flex gap-6 pt-2">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-3 w-8 rounded bg-slate-700/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin text-sky-400" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
