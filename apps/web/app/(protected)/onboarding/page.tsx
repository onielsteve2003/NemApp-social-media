'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser, useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/common/Toast';
import { MOCK_USERS } from '@/mocks/auth';
import { NemAppLogo } from '@/components/common/NemAppLogo';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthUser();
  const { setUser } = useAuthStore();
  const { addToast } = useToast();
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Get suggested users (exclude current user)
  const suggestedUsers = MOCK_USERS.filter((u) => u.id !== user?.id).slice(0, 6);

  const handleFollow = (userId: string) => {
    setFollowingUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Simulate following users
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update user stats
      if (user) {
        const updatedUser = {
          ...user,
          followingCount: user.followingCount + followingUsers.size,
        };
        setUser(updatedUser);
      }

      addToast(
        `Successfully followed ${followingUsers.size} users!`,
        'success'
      );
      router.push('/home');
    } catch (err) {
      addToast('Failed to complete onboarding', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <NemAppLogo size="sm" />
          <div className="text-sm text-gray-400">Step 1 of 1: Follow interests</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Welcome */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Welcome, {user?.displayName}! 👋
          </h1>
          <p className="text-lg text-gray-400">
            Follow some interesting accounts to get started
          </p>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedUsers.map((suggestedUser) => (
            <div
              key={suggestedUser.id}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              {/* Avatar and Username */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={suggestedUser.avatar}
                    alt={suggestedUser.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate">
                      {suggestedUser.displayName}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      @{suggestedUser.username}
                    </p>
                  </div>
                </div>
                {suggestedUser.isVerified && (
                  <span className="text-primary text-lg">✓</span>
                )}
              </div>

              {/* Bio */}
              {suggestedUser.bio && (
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {suggestedUser.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-4 text-xs text-gray-400 mb-4">
                <div>
                  <div className="font-semibold text-white">
                    {suggestedUser.followersCount.toLocaleString()}
                  </div>
                  <div>Followers</div>
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {suggestedUser.tweetsCount.toLocaleString()}
                  </div>
                  <div>Posts</div>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(suggestedUser.id)}
                className={`w-full py-2 rounded-full font-semibold transition-colors ${
                  followingUsers.has(suggestedUser.id)
                    ? 'bg-white/10 text-white border border-white/30'
                    : 'bg-primary text-black hover:bg-primary/90'
                }`}
              >
                {followingUsers.has(suggestedUser.id) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="text-center p-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl">
          <p className="text-gray-400 mb-2">You're following</p>
          <p className="text-4xl font-bold text-primary">
            {followingUsers.size}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {followingUsers.size === 0 ? 'Start following to build your feed' : 'accounts'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/home')}
            className="flex-1 py-3 rounded-full border-2 border-gray-400 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1 py-3 rounded-full bg-primary text-black font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Completing...' : 'Complete'}
          </button>
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-500">
          You can follow or unfollow accounts at any time from your profile settings
        </p>
      </div>
    </div>
  );
}
