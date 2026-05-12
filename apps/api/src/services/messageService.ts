import type { Message } from '@social-media/shared-types';
import { ConversationModel } from '../models/ConversationModel';
import { UserModel } from '../models/UserModel';
import { HttpError } from '../utils/httpError';
import { findUsersByIds, toUserProfile, type SerializedUserDoc } from '../utils/serializers';
import { notificationService } from './notificationService';

function participantKey(userA: string, userB: string) {
  return [userA, userB].sort().join(':');
}

export const messageService = {
  async listConversations(userId: string) {
    const [viewer, conversations] = (await Promise.all([
      UserModel.findById(userId).lean(),
      ConversationModel.find({ participantIds: userId, hiddenByIds: { $ne: userId } }).sort({ lastMessageAt: -1 }).lean(),
    ])) as [SerializedUserDoc | null, any[]];

    if (!viewer) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const participantIds = conversations
      .flatMap((conversation) => conversation.participantIds.filter((id: string) => id !== userId));
    const usersById = await findUsersByIds([...new Set(participantIds)]);

    return {
      conversations: conversations.map((conversation) => {
        const participantId = conversation.participantIds.find((id: string) => id !== userId) ?? userId;
        const unreadCount = (conversation.messages ?? []).filter(
          (message: any) =>
            message.senderId !== userId &&
            !message.isRead &&
            !(message.deletedForIds ?? []).includes(userId)
        ).length;

        return {
          id: String(conversation._id),
          participantId,
          lastMessage: conversation.lastMessage ?? '',
          lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt) : conversation.createdAt,
          unreadCount,
          participant: usersById.get(participantId)
            ? toUserProfile(usersById.get(participantId)!, viewer)
            : null,
        };
      }),
      messagesByConversation: conversations.reduce<Record<string, Message[]>>((acc, conversation) => {
        acc[String(conversation._id)] = (conversation.messages ?? [])
          .filter((message: any) => !(message.deletedForIds ?? []).includes(userId))
          .map((message: any) => ({
            id: message.id,
            conversationId: String(conversation._id),
            senderId: message.senderId,
            content: message.deletedAt && message.deletedForEveryoneAt ? 'This message was deleted' : message.content,
            media: message.deletedAt && message.deletedForEveryoneAt ? undefined : message.media,
            isRead: message.isRead,
            readAt: message.readAt ? new Date(message.readAt) : undefined,
            createdAt: new Date(message.createdAt),
          }));
        return acc;
      }, {}),
    };
  },

  async openConversation(userId: string, participantId: string) {
    const [user, participant] = (await Promise.all([UserModel.findById(userId).lean(), UserModel.findById(participantId).lean()])) as [SerializedUserDoc | null, SerializedUserDoc | null];
    if (!user || !participant) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    let conversation = await ConversationModel.findOne({ participantKey: participantKey(userId, participantId) });
    if (!conversation) {
      conversation = await ConversationModel.create({
        participantIds: [userId, participantId],
        participantKey: participantKey(userId, participantId),
        messages: [],
        hiddenByIds: [],
      });
    } else if ((conversation.hiddenByIds ?? []).includes(userId)) {
      conversation.hiddenByIds = conversation.hiddenByIds.filter((id: string) => id !== userId);
      await conversation.save();
    }

    return String(conversation._id);
  },

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    conversation.hiddenByIds = (conversation.hiddenByIds ?? []).filter((id: string) => id !== userId);

    const message = {
      id: `msg-${Date.now()}`,
      senderId: userId,
      content,
      isRead: true,
      createdAt: new Date(),
      deletedForIds: [],
    };

    conversation.messages = [...conversation.messages, message];
    conversation.lastMessage = content;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const participantId = conversation.participantIds.find((id: string) => id !== userId);
    if (participantId) {
      await notificationService.create(participantId, userId, 'message', conversationId);
    }

    return {
      id: message.id,
      conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  },

  async editMessage(userId: string, conversationId: string, messageId: string, content: string) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const message = conversation.messages.find((item: any) => item.id === messageId);
    if (!message) {
      throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    }
    if (message.senderId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only edit your own messages');
    }
    if (message.deletedAt && message.deletedForEveryoneAt) {
      throw new HttpError(400, 'MESSAGE_DELETED', 'Deleted messages cannot be edited');
    }

    message.content = content;
    message.editedAt = new Date();
    await conversation.save();

    return {
      id: message.id,
      conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    };
  },

  async deleteMessage(userId: string, conversationId: string, messageId: string, scope: 'me' | 'all') {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const message = conversation.messages.find((item: any) => item.id === messageId);
    if (!message) {
      throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    }

    if (scope === 'all') {
      if (message.senderId !== userId) {
        throw new HttpError(403, 'FORBIDDEN', 'You can only delete your own message for everyone');
      }
      message.content = 'This message was deleted';
      message.media = undefined;
      message.deletedAt = new Date();
      message.deletedForEveryoneAt = new Date();
    } else {
      message.deletedForIds = [...new Set([...(message.deletedForIds ?? []), userId])];
    }

    await conversation.save();
    return { ok: true };
  },

  async hideConversationForMe(userId: string, conversationId: string) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    conversation.hiddenByIds = [...new Set([...(conversation.hiddenByIds ?? []), userId])];
    await conversation.save();
    return { ok: true };
  },

  async markConversationRead(userId: string, conversationId: string) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    conversation.messages = conversation.messages.map((message: any) =>
      message.senderId === userId || message.isRead
        ? message
        : {
            ...message,
            isRead: true,
            readAt: message.readAt ?? new Date(),
          }
    );

    await conversation.save();
  },
};