'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import type { TweetWithAuthor } from '@shared-types';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderContent(content: string) {
  // Highlight hashtags and mentions
  const parts = content.split(/(#\w+|@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#') || part.startsWith('@')) {
      return (
        <span key={i} className="text-sky-400 hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface TweetCardProps {
  tweet: TweetWithAuthor;
  disableNavigation?: boolean;
  onReplyClick?: (tweet: TweetWithAuthor) => void;
}

export function TweetCard({
  tweet,
  disableNavigation = false,
  onReplyClick,
}: TweetCardProps) {
  const router = useRouter();
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleBlockedUser = useSettingsStore((state) => state.toggleBlockedUser);
  const { toggleLike, toggleRetweet, toggleBookmark, votePollOption, editTweet, deleteTweet, likedIds, retweetedIds, bookmarkedIds } =
    useTweetStore();
  const authorHref = `/profile/${tweet.author.username}`;
  const tweetHref = `/post/${tweet.id}`;

  const isLiked = likedIds.has(tweet.id);
  const isRetweeted = retweetedIds.has(tweet.id);
  const isBookmarked = bookmarkedIds.has(tweet.id);

  const triggerCopiedNotice = () => {
    setIsShareCopied(true);
    window.setTimeout(() => setIsShareCopied(false), 1800);
  };

  const goToTweet = () => {
    if (!disableNavigation) {
      router.push(tweetHref);
    }
  };

  const handleShare = async () => {
    const absoluteUrl = `${window.location.origin}${tweetHref}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${tweet.author.displayName} on NemApp`,
          text: tweet.content,
          url: absoluteUrl,
        });
      } else {
        await navigator.clipboard.writeText(absoluteUrl);
      }

      triggerCopiedNotice();
    } catch {
      try {
        await navigator.clipboard.writeText(absoluteUrl);
        triggerCopiedNotice();
      } catch {
        // If clipboard is unavailable, do nothing silently.
      }
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <article
      onClick={goToTweet}
      className="flex gap-3 px-4 py-3 border-b border-white/8 hover:bg-white/[0.02] transition-colors cursor-pointer group"
    >
      {/* Avatar */}
      <div className="shrink-0">
        <Link href={authorHref} onClick={(e) => e.stopPropagation()}>
          <img
            src={tweet.author.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweet.author.username}`}
            alt={tweet.author.displayName}
            className="w-10 h-10 rounded-full bg-slate-700"
          />
        </Link>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <Link href={authorHref} onClick={(e) => e.stopPropagation()} className="font-bold text-[15px] text-white hover:underline cursor-pointer truncate">
            {tweet.author.displayName}
          </Link>
          {tweet.author.isVerified && (
            <VerifiedBadge size={16} className="shrink-0" />
          )}
          <Link href={authorHref} onClick={(e) => e.stopPropagation()} className="text-slate-400 text-[15px] truncate hover:underline">@{tweet.author.username}</Link>
          <span className="text-slate-500 text-[15px]">·</span>
          <span className="text-slate-400 text-[15px] hover:underline cursor-pointer shrink-0">
            {timeAgo(tweet.createdAt)}
          </span>
          {/* More options */}
          <div ref={menuRef} className="relative ml-auto">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-sky-400/10 hover:text-sky-400 text-slate-400"
              aria-label="Post options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-7 z-20 w-48 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push(tweetHref);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                >
                  View post details
                </button>
                <button
                  onClick={async () => {
                    setIsMenuOpen(false);
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}${tweetHref}`);
                      triggerCopiedNotice();
                    } catch {
                      // Ignore clipboard errors in restricted contexts.
                    }
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                >
                  Copy post link
                </button>
                {currentUserId === tweet.authorId && (
                  <>
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        const nextContent = window.prompt('Edit post', tweet.content)?.trim();
                        if (!nextContent || nextContent === tweet.content) return;
                        await editTweet(tweet.id, nextContent);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      Edit post
                    </button>
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        if (!window.confirm('Delete this post?')) return;
                        await deleteTweet(tweet.id);
                        if (!disableNavigation) {
                          router.push('/home');
                        }
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                    >
                      Delete post
                    </button>
                  </>
                )}
                {currentUserId !== tweet.authorId && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      toggleBlockedUser(tweet.authorId);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                  >
                    Hide posts from @{tweet.author.username}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-[15px] text-white/90 leading-[1.55] whitespace-pre-line break-words mb-3">
          {renderContent(tweet.content)}
        </p>

        {tweet.media && tweet.media.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-white/8">
            {tweet.media.length === 1 ? (
              <img
                src={tweet.media[0].url}
                alt={tweet.media[0].alt ?? 'Tweet media'}
                className={`w-full max-h-[480px] ${
                  tweet.media[0].type === 'gif'
                    ? 'bg-slate-950 object-contain object-[center_72%]'
                    : 'object-cover'
                }`}
              />
            ) : (
              <div className="grid grid-cols-2 gap-1 p-1">
                {tweet.media.slice(0, 4).map((media, index) => (
                  <img
                    key={`${tweet.id}-media-${index}`}
                    src={media.url}
                    alt={media.alt ?? `Tweet media ${index + 1}`}
                    className={`h-40 w-full rounded ${
                      media.type === 'gif'
                        ? 'bg-slate-950 object-contain object-[center_72%]'
                        : 'object-cover'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tweet.poll && (
          <div className="mb-3 space-y-2 rounded-2xl border border-white/8 p-3">
            {tweet.poll.options.map((option) => {
              const percentage =
                tweet.poll && tweet.poll.totalVotes > 0
                  ? Math.round((option.votes / tweet.poll.totalVotes) * 100)
                  : 0;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    votePollOption(tweet.id, option.id);
                  }}
                  className="relative w-full overflow-hidden rounded-lg border border-white/10 px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 bg-sky-400/20"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-sm text-white">{option.text}</span>
                    <span className="text-xs text-slate-300">{percentage}%</span>
                  </div>
                </button>
              );
            })}
            <div className="pt-1 text-xs text-slate-400">
              {formatCount(tweet.poll.totalVotes)} votes
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between max-w-[360px] -ml-2">
          {/* Reply */}
          <ActionButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            count={tweet.repliesCount}
            onClick={() => {
              if (onReplyClick) {
                onReplyClick(tweet);
              } else {
                router.push(tweetHref);
              }
            }}
            hoverColor="sky"
          />

          {/* Retweet */}
          <ActionButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            }
            count={tweet.retweetsCount}
            onClick={() => toggleRetweet(tweet.id)}
            active={isRetweeted}
            activeColor="text-emerald-400"
            hoverColor="emerald"
          />

          {/* Like */}
          <ActionButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            }
            count={tweet.likesCount}
            onClick={() => toggleLike(tweet.id)}
            active={isLiked}
            activeColor="text-rose-500"
            hoverColor="rose"
          />

          {/* Bookmark */}
          <ActionButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            }
            count={tweet.bookmarksCount}
            onClick={() => toggleBookmark(tweet.id)}
            active={isBookmarked}
            activeColor="text-sky-400"
            hoverColor="sky"
          />

          {/* Share */}
          <ActionButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            }
            onClick={() => {
              void handleShare();
            }}
            active={isShareCopied}
            activeColor="text-sky-400"
            hoverColor="sky"
          />
        </div>

        {isShareCopied && (
          <p className="mt-2 text-xs font-semibold text-emerald-400">Copied successfully</p>
        )}
      </div>
    </article>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  hoverColor: 'sky' | 'emerald' | 'rose';
}

const hoverMap = {
  sky: 'hover:text-sky-400 hover:bg-sky-400/10',
  emerald: 'hover:text-emerald-400 hover:bg-emerald-400/10',
  rose: 'hover:text-rose-500 hover:bg-rose-500/10',
};

function ActionButton({ icon, count, onClick, active, activeColor, hoverColor }: ActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        flex items-center gap-1.5 p-2 rounded-full text-slate-400 transition-colors
        ${hoverMap[hoverColor]}
        ${active ? activeColor : ''}
      `}
    >
      {icon}
      {count !== undefined && count > 0 && (
        <span className="text-[13px] tabular-nums">{formatCount(count)}</span>
      )}
    </button>
  );
}
