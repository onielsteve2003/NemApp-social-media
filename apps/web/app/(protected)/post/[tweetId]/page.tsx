'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';
import { TweetCard } from '@/features/feed/components/TweetCard';
import type { TweetWithAuthor } from '@shared-types';

export default function TweetDetailPage({
  params,
}: {
  params: { tweetId: string };
}) {
  const router = useRouter();
  const user = useAuthUser();
  const { feed, createReply } = useTweetStore();
  const [reply, setReply] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const tweet = useMemo(
    () => feed.find((item) => item.id === params.tweetId),
    [feed, params.tweetId]
  );

  const conversationReplies = useMemo(() => {
    if (!tweet) return [] as Array<{ tweet: TweetWithAuthor; depth: number }>;

    const repliesOnly = feed.filter((item) => item.isReply);
    const childrenByParent = new Map<string, TweetWithAuthor[]>();

    for (const item of repliesOnly) {
      if (!item.replyTo) continue;
      const existing = childrenByParent.get(item.replyTo) ?? [];
      existing.push(item);
      childrenByParent.set(item.replyTo, existing);
    }

    for (const [, children] of childrenByParent) {
      children.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    const flattened: Array<{ tweet: TweetWithAuthor; depth: number }> = [];

    const walk = (parentId: string, depth: number) => {
      const children = childrenByParent.get(parentId) ?? [];
      for (const child of children) {
        flattened.push({ tweet: child, depth });
        walk(child.id, depth + 1);
      }
    };

    walk(tweet.id, 0);
    return flattened;
  }, [feed, tweet]);

  const canReply = Boolean(user) && reply.trim().length > 0 && reply.length <= 280;

  const replyTarget = useMemo(() => {
    if (!replyToId) return tweet;
    return feed.find((item) => item.id === replyToId) ?? tweet;
  }, [replyToId, feed, tweet]);

  const handleReply = () => {
    if (!user || !tweet || !canReply) return;
    createReply(tweet.id, reply.trim(), user.id, replyTarget?.id);
    setReply('');
    setReplyToId(null);
  };

  if (!tweet) {
    return (
      <div className="min-h-full">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h1 className="text-xl font-extrabold text-white">Post</h1>
          </div>
        </header>
        <div className="px-6 py-12 border-b border-white/8">
          <h3 className="text-3xl font-extrabold text-white">Post not found</h3>
          <p className="text-slate-400 mt-2 text-[15px]">
            This post may not be loaded yet. Return to Home and open it again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="text-xl font-extrabold text-white">Post</h1>
        </div>
      </header>

      <section className="border-b border-white/8">
        <TweetCard
          tweet={tweet}
          disableNavigation
          onReplyClick={(targetTweet) => {
            setReplyToId(targetTweet.id);
          }}
        />
      </section>

      <section className="px-4 py-3 border-b border-white/8">
        {replyTarget && (
          <div className="mb-2 text-xs text-slate-400">
            Replying to{' '}
            <Link
              href={`/profile/${replyTarget.author.username}`}
              className="text-sky-400 hover:underline"
            >
              @{replyTarget.author.username}
            </Link>
            {replyToId && (
              <button
                onClick={() => setReplyToId(null)}
                className="ml-2 text-slate-500 hover:text-white hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <img
            src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'guest'}`}
            alt={user?.displayName ?? 'You'}
            className="w-10 h-10 rounded-full bg-slate-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={user ? 'Post your reply' : 'Login to reply'}
              rows={3}
              disabled={!user}
              className="w-full resize-none rounded-2xl bg-slate-800/80 border border-white/10 px-3 py-2 text-white text-[15px] placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className={`text-xs ${reply.length > 280 ? 'text-red-400' : 'text-slate-500'}`}>
                {reply.length}/280
              </p>
              <button
                onClick={handleReply}
                disabled={!canReply}
                className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        {conversationReplies.length === 0 ? (
          <div className="px-6 py-12 border-b border-white/8">
            <h3 className="text-3xl font-extrabold text-white">No replies yet</h3>
            <p className="text-slate-400 mt-2 text-[15px]">
              Be the first to reply in this conversation.
            </p>
          </div>
        ) : (
          conversationReplies.map(({ tweet: replyTweet, depth }) => (
            <div key={replyTweet.id} style={{ paddingLeft: `${Math.min(depth, 4) * 22}px` }}>
              <TweetCard
                tweet={replyTweet}
                disableNavigation
                onReplyClick={(targetTweet) => {
                  setReplyToId(targetTweet.id);
                }}
              />
            </div>
          ))
        )}
      </section>

      {!user && (
        <div className="px-4 py-4 text-sm text-slate-400 border-t border-white/8">
          <Link href="/login" className="text-sky-400 hover:underline">
            Sign in
          </Link>{' '}
          to join the conversation.
        </div>
      )}
    </div>
  );
}
