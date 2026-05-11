'use client';

import { useMemo } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore';
import { MOCK_USERS } from '@/mocks/auth';

export default function SettingsPage() {
  const user = useAuthUser();
  const {
    theme,
    setTheme,
    notificationPreferences,
    privacyPreferences,
    blockedUserIds,
    toggleNotificationPref,
    togglePrivacyPref,
    toggleBlockedUser,
    isUserBlocked,
  } = useSettingsStore();

  const blockCandidates = useMemo(() => {
    if (!user) return [];
    return MOCK_USERS.filter((person) => person.id !== user.id);
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">Account, privacy, and app preferences.</p>
      </header>

      <section className="px-4 py-5 border-b border-white/8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Theme</h2>
        <div className="grid grid-cols-3 gap-2">
          {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`
                rounded-xl px-3 py-2 text-sm font-semibold border transition-colors
                ${theme === mode
                  ? 'bg-sky-400 text-slate-950 border-sky-400'
                  : 'border-white/15 text-white hover:bg-white/5'
                }
              `}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 py-5 border-b border-white/8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Account</h2>
        <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4 space-y-2">
          <p className="text-sm text-white">Display name: {user.displayName}</p>
          <p className="text-sm text-slate-400">Username: @{user.username}</p>
          <p className="text-sm text-slate-400">Email: {user.email}</p>
        </div>
      </section>

      <section className="px-4 py-5 border-b border-white/8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Privacy</h2>
        <PreferenceToggle
          title="Private account"
          description="Only approved followers can see your posts."
          checked={privacyPreferences.isPrivateAccount}
          onChange={() => togglePrivacyPref('isPrivateAccount')}
        />
        <PreferenceToggle
          title="Hide email on profile"
          description="Do not expose your email in public surfaces."
          checked={privacyPreferences.hideEmail}
          onChange={() => togglePrivacyPref('hideEmail')}
        />
        <PreferenceToggle
          title="Allow messages from everyone"
          description="If off, only people you follow can message you."
          checked={privacyPreferences.allowMessagesFromEveryone}
          onChange={() => togglePrivacyPref('allowMessagesFromEveryone')}
        />
      </section>

      <section className="px-4 py-5 border-b border-white/8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Notifications</h2>
        <PreferenceToggle
          title="Likes"
          description="Get notified when your posts are liked."
          checked={notificationPreferences.likes}
          onChange={() => toggleNotificationPref('likes')}
        />
        <PreferenceToggle
          title="Follows"
          description="Get notified when someone follows you."
          checked={notificationPreferences.follows}
          onChange={() => toggleNotificationPref('follows')}
        />
        <PreferenceToggle
          title="Replies"
          description="Get notified for replies to your posts."
          checked={notificationPreferences.replies}
          onChange={() => toggleNotificationPref('replies')}
        />
        <PreferenceToggle
          title="Mentions"
          description="Get notified when someone mentions you."
          checked={notificationPreferences.mentions}
          onChange={() => toggleNotificationPref('mentions')}
        />
        <PreferenceToggle
          title="Messages"
          description="Get notified for new direct messages."
          checked={notificationPreferences.messages}
          onChange={() => toggleNotificationPref('messages')}
        />
      </section>

      <section className="px-4 py-5 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Blocked users</h2>
        <p className="text-xs text-slate-500">{blockedUserIds.length} blocked</p>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          {blockCandidates.map((person) => {
            const blocked = isUserBlocked(person.id);
            return (
              <div key={person.id} className="flex items-center gap-3 px-3 py-3 border-b border-white/8 last:border-b-0">
                <img
                  src={person.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                  alt={person.displayName}
                  className="h-10 w-10 rounded-full bg-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{person.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">@{person.username}</p>
                </div>
                <button
                  onClick={() => toggleBlockedUser(person.id)}
                  className={`
                    rounded-full px-3 py-1.5 text-xs font-bold transition-colors
                    ${blocked
                      ? 'border border-red-500 text-red-400 hover:bg-red-500/10'
                      : 'border border-white/20 text-white hover:bg-white/10'
                    }
                  `}
                >
                  {blocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-left hover:bg-white/5 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <span
          className={`
            mt-0.5 h-6 w-11 rounded-full relative transition-colors
            ${checked ? 'bg-sky-400' : 'bg-slate-600'}
          `}
        >
          <span
            className={`
              absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform
              ${checked ? 'translate-x-5' : 'translate-x-0.5'}
            `}
          />
        </span>
      </div>
    </button>
  );
}
