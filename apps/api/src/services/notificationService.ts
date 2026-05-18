import { NotificationModel } from '../models/NotificationModel.js';
import { UserModel } from '../models/UserModel.js';
import { HttpError } from '../utils/httpError.js';
import { findUsersByIds, toNotificationWithActor, type SerializedUserDoc } from '../utils/serializers.js';

export const notificationService = {
  async create(userId: string, actorId: string, type: string, targetId?: string) {
    if (userId === actorId) {
      return null;
    }

    const item = await NotificationModel.create({
      userId,
      actorId,
      type,
      targetId,
      isRead: false,
    });

    return item;
  },

  async listForUser(userId: string) {
    const viewer = (await UserModel.findById(userId).lean()) as SerializedUserDoc | null;
    if (!viewer) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const actorsById = await findUsersByIds(notifications.map((item) => item.actorId));

    return notifications
      .map((item) => {
        const actor = actorsById.get(item.actorId);
        if (!actor) return null;
        return toNotificationWithActor(item, actor, viewer);
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  },

  async markRead(userId: string, notificationId: string) {
    await NotificationModel.updateOne({ _id: notificationId, userId }, { $set: { isRead: true } });
  },

  async markAllRead(userId: string) {
    await NotificationModel.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  },

  async clearAll(userId: string) {
    await NotificationModel.deleteMany({ userId });
  },
};