'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useTweetStore } from '@/stores/tweetStore';
import type { MediaItem, Poll } from '@shared-types';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface GifResult {
  id: string;
  title: string;
  url: string;
}

const MAX_CHARS = 280;

export function TweetComposer() {
  const user = useAuthUser();
  const { createTweet } = useTweetStore();
  const [content, setContent] = useState('');
  const [mediaAttachments, setMediaAttachments] = useState<MediaItem[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [gifSearching, setGifSearching] = useState(false);
  const composerAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  useEffect(() => {
    const handleFocusComposer = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.addEventListener('nemapp:new-post', handleFocusComposer);
    return () => {
      window.removeEventListener('nemapp:new-post', handleFocusComposer);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!composerAreaRef.current?.contains(target)) {
        setShowGifSearch(false);
        setShowEmojiPicker(false);
        setShowPollCreator(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setMediaAttachments([
        ...mediaAttachments,
        { url: imageData, type: 'image' },
      ]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifResults([]);
      return;
    }

    setGifSearching(true);
    try {
      // Use Tenor legacy endpoint with public test key as a reliable no-setup GIF source.
      const response = await fetch(
        `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULELA&limit=12&media_filter=minimal`
      );

      if (!response.ok) {
        throw new Error(`GIF search failed with status ${response.status}`);
      }

      const data = await response.json();
      const normalized: GifResult[] = (data.results || [])
        .map((item: any) => ({
          id: item.id,
          title: item.content_description || item.title || 'GIF',
          url:
            item.media?.[0]?.gif?.url ||
            item.media?.[0]?.mediumgif?.url ||
            item.media?.[0]?.tinygif?.url ||
            '',
        }))
        .filter((item: GifResult) => item.url.length > 0);

      setGifResults(normalized);
    } catch (error) {
      console.error('GIF search failed:', error);
      setGifResults([]);
    } finally {
      setGifSearching(false);
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    setMediaAttachments([
      ...mediaAttachments,
      { url: gifUrl, type: 'gif' },
    ]);
    setShowGifSearch(false);
    setShowEmojiPicker(false);
    setShowPollCreator(false);
    setGifSearch('');
    setGifResults([]);
  };

  const handleEmojiClick = (emojiData: any) => {
    setContent(content + emojiData.emoji);
    setShowEmojiPicker(false);
    setShowGifSearch(false);
    setShowPollCreator(false);
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index: number, text: string) => {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  };

  const handleSubmit = async () => {
    if (!canPost) return;

    // Create poll if enabled
    let poll: Poll | undefined;
    if (showPollCreator && pollOptions.filter(o => o.trim()).length >= 2) {
      poll = {
        id: `poll-${Date.now()}`,
        options: pollOptions
          .filter(o => o.trim())
          .map((text, index) => ({
            id: `option-${index}`,
            text,
            votes: 0,
          })),
        totalVotes: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }

    await createTweet(
      content.trim(),
      user.id,
      mediaAttachments.length > 0 ? mediaAttachments : undefined,
      poll
    );

    setContent('');
    setMediaAttachments([]);
    setPollOptions(['', '']);
    setShowPollCreator(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      void handleSubmit();
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
        <div ref={composerAreaRef} className="flex-1 min-w-0">
          <textarea
            id="tweet-composer"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's happening?"
            rows={1}
            className="w-full resize-none bg-transparent text-white text-[20px] placeholder-slate-500 outline-none leading-[1.5] min-h-[48px] pt-2"
          />

          {/* Media attachments preview */}
          {mediaAttachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {mediaAttachments.map((attachment, i) => (
                <div key={i} className="relative">
                  <img
                    src={attachment.url}
                    alt={`attachment-${i}`}
                    className={`h-24 rounded border border-sky-400 ${
                      attachment.type === 'gif'
                        ? 'object-cover object-[center_35%]'
                        : 'object-cover'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMediaAttachments(
                        mediaAttachments.filter((_, idx) => idx !== i)
                      )
                    }
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 text-white text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Poll preview */}
          {showPollCreator && (
            <div className="mb-3 p-3 bg-slate-900 rounded border border-white/8">
              <div className="text-sm font-semibold text-white mb-2">Create Poll</div>
              {pollOptions.map((option, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handlePollOptionChange(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-slate-800 text-white text-sm px-2 py-1 rounded border border-white/8 outline-none focus:border-sky-400"
                    maxLength={25}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(i)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-sm text-sky-400 hover:text-sky-300"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8">
            {/* Media buttons */}
            <div className="flex items-center gap-1 -ml-2 relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <ToolbarIconBtn
                title="Image"
                onClick={() => {
                  setShowGifSearch(false);
                  setShowEmojiPicker(false);
                  setShowPollCreator(false);
                  fileInputRef.current?.click();
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </ToolbarIconBtn>

              {/* GIF Picker */}
              <div className="relative">
                <ToolbarIconBtn
                  title="GIF"
                  onClick={() => {
                    setShowEmojiPicker(false);
                    setShowPollCreator(false);
                    setShowGifSearch((prev) => !prev);
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M12 12h4" />
                    <path d="M17 9v6" />
                    <path d="M7 12a2 2 0 1 0 4 0v-3H7" />
                  </svg>
                </ToolbarIconBtn>
                {showGifSearch && (
                  <div className="absolute top-full mt-2 left-0 bg-slate-900 border border-white/8 rounded-lg p-3 z-50 w-72">
                    <input
                      type="text"
                      value={gifSearch}
                      onChange={(e) => {
                        setGifSearch(e.target.value);
                        searchGifs(e.target.value);
                      }}
                      placeholder="Search GIFs..."
                      className="w-full bg-slate-800 text-white text-sm px-2 py-1 rounded border border-white/8 outline-none focus:border-sky-400 mb-2"
                    />
                    {gifSearching && (
                      <div className="text-sm text-slate-400 py-2">Searching...</div>
                    )}
                    {gifResults.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto no-scrollbar">
                        {gifResults.map((gif) => (
                          <button
                            key={gif.id}
                            onClick={() => handleGifSelect(gif.url)}
                            className="group relative overflow-hidden rounded"
                          >
                            <img
                              src={gif.url}
                              alt={gif.title}
                              className="w-full h-24 bg-slate-900 object-contain object-[center_72%] group-hover:opacity-85"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {gifSearch && !gifSearching && gifResults.length === 0 && (
                      <div className="text-sm text-slate-400 py-2">No results found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Emoji Picker */}
              <div className="relative">
                <ToolbarIconBtn
                  title="Emoji"
                  onClick={() => {
                    setShowGifSearch(false);
                    setShowPollCreator(false);
                    setShowEmojiPicker((prev) => !prev);
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </ToolbarIconBtn>
                {showEmojiPicker && (
                  <div className="absolute top-full mt-2 left-0 z-50 no-scrollbar">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={Theme.DARK}
                      height={350}
                      width={300}
                    />
                  </div>
                )}
              </div>

              {/* Poll */}
              <ToolbarIconBtn
                title="Poll"
                onClick={() => {
                  setShowGifSearch(false);
                  setShowEmojiPicker(false);
                  setShowPollCreator((prev) => !prev);
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </ToolbarIconBtn>
            </div>

            {/* Right: counter + post btn */}
            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* Ring */}
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    className="-rotate-90"
                  >
                    <circle
                      cx="14"
                      cy="14"
                      r={radius}
                      fill="none"
                      stroke="#2f3336"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="14"
                      cy="14"
                      r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="2.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  {charsLeft <= 20 && (
                    <span
                      className={`text-sm tabular-nums ${
                        isOverLimit ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {charsLeft}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  void handleSubmit();
                }}
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

function ToolbarIconBtn({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-2 rounded-full text-sky-400 hover:bg-sky-400/10 transition-colors"
    >
      {children}
    </button>
  );
}
