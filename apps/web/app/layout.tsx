'use client';

import React from 'react';
import './globals.css';
import { ToastProvider } from '@/components/common/Toast';
import { ThemeController } from '@/components/common/ThemeController';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeController />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
