import { Document } from 'mongoose';

export interface Post extends Document {
  id: number;
  author: string;
  permlink: string;
  parent_author: string;
  parent_permlink: string;
  root_author: string;
  root_permlink: string;
  title: string;
  body: string;
  json_metadata: string;
  app: string;
  depth: string;
  total_vote_weight: number;
  language: string;
  author_weight: number;
  reblog_to: ReblogTo;
  category: string;
  created: string;
  last_update: string;
  last_payout: string;
  cashout_time: string;
  total_payout_value: string;
  curator_payout_value: string;
  pending_payout_value: string;
  max_accepted_payout: string;
  active: string;
  url: string;
  max_cashout_time: string;
  root_title: string;
  promoted: string;
  total_pending_payout_value: string;
  children: number;
  body_length: number;
  author_reputation: number;
  percent_hbd: number;
  author_rewards: number;
  reward_weight: number;
  reblogged_by: [];
  net_votes: number;
  children_abs_rshares: number;
  vote_rshares: number;
  net_rshares: number;
  abs_rshares: number;
  allow_votes: boolean;
  allow_curation_rewards: boolean;
  allow_replies: boolean;
  beneficiaries: [Beneficiaries];
  blocked_for_apps: [string];
  reblogged_users: [string];
  active_votes: [ActiveVotes];
  wobjects: [PostWobjects];
}

interface ReblogTo extends Document {
  author: string;
  permlink: string;
}
interface Beneficiaries extends Document {
  account: string;
  weight: number;
}
interface ActiveVotes extends Document {
  voter: string;
  weight: number;
  percent: number;
  reputation: number;
  rshares: number;
}

interface PostWobjects extends Document {
  author_permlink: string;
  percent: number;
  tagged: string;
  object_type: string;
}
