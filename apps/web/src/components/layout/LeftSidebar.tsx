'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useAuthUser } from '@/stores/authStore';
import { NemAppLogo } from '@/components/common/NemAppLogo';

const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Bookmarks',
    href: '/bookmarks',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function LeftSidebar({ onNewPost }: { onNewPost: () => void }) {
  const pathname = usePathname();
  const user = useAuthUser();
  const { logout } = useAuthStore();

  return (
    <aside className="flex h-screen w-[72px] xl:w-64 flex-col items-center xl:items-start px-2 xl:px-4 py-3 border-r border-white/8 fixed left-0 top-0 z-30">
      {/* Logo */}
      <Link href="/home" className="mb-2 p-2 rounded-full hover:bg-white/8 transition-colors xl:ml-2">
        <NemAppLogo size="sm" className="xl:hidden" />
        <span className="hidden xl:block">
          <NemAppLogo size="md" />
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 w-full mt-2">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-4 rounded-full px-3 py-3 xl:pr-6
                text-[17px] font-medium transition-colors group w-fit xl:w-full
                ${active ? 'text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-white/8'}
              `}
            >
              <span className={active ? 'text-sky-400' : 'text-inherit'}>{icon(active)}</span>
              <span className="hidden xl:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Post button */}
      <button
        onClick={onNewPost}
        className="
          mt-4 rounded-full bg-sky-400 text-slate-950 font-bold transition-colors hover:bg-sky-300
          w-12 h-12 xl:w-full xl:h-auto xl:px-6 xl:py-3 xl:text-[17px]
          flex items-center justify-center
        "
      >
        <svg className="xl:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="hidden xl:block">New Post</span>
      </button>

      {/* User mini card */}
      {user && (
        <div className="mt-auto w-full">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 rounded-full px-3 py-2 w-full hover:bg-white/8 transition-colors text-left"
            title="Sign out"
          >
            <img
              src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.displayName}
              className="w-10 h-10 rounded-full shrink-0 bg-slate-700"
            />
            <div className="hidden xl:block min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">{user.displayName}</p>
              <p className="text-sm text-slate-400 truncate">@{user.username}</p>
            </div>
            <svg className="hidden xl:block ml-auto shrink-0 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}
