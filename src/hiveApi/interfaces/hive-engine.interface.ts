export interface RewardPool {
  _id: number;
  symbol: string;
  rewardPool: string;
  pendingClaims: string;
  lastRewardTimestamp: number;
  lastPostRewardTimestamp: number;
  lastClaimDecayTimestamp: number;
  createdTimestamp: number;
  active: boolean;
  config: RewardPoolConfig;
}

interface RewardPoolConfig {
  postRewardCurve: string;
  postRewardCurveParameter: string;
  curationRewardCurve: string;
  curationRewardCurveParameter: string;
  curationRewardPercentage: number;
  cashoutWindowDays: number;
  rewardPerInterval: string;
  rewardIntervalSeconds: number;
  voteRegenerationDays: number;
  downvoteRegenerationDays: number;
  stakedRewardPercentage: number;
  votePowerConsumption: number;
  downvotePowerConsumption: number;
  tags: [string];
}
