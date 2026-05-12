'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthUser } from '@/stores/authStore';
import { useMessageStore } from '@/stores/messageStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSocialStore } from '@/stores/socialStore';
import { apiClient } from '@/lib/apiClient';
import type { UserProfile } from '@shared-types';

interface UserSearchResponse {
  success: boolean;
  data: {
    users: UserProfile[];
  };
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const targetUsername = searchParams.get('user');
  const user = useAuthUser();
  const blockedUserIds = useSettingsStore((state) => state.blockedUserIds);
  const allowMessagesFromEveryone = useSettingsStore(
    (state) => state.privacyPreferences.allowMessagesFromEveryone
  );
  const followingIds = useSocialStore((state) => state.followingIds);
  const {
    conversations,
    messagesByConversation,
    activeConversationId,
    seedMessages,
    openConversationWithUser,
    setActiveConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    hideConversationForMe,
    getParticipant,
  } = useMessageStore();

  const [draft, setDraft] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (user) {
      void seedMessages(user.id);
    }
  }, [user, seedMessages]);

  useEffect(() => {
    const query = userSearch.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const response = await apiClient.get<UserSearchResponse>(`/api/users/search?query=${encodeURIComponent(query)}`);
        if (!cancelled) {
          setSearchResults(response.data.users ?? []);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingUsers(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [userSearch]);

  useEffect(() => {
    if (!user || !targetUsername) return;

    void (async () => {
      const response = await apiClient.get<{ success: boolean; data: { user?: { id: string } } }>(`/api/users/${targetUsername}`);
      const targetId = response.data.user?.id;
      if (!targetId) return;
      await openConversationWithUser(targetId);
    })();
  }, [user, targetUsername, openConversationWithUser]);

  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) => !blockedUserIds.includes(conversation.participantId)
      ),
    [conversations, blockedUserIds]
  );

  const activeConversation = useMemo(
    () =>
      visibleConversations.find(
        (conversation) => conversation.id === activeConversationId
      ) ?? null,
    [visibleConversations, activeConversationId]
  );

  const activeMessages =
    activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];

  const participant = activeConversation
    ? getParticipant(activeConversation.participantId)
    : null;

  const canMessageParticipant =
    !participant ||
    allowMessagesFromEveryone ||
    followingIds.includes(participant.id);

  const handleSend = () => {
    if (!activeConversationId || draft.trim().length === 0) return;
    void sendMessage(activeConversationId, draft.trim());
    setDraft('');
  };

  const handleEditMessage = async (conversationId: string, messageId: string, currentContent: string) => {
    const nextContent = window.prompt('Edit message', currentContent)?.trim();
    if (!nextContent || nextContent === currentContent) return;
    await editMessage(conversationId, messageId, nextContent);
  };

  const handleDeleteMessage = async (conversationId: string, messageId: string) => {
    const deleteForAll = window.confirm('Delete for everyone? Press OK for everyone, Cancel for me only.');
    await deleteMessage(conversationId, messageId, deleteForAll ? 'all' : 'me');
  };

  if (!user) return null;

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Messages</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[calc(100vh-66px)]">
        <aside className="border-b md:border-b-0 md:border-r border-white/8 no-scrollbar overflow-y-auto max-h-[260px] md:max-h-none">
          <div className="p-3 border-b border-white/8 space-y-2 sticky top-0 bg-slate-950/95 backdrop-blur-md z-10">
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search users to chat"
              className="w-full rounded-full bg-slate-800 border border-white/10 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            {userSearch.trim().length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggestions</p>
                </div>
                {isSearchingUsers ? (
                  <p className="px-4 py-3 text-sm text-slate-400">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">No users match that search</p>
                ) : (
                  searchResults.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => {
                        setUserSearch('');
                        setSearchResults([]);
                        void openConversationWithUser(person.id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
                    >
                      <img
                        src={person.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                        alt={person.displayName}
                        className="h-9 w-9 rounded-full bg-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{person.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">@{person.username}</p>
                        {person.bio && (
                          <p className="text-[11px] text-slate-500 truncate">{person.bio}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {visibleConversations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">No conversations yet.</p>
          ) : (
            visibleConversations.map((conversation) => {
              const person = getParticipant(conversation.participantId);
              const active = conversation.id === activeConversationId;

              return (
                <div
                  key={conversation.id}
                  className={`group relative w-full text-left px-3 py-3 border-b border-white/8 transition-colors ${active ? 'bg-sky-400/10' : 'hover:bg-white/5'}`}
                >
                  <button
                    onClick={() => {
                      void setActiveConversation(conversation.id);
                    }}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <img
                      src={person?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${person?.username ?? 'user'}`}
                      alt={person?.displayName ?? 'User'}
                      className="h-8 w-8 rounded-full bg-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {person?.displayName ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => void hideConversationForMe(conversation.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                    aria-label="Hide conversation"
                    title="Hide conversation"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58A2 2 0 0 0 14 12a2 2 0 0 0-3.42-1.42" />
                      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.3 18.3 0 0 1-4.27 5.5" />
                      <path d="M6.61 6.61C3.27 9.08 2 12 2 12s3 7 10 7a10.84 10.84 0 0 0 4.24-.84" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </aside>

        <section className="flex flex-col min-h-[420px]">
          {activeConversation ? (
            <>
              <div className="px-4 py-3 border-b border-white/8">
                <h2 className="text-sm font-semibold text-white">
                  {participant?.displayName ?? 'Conversation'}
                </h2>
                <p className="text-xs text-slate-400">@{participant?.username ?? 'user'}</p>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
                {activeMessages.map((message) => {
                  const own = message.senderId === user.id;
                  return (
                    <div key={message.id} className={`group flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 relative ${own ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-white border border-white/10'}`}>
                        {own && (
                          <div className="absolute -top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => {
                                if (!activeConversationId) return;
                                void handleEditMessage(activeConversationId, message.id, message.content);
                              }}
                              className="rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-950"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (!activeConversationId) return;
                                void handleDeleteMessage(activeConversationId, message.id);
                              }}
                              className="rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-slate-950"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`mt-1 text-[10px] ${own ? 'text-slate-800/80' : 'text-slate-500'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-3 py-3 border-t border-white/8 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSend();
                    }
                  }}
                  placeholder={
                    canMessageParticipant
                      ? 'Start a new message'
                      : 'Enable messages from everyone or follow this user'
                  }
                  disabled={!canMessageParticipant}
                  className="flex-1 rounded-full bg-slate-800 border border-white/10 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={handleSend}
                  disabled={draft.trim().length === 0 || !canMessageParticipant}
                  className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="px-6 py-12 text-center text-slate-400">
              Select a conversation to start messaging.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
