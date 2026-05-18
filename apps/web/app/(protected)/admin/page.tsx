'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/stores/authStore';
import { MOCK_USERS } from '@/mocks/auth';
import { useTweetStore } from '@/stores/tweetStore';

const MOCK_REPORTS = [
  {
    id: 'rep-1',
    reason: 'spam',
    target: 'tweet-9',
    reporter: '@alice',
    status: 'pending',
    createdAt: '2h ago',
  },
  {
    id: 'rep-2',
    reason: 'harassment',
    target: '@bob',
    reporter: '@demo',
    status: 'under_review',
    createdAt: '5h ago',
  },
  {
    id: 'rep-3',
    reason: 'abuse',
    target: 'tweet-11',
    reporter: '@alice',
    status: 'pending',
    createdAt: '1d ago',
  },
];

const MOCK_TRENDS = [
  { hashtag: '#nemapp', tweetsCount: 1820, engagement: 'High' },
  { hashtag: '#buildinpublic', tweetsCount: 24100, engagement: 'High' },
  { hashtag: '#webdev', tweetsCount: 18700, engagement: 'Medium' },
  { hashtag: '#typescript', tweetsCount: 15200, engagement: 'Medium' },
  { hashtag: '#ux', tweetsCount: 7600, engagement: 'Low' },
];

function formatCount(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthUser();
  const feed = useTweetStore((state) => state.feed);

  const analytics = useMemo(() => {
    const totalUsers = MOCK_USERS.length;
    const totalPosts = feed.length;
    const verifiedUsers = MOCK_USERS.filter((u) => u.isVerified).length;
    const totalFollowers = MOCK_USERS.reduce((sum, u) => sum + u.followersCount, 0);

    return {
      totalUsers,
      totalPosts,
      verifiedUsers,
      totalFollowers,
    };
  }, [feed.length]);

  if (!user) {
    router.push('/login');
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-full px-6 py-12">
        <h1 className="text-3xl font-extrabold text-white">Admin Access Required</h1>
        <p className="text-slate-400 mt-2 text-[15px] max-w-md">
          Your current account does not have admin privileges.
        </p>
        <button
          onClick={() => router.push('/home')}
          className="mt-5 rounded-full bg-sky-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Admin Dashboard</h1>
        <p className="text-xs text-slate-400 mt-0.5">Moderation and platform oversight</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-4 border-b border-white/8">
        <MetricCard label="Total users" value={formatCount(analytics.totalUsers)} tone="sky" />
        <MetricCard label="Total posts" value={formatCount(analytics.totalPosts)} tone="emerald" />
        <MetricCard label="Verified users" value={formatCount(analytics.verifiedUsers)} tone="amber" />
        <MetricCard label="Follower graph" value={formatCount(analytics.totalFollowers)} tone="violet" />
      </section>

      <section className="border-b border-white/8">
        <h2 className="px-4 pt-4 pb-2 text-sm font-bold uppercase tracking-wide text-slate-400">User management</h2>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/8">
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Followers</th>
                <th className="px-4 py-2">Posts</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((person) => (
                <tr key={person.id} className="border-b border-white/8 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={person.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                        alt={person.displayName}
                        className="h-8 w-8 rounded-full bg-slate-700"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{person.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">@{person.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{person.role}</td>
                  <td className="px-4 py-3 text-slate-300">{formatCount(person.followersCount)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatCount(person.tweetsCount)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-white/20 px-2 py-1 text-xs text-slate-300">
                      {person.isEmailVerified ? 'active' : 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-b border-white/8">
        <h2 className="px-4 pt-4 pb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Moderation queue</h2>
        <div className="space-y-2 px-4 pb-4">
          {MOCK_REPORTS.map((report) => (
            <article key={report.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-white font-semibold">{report.reason.toUpperCase()} report</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reporter: {report.reporter} · Target: {report.target}</p>
                </div>
                <span className="rounded-full border border-white/20 px-2 py-1 text-xs text-slate-300">
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Submitted {report.createdAt}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="px-4 pt-4 pb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Trend management</h2>
        <div className="space-y-2 px-4 pb-4">
          {MOCK_TRENDS.map((trend) => (
            <article key={trend.hashtag} className="rounded-2xl border border-white/10 bg-slate-800/60 p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{trend.hashtag}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatCount(trend.tweetsCount)} posts · {trend.engagement} engagement</p>
              </div>
              <button className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10">
                Feature
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'amber' | 'violet';
}) {
  const toneMap: Record<typeof tone, string> = {
    sky: 'border-sky-400/30 text-sky-300',
    emerald: 'border-emerald-400/30 text-emerald-300',
    amber: 'border-amber-400/30 text-amber-300',
    violet: 'border-violet-400/30 text-violet-300',
  };

  return (
    <div className={`rounded-2xl border bg-slate-800/60 px-3 py-3 ${toneMap[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}
