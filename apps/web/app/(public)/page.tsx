'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/stores/authStore';
import { NemAppLogo } from '@/components/common/NemAppLogo';

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <NemAppLogo size="sm" />
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 rounded-full bg-primary text-black font-semibold hover:bg-primary/90 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 px-6 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">
                Meet NemApp
              </p>
              <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                The network for live moments and real conversation.
              </h1>
              <p className="text-xl md:text-2xl text-gray-300">
                NemApp helps you post fast, message clearly, and stay close to the people and topics moving right now.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6 pt-8">
              <FeatureItem
                icon="💬"
                title="Express Yourself"
                description="Share your thoughts in 280 characters or less"
              />
              <FeatureItem
                icon="👥"
                title="Connect with Others"
                description="Follow friends, discuss trending topics, and build communities"
              />
              <FeatureItem
                icon="📊"
                title="Trending Insights"
                description="Discover what's trending globally and locally in real-time"
              />
              <FeatureItem
                icon="💌"
                title="Direct Messages"
                description="Have private conversations with your followers"
              />
            </div>

            {/* CTA Buttons */}
            <div className="pt-8 space-y-3">
              <Link
                href="/register"
                className="block w-full px-6 py-3 rounded-full bg-primary text-black font-bold text-center hover:bg-primary/90 transition-colors text-lg"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="block w-full px-6 py-3 rounded-full border-2 border-primary text-primary font-bold text-center hover:bg-primary/10 transition-colors text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full h-96">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white/5 backdrop-blur rounded-3xl border border-white/10 p-8 h-full flex flex-col items-center justify-center space-y-6">
                <NemAppLogo size="lg" showWordmark={false} />
                <p className="text-center text-gray-300">
                  A sharper social platform for instant posts, social discovery, and direct connection.
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>&copy; 2026 NemApp. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex gap-4">
      <span className="text-3xl flex-shrink-0">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}
