import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'gif'], required: true },
    alt: { type: String },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    id: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    media: { type: [mediaSchema], default: undefined },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    deletedForIds: { type: [String], default: [] },
    deletedForEveryoneAt: { type: Date },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    participantIds: { type: [String], required: true, index: true },
    participantKey: { type: String, required: true, unique: true },
    messages: { type: [messageSchema], default: [] },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    hiddenByIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export type ConversationDb = InferSchemaType<typeof conversationSchema>;

export const ConversationModel =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);