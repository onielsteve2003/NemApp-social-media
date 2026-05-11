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
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimeoutRef = useRef<number | null>(null);
  const imageStartedAtRef = useRef<number | null>(null);
  const imageElapsedMsRef = useRef(0);
  const preloadedMediaRef = useRef(new Set<string>());
  const goToNextStoryRef = useRef<() => void>(() => {});
  const railScrollRef = useRef<HTMLDivElement>(null);
  const { stories, seedStories, createStory, markSeen, removeExpiredStories } = useStoryStore();
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [background, setBackground] = useState(STORY_BACKGROUNDS[0]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | undefined>();
  const [progress, setProgress] = useState(0);
  const [activeDurationMs, setActiveDurationMs] = useState(5000);
  const [progressTransitionMs, setProgressTransitionMs] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    seedStories();
    removeExpiredStories();
  }, [seedStories, removeExpiredStories]);

  useEffect(() => {
    for (const story of stories) {
      const media = story.media;
      if (!media || preloadedMediaRef.current.has(media.url)) {
        continue;
      }

      if (media.type === 'image') {
        const image = new window.Image();
        image.src = media.url;
      } else {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.src = media.url;
        video.load();
      }

      preloadedMediaRef.current.add(media.url);
    }
  }, [stories]);

  const orderedStories = useMemo(() => {
    return [...stories].sort(
      (a, b) => {
        const timeDelta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDelta !== 0) {
          return timeDelta;
        }

        const sequenceA = Number(a.id.replace('story-', ''));
        const sequenceB = Number(b.id.replace('story-', ''));
        if (!Number.isNaN(sequenceA) && !Number.isNaN(sequenceB) && sequenceA !== sequenceB) {
          return sequenceA - sequenceB;
        }

        return a.id.localeCompare(b.id);
      }
    );
  }, [stories, user]);

  const storyGroups = useMemo(() => {
    const grouped = new Map<string, StoryWithAuthor[]>();

    for (const story of orderedStories) {
      const existing = grouped.get(story.authorId) ?? [];
      existing.push(story);
      grouped.set(story.authorId, existing);
    }

    const groups = Array.from(grouped.values());
    const ownGroups = user ? groups.filter((group) => group[0]?.authorId === user.id) : [];
    const unseenGroups = groups.filter(
      (group) => !user || (group[0]?.authorId !== user.id && group.some((story) => !story.seenBy.includes(user.id)))
    );
    const seenGroups = groups.filter(
      (group) => user && group[0]?.authorId !== user.id && group.every((story) => story.seenBy.includes(user.id))
    );

    return user ? [...ownGroups, ...unseenGroups, ...seenGroups] : groups;
  }, [orderedStories, user]);

  const activeStory = orderedStories.find((story) => story.id === activeStoryId) ?? null;
  const activeGroupIndex = storyGroups.findIndex((group) => group.some((story) => story.id === activeStoryId));
  const activeGroup = activeGroupIndex >= 0 ? storyGroups[activeGroupIndex] : null;
  const activeStoryIndex = activeGroup?.findIndex((story) => story.id === activeStoryId) ?? -1;

  const clearImageTimer = () => {
    if (imageTimeoutRef.current !== null) {
      window.clearTimeout(imageTimeoutRef.current);
      imageTimeoutRef.current = null;
    }
  };

  const startImageProgress = (fromProgress = 0, durationMs = activeDurationMs) => {
    clearImageTimer();
    setProgressTransitionMs(0);
    setProgress(fromProgress);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const remainingMs = durationMs * (1 - fromProgress / 100);
        if (remainingMs <= 0) {
          goToNextStoryRef.current();
          return;
        }

        imageStartedAtRef.current = performance.now();
        imageElapsedMsRef.current = (fromProgress / 100) * durationMs;
        setProgressTransitionMs(remainingMs);
        setProgress(100);
        imageTimeoutRef.current = window.setTimeout(() => {
          goToNextStoryRef.current();
        }, remainingMs);
      });
    });
  };

  const goToStory = (story: StoryWithAuthor | null) => {
    if (!story) {
      setActiveStoryId(null);
      return;
    }

    setActiveStoryId(story.id);
    if (user && story.authorId !== user.id) {
      markSeen(story.id, user.id);
    }
  };

  const goToNextStory = () => {
    if (!activeGroup || activeStoryIndex < 0) return;

    const nextStoryInGroup = activeGroup[activeStoryIndex + 1] ?? null;
    if (nextStoryInGroup) {
      goToStory(nextStoryInGroup);
      return;
    }

    const nextGroup = storyGroups[activeGroupIndex + 1] ?? null;
    goToStory(nextGroup?.[0] ?? null);
  };

  // keep ref in sync so setTimeout callbacks always call the latest version
  goToNextStoryRef.current = goToNextStory;

  const goToPreviousStory = () => {
    if (!activeGroup || activeStoryIndex < 0) return;

    const previousStoryInGroup = activeGroup[activeStoryIndex - 1] ?? null;
    if (previousStoryInGroup) {
      goToStory(previousStoryInGroup);
      return;
    }

    const previousGroup = storyGroups[activeGroupIndex - 1] ?? null;
    goToStory(previousGroup ? previousGroup[previousGroup.length - 1] : null);
  };

  const handleOpenStory = (story: StoryWithAuthor) => {
    const group = storyGroups.find((candidate) => candidate[0]?.authorId === story.authorId) ?? [story];
    if (user && story.authorId === user.id) {
      goToStory(story);
      return;
    }

    const firstUnseen = user
      ? group.find((item) => !item.seenBy.includes(user.id))
      : group[0];
    goToStory(firstUnseen ?? group[0] ?? story);
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
          type: file.type.startsWith('video/') ? 'video' : 'image',
          alt: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePause = () => {
    if (!activeStory) return;

    if (activeStory.media?.type === 'video') {
      const video = videoRef.current;
      if (!video) return;

      if (isPaused) {
        void video.play();
      } else {
        video.pause();
      }
      setIsPaused((prev) => !prev);
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      startImageProgress(progress, activeDurationMs);
      return;
    }

    if (imageStartedAtRef.current !== null) {
      const elapsed = imageElapsedMsRef.current + (performance.now() - imageStartedAtRef.current);
      const nextProgress = Math.min((elapsed / activeDurationMs) * 100, 100);
      imageElapsedMsRef.current = elapsed;
      imageStartedAtRef.current = null;
      clearImageTimer();
      setProgressTransitionMs(0);
      setProgress(nextProgress);
    }

    setIsPaused(true);
  };

  useEffect(() => {
    // depend only on activeStoryId — not activeStory (object ref) — to avoid
    // spurious resets whenever the stories array reference changes
    const story = orderedStories.find((s) => s.id === activeStoryId) ?? null;

    if (!story) {
      setProgress(0);
      setProgressTransitionMs(0);
      setIsPaused(false);
      clearImageTimer();
      return;
    }

    clearImageTimer();
    setProgress(0);
    setProgressTransitionMs(0);
    setActiveDurationMs(story.media?.type === 'video' ? 8000 : 5000);
    setIsMuted(true);
    setIsPaused(false);
    imageStartedAtRef.current = null;
    imageElapsedMsRef.current = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId]);

  useEffect(() => {
    const story = orderedStories.find((s) => s.id === activeStoryId) ?? null;
    if (!story) return;
    if (story.media?.type === 'video') return;

    startImageProgress(0, activeDurationMs);

    return () => {
      clearImageTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId, activeDurationMs]);

  useEffect(() => {
    const story = orderedStories.find((s) => s.id === activeStoryId) ?? null;
    if (!story || story.media?.type !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    let frameId = 0;

    const syncProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) {
        frameId = window.requestAnimationFrame(syncProgress);
        return;
      }

      setActiveDurationMs(video.duration * 1000);
      const nextProgress = Math.min((video.currentTime / video.duration) * 100, 100);
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        goToNextStory();
        return;
      }

      frameId = window.requestAnimationFrame(syncProgress);
    };

    if (isPaused) {
      video.pause();
    } else {
      void video.play();
    }

    frameId = window.requestAnimationFrame(syncProgress);
    return () => window.cancelAnimationFrame(frameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId, isPaused]);

  useEffect(() => {
    if (!activeStoryId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        goToNextStory();
      }
      if (event.key === 'ArrowLeft') {
        goToPreviousStory();
      }
      if (event.key === 'Escape') {
        setActiveStoryId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryId, activeGroupIndex, activeStoryIndex, storyGroups]);

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

        <div className="group/rail relative">
        <button
          onClick={() => { railScrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' }); }}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 border border-white/10 text-white shadow-lg opacity-0 transition-opacity group-hover/rail:opacity-100 hover:bg-slate-800"
          aria-label="Scroll stories left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button
          onClick={() => { railScrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' }); }}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 border border-white/10 text-white shadow-lg opacity-0 transition-opacity group-hover/rail:opacity-100 hover:bg-slate-800"
          aria-label="Scroll stories right"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <div
          ref={railScrollRef}
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

          {storyGroups.map((group) => {
            const story = group[group.length - 1];
            const seen = user ? group.every((item) => item.seenBy.includes(user.id)) : false;
            return (
              <button
                key={story.id}
                onClick={() => handleOpenStory(story)}
                className="relative h-48 min-w-[128px] overflow-hidden rounded-[28px] border border-white/10 text-left"
              >
                <div className="absolute inset-0" style={{ background: story.background }} />
                {story.media?.type === 'video' ? (
                  <video
                    src={story.media.url}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : story.media ? (
                  <img
                    src={story.media.url}
                    alt={story.media.alt ?? `${story.author.displayName} story`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
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
                    {group.length > 1 && (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                        {group.length} stories
                      </p>
                    )}
                    {story.caption && (
                      <p className="mt-1 text-xs leading-5 text-slate-200 line-clamp-3">{story.caption}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
                  {selectedMedia?.type === 'video' ? (
                    <video
                      src={selectedMedia.url}
                      className="absolute inset-0 h-full w-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : selectedMedia ? (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.alt ?? 'Story media'}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
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
                  <p className="mt-1 text-xs text-slate-400">Optional. Add a vertical image or video from your device.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Choose image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
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
              {activeGroup?.map((story, index) => (
                <span key={story.id} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  {index < activeStoryIndex && <span className="absolute inset-0 bg-white" />}
                  {index === activeStoryIndex && (
                    <span
                      className="absolute inset-y-0 left-0 bg-white"
                      style={{
                        width: `${progress}%`,
                        transition: progressTransitionMs > 0 ? `width ${progressTransitionMs}ms linear` : 'none',
                      }}
                    />
                  )}
                </span>
              ))}
            </div>
            <button
              onClick={goToPreviousStory}
              className="absolute inset-y-0 left-0 z-20 w-1/3"
              aria-label="Previous story"
            />
            <button
              onClick={goToNextStory}
              className="absolute inset-y-0 right-0 z-20 w-1/3"
              aria-label="Next story"
            />
            <div className="relative min-h-[620px]" style={{ background: activeStory.background }}>
              {activeStory.media?.type === 'video' ? (
                <video
                  key={activeStory.id}
                  ref={videoRef}
                  src={activeStory.media.url}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onLoadedMetadata={(event) => {
                    if (event.currentTarget.duration) {
                      setActiveDurationMs(event.currentTarget.duration * 1000);
                    }
                  }}
                  onEnded={goToNextStory}
                />
              ) : activeStory.media ? (
                <img
                  key={activeStory.id}
                  src={activeStory.media.url}
                  alt={activeStory.media.alt ?? `${activeStory.author.displayName} story`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />
              <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-5">
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
                    onClick={handleTogglePause}
                    className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label={isPaused ? 'Resume story' : 'Pause story'}
                  >
                    {isPaused ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="8,5 19,12 8,19" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    )}
                  </button>
                  {activeStory.media?.type === 'video' && (
                    <button
                      onClick={() => setIsMuted((prev) => !prev)}
                      className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {isMuted ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveStoryId(null)}
                    className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
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
                  <p className="mt-3 text-sm text-white/80">
                    Story {activeStoryIndex + 1} of {activeGroup?.length ?? 1} · {activeStory.viewersCount} viewers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
