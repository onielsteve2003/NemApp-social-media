import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'gif'], required: true },
    alt: { type: String },
  },
  { _id: false }
);

const pollOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
  },
  { _id: false }
);

const pollSchema = new Schema(
  {
    id: { type: String, required: true },
    options: { type: [pollOptionSchema], default: [] },
    totalVotes: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const tweetSchema = new Schema(
  {
    authorId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    media: { type: [mediaSchema], default: undefined },
    poll: { type: pollSchema, default: undefined },
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    retweetsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    isReply: { type: Boolean, default: false },
    replyTo: { type: String },
    isRetweet: { type: Boolean, default: false },
    retweetOf: { type: String },
    inReplyToUserId: { type: String },
    mentions: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    isLocked: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    likedByIds: { type: [String], default: [] },
    retweetedByIds: { type: [String], default: [] },
    bookmarkedByIds: { type: [String], default: [] },
    pollVoterIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export type TweetDb = InferSchemaType<typeof tweetSchema>;

export const TweetModel =
  mongoose.models.Tweet || mongoose.model('Tweet', tweetSchema);