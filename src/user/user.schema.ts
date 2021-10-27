import * as mongoose from 'mongoose';
import {
  SUPPORTED_CURRENCIES,
  REFERRAL_STATUSES,
  REFERRAL_TYPES,
  LANGUAGES,
} from './constants';

const UserNotificationsSchema = new mongoose.Schema({
  activationCampaign: { type: Boolean, default: true },
  deactivationCampaign: { type: Boolean, default: true },
  follow: { type: Boolean, default: true },
  fillOrder: { type: Boolean, default: true },
  mention: { type: Boolean, default: true },
  minimalTransfer: { type: Number, default: 0 },
  reblog: { type: Boolean, default: true },
  reply: { type: Boolean, default: true },
  statusChange: { type: Boolean, default: true },
  transfer: { type: Boolean, default: true },
  powerUp: { type: Boolean, default: true },
  witness_vote: { type: Boolean, default: true },
  myPost: { type: Boolean, default: false },
  myComment: { type: Boolean, default: false },
  myLike: { type: Boolean, default: false },
  like: { type: Boolean, default: true },
  downvote: { type: Boolean, default: false },
  claimReward: { type: Boolean, default: false },
}, { _id: false });

const UserMetadataSchema = new mongoose.Schema({
  notifications_last_timestamp: { type: Number, default: 0 },
  settings: {
    exitPageSetting: { type: Boolean, default: false },
    locale: { type: String, enum: [...LANGUAGES], default: 'auto' },
    postLocales: { type: [{ type: String, enum: [...LANGUAGES] }], default: [] },
    nightmode: { type: Boolean, default: false },
    rewardSetting: { type: String, enum: ['SP', '50', 'STEEM'], default: '50' },
    rewriteLinks: { type: Boolean, default: false },
    showNSFWPosts: { type: Boolean, default: false },
    upvoteSetting: { type: Boolean, default: false },
    votePercent: {
      type: Number, min: 1, max: 10000, default: 5000,
    },
    votingPower: { type: Boolean, default: false },
    userNotifications: { type: UserNotificationsSchema, default: () => ({}) },
    currency: {
      type: String,
      enum: Object.values(SUPPORTED_CURRENCIES),
      default: SUPPORTED_CURRENCIES.USD,
    },
  },
  bookmarks: { type: [String], default: [] },
  drafts: {
    type: [{
      title: { type: String },
      author: { type: String },
      beneficiary: { type: Boolean, default: true },
      body: { type: String },
      jsonMetadata: { type: Object },
      lastUpdated: { type: Number },
      parentAuthor: { type: String },
      parentPermlink: { type: String },
      permlink: { type: String },
      reward: { type: String },
    }],
    default: [],
  },
});

const ReferralsSchema = new mongoose.Schema({
  agent: { type: String, index: true },
  startedAt: { type: Date },
  endedAt: { type: Date },
  type: { type: String, enum: Object.values(REFERRAL_TYPES) },
}, { _id: false });

export const UserSchema = new mongoose.Schema({
  name: {
    type: String, index: true, unique: true, required: true,
  },
  alias: { type: String, default: '' },
  profile_image: { type: String },
  objects_follow: { type: [String], default: [] },
  users_follow: { type: [String], default: [] },
  json_metadata: { type: String, default: '' },
  posting_json_metadata: { type: String, default: '' },
  wobjects_weight: { type: Number, default: 0 },
  count_posts: { type: Number, default: 0, index: true },
  last_posts_count: { type: Number, default: 0 },
  last_posts_counts_by_hours: { type: [Number], default: [] },
  user_metadata: { type: UserMetadataSchema, default: () => ({}), select: false },
  last_root_post: { type: String, default: null },
  users_following_count: { type: Number, default: 0 },
  followers_count: { type: Number, default: 0 },
  stage_version: { type: Number, default: 0, required: true },
  privateEmail: { type: String, default: null, select: false },
  referralStatus: {
    type: String,
    enum: Object.values(REFERRAL_STATUSES),
    default: REFERRAL_STATUSES.NOT_ACTIVATED,
  },
  referral: { type: [ReferralsSchema], default: [] },
}, { timestamps: true });
