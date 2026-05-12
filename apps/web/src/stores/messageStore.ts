import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Message, UserProfile } from '@shared-types';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

interface ConversationPreview {
  id: string;
  participantId: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  participant: UserProfile | null;
}

interface MessageResponse {
  success: boolean;
  data: {
    conversations?: ConversationPreview[];
    messagesByConversation?: Record<string, Message[]>;
    conversationId?: string;
    message?: Message;
    ok?: boolean;
  };
}

interface MessageState {
  conversations: ConversationPreview[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string | null;
  initializedForUserIds: string[];
  participantsById: Record<string, UserProfile>;
  seedMessages: (userId: string) => Promise<void>;
  openConversationWithUser: (participantId: string) => Promise<string | null>;
  setActiveConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  editMessage: (conversationId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string, scope?: 'me' | 'all') => Promise<void>;
  hideConversationForMe: (conversationId: string) => Promise<void>;
  getParticipant: (participantId: string) => UserProfile | null;
}

function buildParticipantsMap(conversations: ConversationPreview[]) {
  return conversations.reduce<Record<string, UserProfile>>((acc, conversation) => {
    if (conversation.participant) {
      acc[conversation.participantId] = conversation.participant;
    }
    return acc;
  }, {});
}

export const useMessageStore = create<MessageState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      messagesByConversation: {},
      activeConversationId: null,
      initializedForUserIds: [],
      participantsById: {},

      seedMessages: async (userId) => {
        const response = await apiClient.get<MessageResponse>('/api/messages/conversations');
        const conversations = response.data.conversations ?? [];
        set((state) => ({
          conversations,
          messagesByConversation: response.data.messagesByConversation ?? {},
          activeConversationId: conversations[0]?.id ?? state.activeConversationId,
          initializedForUserIds: state.initializedForUserIds.includes(userId)
            ? state.initializedForUserIds
            : [...state.initializedForUserIds, userId],
          participantsById: buildParticipantsMap(conversations),
        }));
      },

      openConversationWithUser: async (participantId) => {
        const user = useAuthStore.getState().user;
        if (!user || participantId === user.id) return null;

        const existing = get().conversations.find(
          (conversation) => conversation.participantId === participantId
        );
        if (existing) {
          await get().setActiveConversation(existing.id);
          return existing.id;
        }

        const response = await apiClient.post<MessageResponse>('/api/messages/conversations/open', {
          participantId,
        });
        const conversationId = response.data.conversationId ?? null;
        if (!conversationId) return null;

        await get().seedMessages(user.id);
        set({ activeConversationId: conversationId });
        return conversationId;
      },

      setActiveConversation: async (conversationId) => {
        set({ activeConversationId: conversationId });
        await get().markConversationRead(conversationId);
      },

      sendMessage: async (conversationId, content) => {
        const response = await apiClient.post<MessageResponse>(`/api/messages/conversations/${conversationId}/messages`, {
          content,
        });
        const message = response.data.message;
        if (!message) return;

        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), message],
          },
          conversations: state.conversations
            .map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, lastMessage: content, lastMessageAt: message.createdAt }
                : conversation
            )
            .sort(
              (a, b) =>
                new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            ),
        }));
      },

      markConversationRead: async (conversationId) => {
        await apiClient.post(`/api/messages/conversations/${conversationId}/read`);
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
          ),
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((message) => ({
              ...message,
              isRead: true,
              readAt: message.readAt ?? new Date(),
            })),
          },
        }));
      },

      editMessage: async (conversationId, messageId, content) => {
        const response = await apiClient.patch<MessageResponse>(
          `/api/messages/conversations/${conversationId}/messages/${messageId}`,
          { content }
        );
        const message = response.data.message;
        if (!message) return;

        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((item) =>
              item.id === messageId ? { ...item, ...message } : item
            ),
          },
        }));
      },

      deleteMessage: async (conversationId, messageId, scope = 'me') => {
        await apiClient.delete(`/api/messages/conversations/${conversationId}/messages/${messageId}?scope=${scope}`);
        if (scope === 'me') {
          const authUser = useAuthStore.getState().user;
          set((state) => ({
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: (state.messagesByConversation[conversationId] ?? []).filter((item) => item.id !== messageId || item.senderId !== authUser?.id),
            },
          }));
        } else {
          set((state) => ({
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: (state.messagesByConversation[conversationId] ?? []).filter((item) => item.id !== messageId),
            },
          }));
        }
      },

      hideConversationForMe: async (conversationId) => {
        await apiClient.post(`/api/messages/conversations/${conversationId}/hide`);
        set((state) => ({
          conversations: state.conversations.filter((conversation) => conversation.id !== conversationId),
          activeConversationId:
            state.activeConversationId === conversationId ? null : state.activeConversationId,
        }));
      },

      getParticipant: (participantId) => {
        const authUser = useAuthStore.getState().user;
        if (authUser?.id === participantId) return authUser;
        return get().participantsById[participantId] ?? null;
      },
    }),
    { name: 'message-store' }
  )
);
