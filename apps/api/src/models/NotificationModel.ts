import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    actorId: { type: String, required: true },
    type: {
      type: String,
      enum: ['like', 'follow', 'reply', 'mention', 'retweet', 'message'],
      required: true,
    },
    targetId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export type NotificationDb = InferSchemaType<typeof notificationSchema>;

export const NotificationModel =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);