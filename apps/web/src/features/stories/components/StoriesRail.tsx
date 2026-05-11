'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useStoryStore } from '@/stores/storyStore';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import type { MediaItem, StoryWithAuthor } from '@shared-types';

const STORY_BACKGROUNDS = [
  'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
  'linear-gradient(135deg, #ec4899 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
];

interface StoriesRailProps {
  expanded?: boolean;
}

export function StoriesRail({ expanded = false }: StoriesRailProps) {
  const user = useAuthUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { stories, seedStories, createStory, markSeen, removeExpiredStories } = useStoryStore();
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [background, setBackground] = useState(STORY_BACKGROUNDS[0]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | undefined>();

  useEffect(() => {
    seedStories();
    removeExpiredStories();
  }, [seedStories, removeExpiredStories]);

  const orderedStories = useMemo(() => {
    if (!user) return stories;

    const ownStories = stories.filter((story) => story.authorId === user.id);
    const unseenStories = stories.filter(
      (story) => story.authorId !== user.id && !story.seenBy.includes(user.id)
    );
    const seenStories = stories.filter(
      (story) => story.authorId !== user.id && story.seenBy.includes(user.id)
    );

    return [...ownStories, ...unseenStories, ...seenStories];
  }, [stories, user]);

  const activeStory = orderedStories.find((story) => story.id === activeStoryId) ?? null;

  const handleOpenStory = (story: StoryWithAuthor) => {
    setActiveStoryId(story.id);
    if (user) {
      markSeen(story.id, user.id);
    }
  };

  const handleCreateStory = () => {
    if (!user) return;
    createStory(user.id, caption.trim(), background, selectedMedia);
    setCaption('');
    setSelectedMedia(undefined);
    setBackground(STORY_BACKGROUNDS[0]);
    setIsComposerOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedMedia({
          url: reader.result,
          type: 'image',
          alt: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <section className="border-b border-white/8 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white">Stories</h2>
            <p className="text-xs text-slate-400">Quick snapshots that disappear in 24 hours.</p>
          </div>
          <button
            onClick={() => setIsComposerOpen(true)}
            className="rounded-full bg-white text-slate-950 px-4 py-2 text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Add story
          </button>
        </div>

        <div
          className={`no-scrollbar flex gap-3 overflow-x-auto pb-1 ${expanded ? 'flex-wrap overflow-visible' : ''}`}
        >
          {user && (
            <button
              onClick={() => setIsComposerOpen(true)}
              className="group relative h-48 min-w-[128px] overflow-hidden rounded-[28px] border border-dashed border-white/15 bg-slate-900/80 p-3 text-left hover:border-sky-400/60 hover:bg-slate-900 transition-colors"
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{ background: 'radial-gradient(circle at top left, rgba(56,189,248,0.35), transparent 55%), linear-gradient(160deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95))' }}
              />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Your story</p>
                  <p className="mt-1 text-xs text-slate-300">Share a mood, image, or update.</p>
                </div>
              </div>
            </button>
          )}

          {orderedStories.map((story) => {
            const seen = user ? story.seenBy.includes(user.id) : false;
            return (
              <button
                key={story.id}
                onClick={() => handleOpenStory(story)}
                className="relative h-48 min-w-[128px] overflow-hidden rounded-[28px] border border-white/10 text-left"
              >
                <div className="absolute inset-0" style={{ background: story.background }} />
                {story.media && (
                  <img
                    src={story.media.url}
                    alt={story.media.alt ?? `${story.author.displayName} story`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
                <div className="relative flex h-full flex-col justify-between p-3">
                  <div className={`h-11 w-11 rounded-full p-[2px] ${seen ? 'bg-white/20' : 'bg-gradient-to-br from-fuchsia-500 via-orange-400 to-sky-400'}`}>
                    <img
                      src={story.author.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.author.username}`}
                      alt={story.author.displayName}
                      className="h-full w-full rounded-full border-2 border-slate-950 bg-slate-700"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white line-clamp-1">{story.author.displayName}</p>
                      {story.author.isVerified && <VerifiedBadge size={14} />}
                    </div>
                    {story.caption && (
                      <p className="mt-1 text-xs leading-5 text-slate-200 line-clamp-3">{story.caption}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsComposerOpen(false)}>
          <div
            className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Create story</h3>
                <p className="text-xs text-slate-400">Make it visual, quick, and scroll-stopping.</p>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
              <div>
                <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/10 p-5" style={{ background }}>
                  {selectedMedia && (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.alt ?? 'Story media'}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
                  <div className="relative flex h-full flex-col justify-end">
                    <textarea
                      value={caption}
                      onChange={(event) => setCaption(event.target.value.slice(0, 180))}
                      placeholder="What makes this moment worth sharing?"
                      rows={4}
                      className="w-full resize-none bg-transparent text-xl font-bold leading-8 text-white placeholder:text-white/70 focus:outline-none"
                    />
                    <p className="mt-2 text-xs text-white/80">{caption.length}/180</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Background</p>
                  <div className="grid grid-cols-5 gap-2">
                    {STORY_BACKGROUNDS.map((option) => (
                      <button
                        key={option}
                        onClick={() => setBackground(option)}
                        className={`h-10 rounded-xl border ${background === option ? 'border-white' : 'border-white/10'}`}
                        style={{ background: option }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                  <p className="text-sm font-semibold text-white">Image</p>
                  <p className="mt-1 text-xs text-slate-400">Optional. Add a vertical image from your device.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Choose image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <button
                  onClick={handleCreateStory}
                  className="w-full rounded-full bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-300"
                >
                  Publish story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setActiveStoryId(null)}>
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[36px] border border-white/10 bg-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-3">
              {orderedStories.slice(0, Math.min(5, orderedStories.length)).map((story) => (
                <span
                  key={story.id}
                  className={`h-1 flex-1 rounded-full ${story.id === activeStory.id ? 'bg-white' : 'bg-white/25'}`}
                />
              ))}
            </div>
            <div className="relative min-h-[620px]" style={{ background: activeStory.background }}>
              {activeStory.media && (
                <img
                  src={activeStory.media.url}
                  alt={activeStory.media.alt ?? `${activeStory.author.displayName} story`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />
              <div className="relative flex min-h-[620px] flex-col justify-between p-5">
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={activeStory.author.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeStory.author.username}`}
                    alt={activeStory.author.displayName}
                    className="h-11 w-11 rounded-full border border-white/30"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white">{activeStory.author.displayName}</p>
                      {activeStory.author.isVerified && <VerifiedBadge size={14} />}
                    </div>
                    <p className="text-xs text-slate-200">{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  <button
                    onClick={() => setActiveStoryId(null)}
                    className="ml-auto rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div>
                  {activeStory.caption && (
                    <p className="text-2xl font-bold leading-9 text-white">{activeStory.caption}</p>
                  )}
                  <p className="mt-3 text-sm text-white/80">{activeStory.viewersCount} viewers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
