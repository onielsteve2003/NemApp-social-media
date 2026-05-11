'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useMessageStore } from '@/stores/messageStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSocialStore } from '@/stores/socialStore';

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
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
    setActiveConversation,
    sendMessage,
    getParticipant,
  } = useMessageStore();

  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (user) {
      seedMessages(user.id);
    }
  }, [user, seedMessages]);

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
    sendMessage(activeConversationId, draft.trim());
    setDraft('');
  };

  if (!user) return null;

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/8 px-4 py-3">
        <h1 className="text-[20px] font-extrabold text-white">Messages</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[calc(100vh-66px)]">
        <aside className="border-b md:border-b-0 md:border-r border-white/8 no-scrollbar overflow-y-auto max-h-[260px] md:max-h-none">
          {visibleConversations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">No conversations yet.</p>
          ) : (
            visibleConversations.map((conversation) => {
              const person = getParticipant(conversation.participantId);
              const active = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  className={`
                    w-full text-left px-3 py-3 border-b border-white/8 transition-colors
                    ${active ? 'bg-sky-400/10' : 'hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center gap-2">
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
                  </div>
                </button>
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
                    <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-3 py-2
                          ${own
                            ? 'bg-sky-400 text-slate-950'
                            : 'bg-slate-800 text-white border border-white/10'
                          }
                        `}
                      >
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
