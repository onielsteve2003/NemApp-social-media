'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthUser } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';
import { useSocialStore } from '@/stores/socialStore';
import { useStoryStore } from '@/stores/storyStore';
import { apiClient } from '@/lib/apiClient';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { TweetCard } from '@/features/feed/components/TweetCard';
import type { UserProfile } from '@shared-types';

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

interface UserProfileResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
}

interface UserListResponse {
  success: boolean;
  data: {
    users: UserProfile[];
  };
}

export function ProfileScreen({ username }: ProfileScreenProps) {
  const router = useRouter();
  const authUser = useAuthUser();
  const setAuthUser = useAuthStore((state) => state.setUser);
  const { feed, isLoading, fetchFeed, likedIds } = useTweetStore();
  const { toggleFollow, isFollowing, followingIds, profilesById, hydrateProfiles } = useSocialStore();
  const { stories, seedStories, removeExpiredStories, markSeen } = useStoryStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [openModal, setOpenModal] = useState<SocialModal>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [followersUsers, setFollowersUsers] = useState<UserProfile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<UserProfile[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<{
    [userId: string]: { allPosts: boolean; likes: boolean; replies: boolean };
  }>({});

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (feed.length === 0) {
      fetchFeed();
    }
  }, [authUser, router, feed.length, fetchFeed]);

  useEffect(() => {
    void seedStories();
    removeExpiredStories();
  }, [removeExpiredStories, seedStories]);

  useEffect(() => {
    if (!authUser) return;

    if (!username || username.toLowerCase() === authUser.username.toLowerCase()) {
      setViewedProfile(null);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await apiClient.get<UserProfileResponse>(`/api/users/${encodeURIComponent(username)}`);
        if (!cancelled) {
          const user = response.data.user ?? null;
          if (user) {
            hydrateProfiles([user]);
          }
          setViewedProfile(user);
        }
      } catch {
        if (!cancelled) {
          setViewedProfile(null);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authUser, username, hydrateProfiles]);

  const targetUser = useMemo(() => {
    if (!authUser) return null;
    if (!username || username.toLowerCase() === authUser.username.toLowerCase()) {
      return authUser;
    }
    return viewedProfile;
  }, [authUser, username, viewedProfile]);

  const isOwnProfile = targetUser?.id === authUser?.id;

  const targetUserStories = useMemo(() => {
    if (!targetUser) return [];

    return [...stories]
      .filter((story) => story.authorId === targetUser.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [stories, targetUser]);

  const activeStory =
    activeStoryIndex !== null && activeStoryIndex >= 0 && activeStoryIndex < targetUserStories.length
      ? targetUserStories[activeStoryIndex]
      : null;

  const userPosts = useMemo(
    () => feed.filter((tweet) => tweet.authorId === targetUser?.id && !tweet.isReply),
    [feed, targetUser?.id]
  );

  const userReplies = useMemo(
    () => feed.filter((tweet) => tweet.authorId === targetUser?.id && Boolean(tweet.isReply)),
    [feed, targetUser?.id]
  );

  const likedTweets = useMemo(() => {
    if (!targetUser) return [];
    if (isOwnProfile) {
      return feed.filter((tweet) => likedIds.has(tweet.id));
    }

    const seed = targetUser.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return feed
      .filter((tweet) => tweet.authorId !== targetUser.id && !tweet.isReply)
      .filter((_, index) => (index + seed) % 3 === 0)
      .slice(0, 12);
  }, [feed, likedIds, isOwnProfile, targetUser]);

  const visibleTweets =
    activeTab === 'posts'
      ? userPosts
      : activeTab === 'replies'
        ? userReplies
        : activeTab === 'likes'
          ? likedTweets
          : [];

  const cachedFollowingUsers = useMemo(
    () => followingIds
      .map((userId) => profilesById[userId])
      .filter((profile): profile is UserProfile => Boolean(profile)),
    [followingIds, profilesById]
  );

  useEffect(() => {
    if (openModal === 'following' && isOwnProfile) {
      setFollowingUsers(cachedFollowingUsers);
    }
  }, [openModal, isOwnProfile, cachedFollowingUsers]);

  useEffect(() => {
    if (!openModal || !targetUser?.username) return;

    let cancelled = false;

    const loadUsers = async () => {
      try {
        const endpoint = openModal === 'followers'
          ? `/api/users/${encodeURIComponent(targetUser.username)}/followers`
          : `/api/users/${encodeURIComponent(targetUser.username)}/following`;
        const response = await apiClient.get<UserListResponse>(endpoint);
        if (cancelled) return;

        const users = response.data.users ?? [];
        hydrateProfiles(users);
        if (openModal === 'followers') {
          setFollowersUsers(users);
        } else {
          setFollowingUsers(users);
        }
      } catch {
        if (cancelled) return;
        if (openModal === 'followers') {
          setFollowersUsers([]);
        } else {
          setFollowingUsers([]);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [openModal, targetUser?.username, hydrateProfiles]);

  useEffect(() => {
    if (!authUser) return;
    setEditDisplayName(authUser.displayName ?? '');
    setEditBio(authUser.bio ?? '');
    setEditLocation(authUser.location ?? '');
    setEditWebsite(authUser.website ?? '');
    setEditAvatar(authUser.avatar ?? '');
  }, [authUser]);

  const handleSaveProfile = async () => {
    if (!authUser) return;
    const trimmedName = editDisplayName.trim();
    if (!trimmedName) return;

    const response = await apiClient.patch<{ success: boolean; data: { user: typeof authUser } }>('/api/users/me', {
      displayName: trimmedName,
      bio: editBio.trim(),
      location: editLocation.trim(),
      website: editWebsite.trim(),
      avatar: editAvatar.trim() || authUser.avatar,
    });
    const updatedUser = response.data.user;
    if (!updatedUser) return;

    setAuthUser(updatedUser);

    useTweetStore.setState((state) => ({
      feed: state.feed.map((tweet) =>
        tweet.authorId === updatedUser.id
          ? {
              ...tweet,
              author: {
                ...tweet.author,
                displayName: updatedUser.displayName,
                bio: updatedUser.bio,
                avatar: updatedUser.avatar,
                location: updatedUser.location,
                website: updatedUser.website,
                updatedAt: updatedUser.updatedAt,
              },
            }
          : tweet
      ),
    }));

    setIsEditProfileOpen(false);
  };

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
          body="This account could not be loaded."
        />
      </div>
    );
  }

  const currentlyFollowing = !isOwnProfile && isFollowing(targetUser.id);
  const followersCount = targetUser.followersCount;
  const followingCount = targetUser.followingCount;
  const canViewTargetStory = isOwnProfile || currentlyFollowing;
  const hasActiveStory = canViewTargetStory && targetUserStories.length > 0;

  const openProfileStory = () => {
    if (!hasActiveStory || !canViewTargetStory) return;

    const nextIndex = targetUserStories.findIndex(
      (story) => authUser && !story.seenBy.includes(authUser.id)
    );
    const indexToOpen = nextIndex >= 0 ? nextIndex : targetUserStories.length - 1;
    setActiveStoryIndex(indexToOpen);

    if (authUser && targetUser.id !== authUser.id) {
      void markSeen(targetUserStories[indexToOpen].id, authUser.id);
    }
  };

  const closeStoryViewer = () => {
    setActiveStoryIndex(null);
  };

  const goToStoryIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= targetUserStories.length) {
      return;
    }

    setActiveStoryIndex(nextIndex);
    if (authUser && targetUser.id !== authUser.id) {
      void markSeen(targetUserStories[nextIndex].id, authUser.id);
    }
  };

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
            <p className="text-xs text-slate-400">{userPosts.length} posts</p>
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
            {hasActiveStory ? (
              <button
                type="button"
                onClick={openProfileStory}
                className="rounded-full bg-[conic-gradient(from_210deg,_#f97316,_#ec4899,_#8b5cf6,_#0ea5e9,_#f97316)] p-[4px] transition-transform hover:scale-[1.02]"
                aria-label={`View ${targetUser.displayName}'s story`}
              >
                <span className="block rounded-full bg-slate-950 p-[4px]">
                  <img
                    src={targetUser.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`}
                    alt={targetUser.displayName}
                    className="h-28 w-28 rounded-full border-4 border-slate-950 bg-slate-700"
                  />
                </span>
              </button>
            ) : (
              <img
                src={targetUser.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`}
                alt={targetUser.displayName}
                className="h-28 w-28 rounded-full border-4 border-slate-950 bg-slate-700"
              />
            )}

            {isOwnProfile ? (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="mt-16 rounded-full border border-white/25 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Edit profile
              </button>
            ) : (
              <div className="mt-16 flex gap-2">
                <button 
                  onClick={() => router.push(`/messages?user=${targetUser.username}`)}
                  className="rounded-full border border-white/25 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  title="Send message"
                >
                  Message
                </button>
                <button
                  onClick={() => {
                    void toggleFollow(targetUser.id);
                  }}
                  className={`
                    rounded-full px-4 py-1.5 text-sm font-semibold transition-colors
                    ${currentlyFollowing
                      ? 'border border-white/25 text-white hover:border-red-500 hover:text-red-400'
                      : 'bg-white text-slate-950 hover:bg-slate-200'
                    }
                  `}
                >
                  {currentlyFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <div>
              <h2 className="text-2xl font-extrabold text-white inline-flex items-center gap-2">
                {targetUser.displayName}
                {targetUser.isVerified && (
                  <VerifiedBadge size={18} />
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

            {!isOwnProfile && currentlyFollowing && (
              <div className="pt-4 border-t border-white/8 space-y-3">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationSettings[targetUser.id]?.allPosts ?? true}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        [targetUser.id]: {
                          ...prev[targetUser.id],
                          allPosts: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded accent-sky-400"
                  />
                  <span className="text-sm text-slate-300">Turn on notifications for all posts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationSettings[targetUser.id]?.likes ?? false}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        [targetUser.id]: {
                          ...prev[targetUser.id],
                          likes: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded accent-sky-400"
                  />
                  <span className="text-sm text-slate-300">Get notified when they like posts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationSettings[targetUser.id]?.replies ?? false}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        [targetUser.id]: {
                          ...prev[targetUser.id],
                          replies: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded accent-sky-400"
                  />
                  <span className="text-sm text-slate-300">Get notified when they reply</span>
                </label>
              </div>
            )}
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

        {!isLoading && visibleTweets.length === 0 && (
          <EmptyState
            title={
              activeTab === 'posts'
                ? 'No posts yet'
                : activeTab === 'replies'
                  ? 'No replies yet'
                  : 'No liked posts yet'
            }
            body={
              activeTab === 'posts'
                ? 'Posts from this account will appear here.'
                : activeTab === 'replies'
                  ? 'Replies from this account will appear here.'
                  : 'Posts you like will appear here for quick access.'
            }
          />
        )}

        {!isLoading && visibleTweets.map((tweet) => (
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

      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-8 backdrop-blur-sm">
          <button
            type="button"
            onClick={closeStoryViewer}
            className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white hover:bg-black/50"
          >
            Close
          </button>

          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-[0_30px_120px_rgba(15,23,42,0.65)]">
            <div
              className="p-4"
              style={{ background: activeStory.background }}
            >
              <div className="mb-4 flex items-center gap-3">
                <img
                  src={targetUser.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`}
                  alt={targetUser.displayName}
                  className="h-12 w-12 rounded-full border-2 border-white/70 object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-white">{targetUser.displayName}</div>
                  <div className="text-xs text-white/80">@{targetUser.username}</div>
                </div>
              </div>

              {activeStory.media?.type === 'image' ? (
                <img
                  src={activeStory.media.url}
                  alt={activeStory.media.alt ?? activeStory.caption}
                  className="h-[26rem] w-full rounded-[1.5rem] object-cover"
                />
              ) : activeStory.media?.type === 'video' ? (
                <video
                  src={activeStory.media.url}
                  controls
                  autoPlay
                  className="h-[26rem] w-full rounded-[1.5rem] object-cover"
                />
              ) : (
                <div className="flex h-[26rem] items-end rounded-[1.5rem] bg-black/10 p-6">
                  <p className="text-lg font-semibold leading-8 text-white">{activeStory.caption}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-4 text-sm text-slate-300">
              <button
                type="button"
                onClick={() => goToStoryIndex((activeStoryIndex ?? 0) - 1)}
                disabled={(activeStoryIndex ?? 0) === 0}
                className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <div className="text-center">
                <div className="font-semibold text-white">{activeStory.caption || 'Story update'}</div>
                <div className="text-xs text-slate-400">
                  {new Date(activeStory.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToStoryIndex((activeStoryIndex ?? 0) + 1)}
                disabled={(activeStoryIndex ?? 0) >= targetUserStories.length - 1}
                className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditProfileOpen && (
        <EditProfileModal
          displayName={editDisplayName}
          setDisplayName={setEditDisplayName}
          bio={editBio}
          setBio={setEditBio}
          location={editLocation}
          setLocation={setEditLocation}
          website={editWebsite}
          setWebsite={setEditWebsite}
          avatar={editAvatar}
          setAvatar={setEditAvatar}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleSaveProfile}
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
  users: UserProfile[];
  authUserId: string;
  onToggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const openProfile = (username: string) => {
    onClose();
    router.push(`/profile/${username}`);
  };

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
                <button
                  type="button"
                  onClick={() => openProfile(person.username)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <img
                    src={person.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                    alt={person.displayName}
                    className="h-11 w-11 rounded-full bg-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate hover:underline">{person.displayName}</p>
                    <p className="text-xs text-slate-400 truncate hover:underline">@{person.username}</p>
                  </div>
                </button>

                {self ? (
                  <span className="rounded-full border border-white/20 text-slate-300 text-xs font-semibold px-3 py-1">You</span>
                ) : (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFollow(person.id);
                    }}
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

function EditProfileModal({
  displayName,
  setDisplayName,
  bio,
  setBio,
  location,
  setLocation,
  website,
  setWebsite,
  avatar,
  setAvatar,
  onClose,
  onSave,
}: {
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  website: string;
  setWebsite: (value: string) => void;
  avatar: string;
  setAvatar: (value: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Edit profile</h3>
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

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-800/50 px-3 py-3">
            <img
              src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=profile'}
              alt="Avatar preview"
              className="h-14 w-14 rounded-full bg-slate-700"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Profile photo</p>
              <p className="text-xs text-slate-400">Select an image from your device.</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>
          <ProfileInput label="Display name" value={displayName} onChange={setDisplayName} />
          <ProfileInput label="Bio" value={bio} onChange={setBio} multiline />
          <ProfileInput label="Location" value={location} onChange={setLocation} />
          <ProfileInput label="Website" value={website} onChange={setWebsite} />
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              void onSave();
            }}
            disabled={displayName.trim().length === 0}
            className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{label}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/12 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/12 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
        />
      )}
    </label>
  );
}
