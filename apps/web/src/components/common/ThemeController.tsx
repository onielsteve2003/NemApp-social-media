'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function ThemeController() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'light') {
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
      return;
    }

    if (theme === 'dark') {
      root.classList.remove('theme-light');
      root.style.colorScheme = 'dark';
      return;
    }

    // System mode fallback
    const prefersLight =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches;

    if (prefersLight) {
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('theme-light');
      root.style.colorScheme = 'dark';
    }
  }, [theme]);

  return null;
}
