'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';

const MAX_CHARS = 280;

export function TweetComposer() {
  const user = useAuthUser();
  const { createTweet } = useTweetStore();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  if (!user) return null;

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isEmpty = content.trim().length === 0;
  const canPost = !isEmpty && !isOverLimit;

  // Progress ring for character counter
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(content.length / MAX_CHARS, 1);
  const dashOffset = circumference * (1 - progress);
  const ringColor =
    isOverLimit ? '#ef4444' : charsLeft <= 20 ? '#f59e0b' : '#1d9bf0';

  const handleSubmit = () => {
    if (!canPost) return;
    createTweet(content.trim(), user.id);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="px-4 py-3 border-b border-white/8">
      <div className="flex gap-3">
        {/* Avatar */}
        <img
          src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
          alt={user.displayName}
          className="w-10 h-10 rounded-full bg-slate-700 shrink-0 mt-1"
        />

        {/* Input area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's happening?"
            rows={1}
            className="w-full resize-none bg-transparent text-white text-[20px] placeholder-slate-500 outline-none leading-[1.5] min-h-[48px] pt-2"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8">
            {/* Media buttons */}
            <div className="flex items-center gap-1 -ml-2">
              {[
                { title: 'Image', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
              ].map(() => null)}
              <ToolbarIconBtn title="Image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              </ToolbarIconBtn>
              <ToolbarIconBtn title="GIF">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M12 12h4" /><path d="M17 9v6" /><path d="M7 12a2 2 0 1 0 4 0v-3H7" />
                </svg>
              </ToolbarIconBtn>
              <ToolbarIconBtn title="Emoji">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </ToolbarIconBtn>
              <ToolbarIconBtn title="Poll">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </ToolbarIconBtn>
            </div>

            {/* Right: counter + post btn */}
            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* Ring */}
                  <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
                    <circle cx="14" cy="14" r={radius} fill="none" stroke="#2f3336" strokeWidth="2.5" />
                    <circle
                      cx="14" cy="14" r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="2.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  {charsLeft <= 20 && (
                    <span className={`text-sm tabular-nums ${isOverLimit ? 'text-red-400' : 'text-amber-400'}`}>
                      {charsLeft}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canPost}
                className="rounded-full bg-sky-400 text-slate-950 font-bold px-5 py-2 text-[15px] hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarIconBtn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      className="p-2 rounded-full text-sky-400 hover:bg-sky-400/10 transition-colors"
    >
      {children}
    </button>
  );
}
