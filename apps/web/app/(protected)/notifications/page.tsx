'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function notificationText(type: string, actorUsername: string): string {
  switch (type) {
    case 'follow':
      return `@${actorUsername} followed you`;
    case 'mention':
      return `@${actorUsername} mentioned you`;
    case 'reply':
      return `@${actorUsername} replied to your post`;
    case 'retweet':
      return `@${actorUsername} reposted your post`;
    case 'message':
      return `@${actorUsername} sent you a message`;
    default:
      return `@${actorUsername} liked your post`;
  }
}

export default function NotificationsPage() {
  const user = useAuthUser();
  const {
    notifications,
    seedNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    if (user) {
      seedNotifications(user.id);
    }
  }, [user, seedNotifications]);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications
      .filter((item) => item.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [notifications, user]);

  const unreadCount = userNotifications.filter((item) => !item.isRead).length;

  if (!user) return null;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-extrabold text-white">Notifications</h1>
            <p className="text-xs text-slate-400">
              {unreadCount} unread
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllAsRead(user.id)}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Mark all read
            </button>
            <button
              onClick={() => clearAll(user.id)}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      {userNotifications.length === 0 ? (
        <div className="px-6 py-12 border-b border-white/8">
          <h3 className="text-3xl font-extrabold text-white">No notifications yet</h3>
          <p className="text-slate-400 mt-2 text-[15px]">
            Interactions like follows, mentions, and replies will show up here.
          </p>
        </div>
      ) : (
        <section>
          {userNotifications.map((item) => (
            <article
              key={item.id}
              className={`
                px-4 py-3 border-b border-white/8 transition-colors
                ${item.isRead ? 'bg-transparent' : 'bg-sky-400/5'}
              `}
            >
              <div className="flex gap-3">
                <img
                  src={item.actor.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.actor.username}`}
                  alt={item.actor.displayName}
                  className="w-10 h-10 rounded-full bg-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white leading-relaxed">
                      {notificationText(item.type, item.actor.username)}
                    </p>
                    <span className="text-xs text-slate-500 shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <Link
                      href={`/profile/${item.actor.username}`}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      View profile
                    </Link>
                    {!item.isRead && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="text-xs text-slate-400 hover:text-white hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
