import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Message, User } from '@shared-types';
import { MOCK_USERS } from '@/mocks/auth';
import { useAuthStore } from '@/stores/authStore';

interface ConversationPreview {
  id: string;
  participantId: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

interface MessageState {
  conversations: ConversationPreview[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string | null;
  initializedForUserIds: string[];

  seedMessages: (userId: string) => void;
  setActiveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  markConversationRead: (conversationId: string) => void;
  getParticipant: (participantId: string) => User | null;
}

let messageIdCounter = 1;

function makeSeedConversation(userId: string, participantId: string, index: number) {
  const conversationId = `conv-${userId}-${participantId}`;
  const now = Date.now();

  const messages: Message[] = [
    {
      id: `msg-${messageIdCounter++}`,
      conversationId,
      senderId: participantId,
      content: index === 0 ? 'Hey! Loving the NemApp build progress.' : 'Are you shipping Stage 5 today?',
      isRead: index !== 0,
      createdAt: new Date(now - (index + 1) * 1000 * 60 * 42),
    },
    {
      id: `msg-${messageIdCounter++}`,
      conversationId,
      senderId: userId,
      content: index === 0 ? 'Thank you! Working on social features now.' : 'Yes, notifications and messages are in progress.',
      isRead: true,
      readAt: new Date(now - (index + 1) * 1000 * 60 * 30),
      createdAt: new Date(now - (index + 1) * 1000 * 60 * 32),
    },
  ];

  return {
    conversationId,
    messages,
    preview: {
      id: conversationId,
      participantId,
      lastMessage: messages[messages.length - 1]?.content ?? '',
      lastMessageAt: messages[messages.length - 1]?.createdAt ?? new Date(),
      unreadCount: index === 0 ? 1 : 0,
    },
  };
}

export const useMessageStore = create<MessageState>()(
  devtools(
    persist(
      (set, get) => ({
        conversations: [],
        messagesByConversation: {},
        activeConversationId: null,
        initializedForUserIds: [],

        seedMessages: (userId) => {
          if (get().initializedForUserIds.includes(userId)) return;

          const participants = MOCK_USERS.filter((u) => u.id !== userId).slice(0, 2);
          if (participants.length === 0) return;

          const seeded = participants.map((person, idx) =>
            makeSeedConversation(userId, person.id, idx)
          );

          const nextMessagesByConversation: Record<string, Message[]> = {};
          for (const item of seeded) {
            nextMessagesByConversation[item.conversationId] = item.messages;
          }

          set((state) => ({
            conversations: [...seeded.map((item) => item.preview), ...state.conversations],
            messagesByConversation: {
              ...nextMessagesByConversation,
              ...state.messagesByConversation,
            },
            activeConversationId: seeded[0]?.conversationId ?? state.activeConversationId,
            initializedForUserIds: [...state.initializedForUserIds, userId],
          }));
        },

        setActiveConversation: (conversationId) => {
          set({ activeConversationId: conversationId });
          get().markConversationRead(conversationId);
        },

        sendMessage: (conversationId, content) => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          const newMessage: Message = {
            id: `msg-${messageIdCounter++}`,
            conversationId,
            senderId: user.id,
            content,
            isRead: true,
            createdAt: new Date(),
          };

          set((state) => {
            const existing = state.messagesByConversation[conversationId] ?? [];
            return {
              messagesByConversation: {
                ...state.messagesByConversation,
                [conversationId]: [...existing, newMessage],
              },
              conversations: state.conversations
                .map((conv) =>
                  conv.id === conversationId
                    ? {
                        ...conv,
                        lastMessage: content,
                        lastMessageAt: newMessage.createdAt,
                      }
                    : conv
                )
                .sort(
                  (a, b) =>
                    new Date(b.lastMessageAt).getTime() -
                    new Date(a.lastMessageAt).getTime()
                ),
            };
          });
        },

        markConversationRead: (conversationId) => {
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ),
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((msg) => ({
                ...msg,
                isRead: true,
                readAt: msg.readAt ?? new Date(),
              })),
            },
          }));
        },

        getParticipant: (participantId) => {
          const authUser = useAuthStore.getState().user;
          if (authUser?.id === participantId) return authUser;
          return MOCK_USERS.find((u) => u.id === participantId) ?? null;
        },
      }),
      {
        name: 'message-storage',
      }
    ),
    { name: 'message-store' }
  )
);
