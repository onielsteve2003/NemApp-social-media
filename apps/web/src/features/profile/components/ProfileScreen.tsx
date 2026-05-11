'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';
import { useSocialStore } from '@/stores/socialStore';
import { MOCK_USERS } from '@/mocks/auth';
import { TweetCard } from '@/features/feed/components/TweetCard';

type ProfileTab = 'posts' | 'replies' | 'likes';
type SocialModal = 'followers' | 'following' | null;

function formatJoinedDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

interface ProfileScreenProps {
  username?: string;
}

export function ProfileScreen({ username }: ProfileScreenProps) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { feed, isLoading, fetchFeed, likedIds } = useTweetStore();
  const { followingIds, toggleFollow, isFollowing } = useSocialStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [openModal, setOpenModal] = useState<SocialModal>(null);

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (feed.length === 0) {
      fetchFeed();
    }
  }, [authUser, router, feed.length, fetchFeed]);

  const targetUser = useMemo(() => {
    if (!authUser) return null;
    if (!username || username.toLowerCase() === authUser.username.toLowerCase()) {
      return authUser;
    }
    return MOCK_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
  }, [authUser, username]);

  const isOwnProfile = targetUser?.id === authUser?.id;

  const userTweets = useMemo(
    () => feed.filter((tweet) => tweet.authorId === targetUser?.id),
    [feed, targetUser?.id]
  );

  const likedTweets = useMemo(() => {
    if (!isOwnProfile) return [];
    return feed.filter((tweet) => likedIds.has(tweet.id));
  }, [feed, likedIds, isOwnProfile]);

  const visibleTweets =
    activeTab === 'posts' ? userTweets : activeTab === 'likes' ? likedTweets : [];

  const peopleWithoutTarget = useMemo(() => {
    if (!targetUser) return [];
    return MOCK_USERS.filter((u) => u.id !== targetUser.id);
  }, [targetUser]);

  const followersUsers = useMemo(() => {
    if (!targetUser) return [];
    const users = peopleWithoutTarget.slice(0, 8);
    const authFollowsTarget =
      authUser && authUser.id !== targetUser.id && followingIds.includes(targetUser.id);

    if (authFollowsTarget && authUser && !users.some((u) => u.id === authUser.id)) {
      return [authUser, ...users].slice(0, 8);
    }

    return users;
  }, [targetUser, peopleWithoutTarget, followingIds, authUser]);

  const followingUsers = useMemo(() => {
    if (!targetUser) return [];
    if (isOwnProfile) {
      return MOCK_USERS.filter((u) => followingIds.includes(u.id));
    }
    return peopleWithoutTarget.slice(0, 5);
  }, [targetUser, isOwnProfile, followingIds, peopleWithoutTarget]);

  if (!authUser) return null;

  if (!targetUser) {
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
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h1 className="text-xl font-extrabold text-white leading-tight">Profile</h1>
          </div>
        </header>

        <EmptyState
          title="Profile not found"
          body="This account does not exist in the demo data yet."
        />
      </div>
    );
  }

  const currentlyFollowing = !isOwnProfile && isFollowing(targetUser.id);
  const followersCount =
    targetUser.followersCount +
    (!isOwnProfile && currentlyFollowing ? 1 : 0);
  const followingCount =
    targetUser.followingCount +
    (isOwnProfile ? followingIds.length : 0);

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
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white leading-tight">{targetUser.displayName}</h1>
            <p className="text-xs text-slate-400">{userTweets.length} posts</p>
          </div>
        </div>
      </header>

      <section className="relative border-b border-white/8">
        <div className="h-48 bg-gradient-to-br from-cyan-500/60 via-sky-600/45 to-blue-900/55">
          {targetUser.coverImage && (
            <img
              src={targetUser.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-70"
            />
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-between items-start -mt-14">
            <img
              src={targetUser.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`}
              alt={targetUser.displayName}
              className="h-28 w-28 rounded-full border-4 border-slate-950 bg-slate-700"
            />

            {isOwnProfile ? (
              <button className="mt-16 rounded-full border border-white/25 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Edit profile
              </button>
            ) : (
              <button
                onClick={() => toggleFollow(targetUser.id)}
                className={`
                  mt-16 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors
                  ${currentlyFollowing
                    ? 'border border-white/25 text-white hover:border-red-500 hover:text-red-400'
                    : 'bg-white text-slate-950 hover:bg-slate-200'
                  }
                `}
              >
                {currentlyFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <div>
              <h2 className="text-2xl font-extrabold text-white inline-flex items-center gap-2">
                {targetUser.displayName}
                {targetUser.isVerified && (
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-sky-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </h2>
              <p className="text-slate-400 text-sm">@{targetUser.username}</p>
            </div>

            {targetUser.bio && <p className="text-white/90 text-[15px] leading-relaxed">{targetUser.bio}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
              {targetUser.location && (
                <span className="inline-flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {targetUser.location}
                </span>
              )}
              {targetUser.website && (
                <a href={targetUser.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sky-400 hover:underline">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {targetUser.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Joined {formatJoinedDate(targetUser.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-5 pt-1 text-sm">
              <button onClick={() => setOpenModal('following')} className="text-slate-300 hover:underline">
                <span className="font-bold text-white mr-1">{followingCount}</span>Following
              </button>
              <button onClick={() => setOpenModal('followers')} className="text-slate-300 hover:underline">
                <span className="font-bold text-white mr-1">{followersCount}</span>Followers
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 grid grid-cols-3">
        <TabButton label="Posts" active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
        <TabButton label="Replies" active={activeTab === 'replies'} onClick={() => setActiveTab('replies')} />
        <TabButton label="Likes" active={activeTab === 'likes'} onClick={() => setActiveTab('likes')} />
      </section>

      <section>
        {isLoading && (
          <div className="p-8 text-center text-slate-400 text-sm">Loading profile feed...</div>
        )}

        {!isLoading && activeTab === 'replies' && (
          <EmptyState title="No replies yet" body="Replies will be enabled with thread support in Stage 4." />
        )}

        {!isLoading && activeTab === 'likes' && !isOwnProfile && (
          <EmptyState title="Likes are private" body="In this demo, only your own likes tab is available." />
        )}

        {!isLoading && activeTab !== 'replies' && (isOwnProfile || activeTab !== 'likes') && visibleTweets.length === 0 && (
          <EmptyState
            title={activeTab === 'posts' ? 'No posts yet' : 'No liked posts yet'}
            body={
              activeTab === 'posts'
                ? 'Posts from this account will appear here.'
                : 'Posts you like will appear here for quick access.'
            }
          />
        )}

        {!isLoading && activeTab !== 'replies' && (isOwnProfile || activeTab !== 'likes') && visibleTweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </section>

      {openModal && (
        <SocialListModal
          title={openModal === 'followers' ? 'Followers' : 'Following'}
          users={openModal === 'followers' ? followersUsers : followingUsers}
          authUserId={authUser.id}
          onToggleFollow={toggleFollow}
          isFollowing={isFollowing}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-12 border-b border-white/8">
      <h3 className="text-3xl font-extrabold text-white">{title}</h3>
      <p className="text-slate-400 mt-2 max-w-md text-[15px]">{body}</p>
    </div>
  );
}

function SocialListModal({
  title,
  users,
  authUserId,
  onToggleFollow,
  isFollowing,
  onClose,
}: {
  title: string;
  users: typeof MOCK_USERS;
  authUserId: string;
  onToggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-300 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          {users.length === 0 && (
            <p className="px-4 py-8 text-sm text-slate-400 text-center">No users to show yet.</p>
          )}

          {users.map((person) => {
            const self = person.id === authUserId;
            const following = isFollowing(person.id);

            return (
              <div key={person.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
                <img
                  src={person.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                  alt={person.displayName}
                  className="h-11 w-11 rounded-full bg-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{person.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">@{person.username}</p>
                </div>

                {self ? (
                  <span className="rounded-full border border-white/20 text-slate-300 text-xs font-semibold px-3 py-1">You</span>
                ) : (
                  <button
                    onClick={() => onToggleFollow(person.id)}
                    className={`
                      rounded-full text-sm font-bold px-4 py-1.5 transition-colors
                      ${following
                        ? 'border border-white/25 text-white hover:border-red-500 hover:text-red-400'
                        : 'bg-white text-slate-950 hover:bg-slate-200'
                      }
                    `}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
