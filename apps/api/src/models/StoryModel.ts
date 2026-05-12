import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'gif'], required: true },
    alt: { type: String },
  },
  { _id: false }
);

const storySchema = new Schema(
  {
    authorId: { type: String, required: true, index: true },
    caption: { type: String },
    background: { type: String, required: true },
    media: { type: mediaSchema, default: undefined },
    viewersCount: { type: Number, default: 0 },
    seenBy: { type: [String], default: [] },
    likedBy: { type: [String], default: [] },
    resharedFromStoryId: { type: String },
    resharedFromUserId: { type: String },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export type StoryDb = InferSchemaType<typeof storySchema>;

export const StoryModel =
  mongoose.models.Story || mongoose.model('Story', storySchema);