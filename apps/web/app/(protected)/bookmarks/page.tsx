'use client';

import { useMemo } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';
import { TweetCard } from '@/features/feed/components/TweetCard';

export default function BookmarksPage() {
  const user = useAuthUser();
  const { feed, bookmarkedIds } = useTweetStore();

  const bookmarkedTweets = useMemo(
    () =>
      feed
        .filter((tweet) => bookmarkedIds.has(tweet.id))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [feed, bookmarkedIds]
  );

  if (!user) return null;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Bookmarks</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Saved posts you want to revisit.
        </p>
      </header>

      {bookmarkedTweets.length === 0 ? (
        <div className="px-6 py-12 border-b border-white/8">
          <h3 className="text-3xl font-extrabold text-white">Save posts for later</h3>
          <p className="text-slate-400 mt-2 text-[15px] max-w-md">
            Bookmark interesting posts from your feed and they will appear here.
          </p>
        </div>
      ) : (
        <section>
          {bookmarkedTweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </section>
      )}
    </div>
  );
}
