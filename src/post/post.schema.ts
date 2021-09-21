import * as mongoose from 'mongoose';

export const PostSchema = new mongoose.Schema(
  {
    id: { type: Number },
    author: { type: String },
    permlink: { type: String },
    guestInfo: { type: String },
    parent_author: { type: String, default: '' },
    parent_permlink: { type: String, required: true },
    root_author: { type: String },
    root_permlink: { type: String },
    title: { type: String, required: true, default: '' },
    body: { type: String, required: true, default: '' },
    json_metadata: { type: String, required: true, default: '' },
    app: { type: String },
    depth: { type: Number, default: 0 },
    total_vote_weight: { type: Number, default: 0 },
    active_votes: [{
      voter: { type: String },
      weight: { type: Number },
      percent: { type: Number },
    }],
    wobjects: [{
      author_permlink: { type: String },
      percent: { type: Number },
      tagged: { type: String },
      object_type: { type: String, index: true },
    }],
    language: { type: String, default: 'en-US' },
    author_weight: { type: Number },
    reblog_to: { type: { author: String, permlink: String } },
    reblogged_users: { type: [String], default: [] },
    blocked_for_apps: { type: [String], default: [] },
    reblogged_by: { type: [String], default: [] },
    category: {type: String},
    created: {type: String},
    last_update: {type: String},
    last_payout: {type: String},
    cashout_time: {type: String},
    total_payout_value: {type: String},
    curator_payout_value: {type: String},
    pending_payout_value: {type: String},
    max_accepted_payout: {type: String},
    active: {type: String},
    url: {type: String},
    max_cashout_time: {type: String},
    root_title: {type: String},
    promoted: {type: String},
    total_pending_payout_value: {type: String},
    children: {type: Number},
    body_length: {type: Number},
    author_reputation: {type: Number},
    percent_hbd: {type: Number},
    author_rewards: {type: Number},
    reward_weight: {type: Number},
    net_votes: {type: Number},
    children_abs_rshares: {type: Number},
    vote_rshares: {type: Number},
    net_rshares: {type: Number},
    abs_rshares: {type: Number},
    allow_votes: {type: Boolean},
    allow_curation_rewards: {type: Boolean},
    allow_replies: {type: Boolean},
    beneficiaries: [{
      account : {type: String},
      weight : {type: Number}
    }]
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

PostSchema.index({ author: 1, permlink: 1 }, { unique: true });
PostSchema.index({ root_author: 1, permlink: 1 }, { unique: true });
PostSchema.index({ author: 1, language: 1 });
PostSchema.index({ 'wobjects.author_permlink': 1, _id: 1 });
PostSchema.index({ _id: 1, author_weight: 1, net_rshares: -1 });
PostSchema.index({ net_rshares: -1 });