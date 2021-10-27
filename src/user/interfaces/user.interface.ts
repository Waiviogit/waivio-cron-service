export interface User {
  name: string;
  alias: string;
  profile_image: string;
  objects_follow: [string];
  users_follow: [string];
  json_metadata: string;
  posting_json_metadata: string;
  wobjects_weight: number;
  count_posts: number;
  last_posts_count: number;
  last_posts_counts_by_hours: [number];
  user_metadata: UserMetadata;
  last_root_post: string;
  users_following_count: number;
  followers_count: string;
  stage_version: number;
  privateEmail: string;
  referralStatus: referralStatus;
  referral: [Referral];
}

interface UserMetadata {
  notifications_last_timestamp: number;
  settings: UserSettings;
  bookmarks: [string];
  drafts: [Draft];
}

interface UserSettings {
  exitPageSetting: boolean;
  locale: languages;
  postLocales: [languages];
  nightmode: boolean;
  rewardSetting: rewardSetting;
  rewriteLinks: boolean;
  showNSFWPosts: boolean;
  upvoteSetting: boolean;
  votePercent: number;
  votingPower: boolean;
  userNotifications: UserNotifications;
  currency: currencies;
}

interface Referral {
  agent: string;
  startedAt: Date;
  endedAt: Date;
  type: referralTypes;
}

interface UserNotifications {
  activationCampaign: boolean;
  deactivationCampaign: boolean;
  follow: boolean;
  fillOrder: boolean;
  mention: boolean;
  minimalTransfer: number;
  reblog: boolean;
  reply: boolean;
  statusChange: boolean;
  transfer: boolean;
  powerUp: boolean;
  myPost: boolean;
  myComment: boolean;
  myLike: boolean;
  like: boolean;
  downvote: boolean;
  claimReward: boolean;
}

interface Draft {
  title: string;
  author: string;
  permlink: string;
  parentAuthor: string;
  parentPermlink: string;
  beneficiary: boolean;
  body: string;
  jsonMetadata: any;
  lastUpdated: number;
  reward: string;
}

enum referralStatus {
  NOT_ACTIVATED = 'notActivated',
  ACTIVATED = 'activated',
  REJECTED = 'rejected',
}
enum referralTypes {
  REWARDS = 'rewards',
  REVIEWS = 'reviews',
  INVITE_FRIEND = 'invite_friend',
}

enum currencies {
  'USD'= 'USD',
  'CAD'= 'CAD',
  'EUR'= 'EUR',
  'AUD'= 'AUD',
  'MXN'= 'MXN',
  'GBP'= 'GBP',
  'JPY'= 'JPY',
  'CNY'= 'CNY',
  'RUB'= 'RUB',
  'UAH'= 'UAH',
}
enum languages {
  'en-US' = 'en-US',
  'id-ID' = 'id-ID',
  'ms-MY' = 'ms-MY',
  'ca-ES' = 'ca-ES',
  'cs-CZ' = 'cs-CZ',
  'da-DK' = 'da-DK',
  'de-DE' = 'de-DE',
  'et-EE' = 'et-EE',
  'es-ES' = 'es-ES',
  'fil-PH' = 'fil-PH',
  'fr-FR' = 'fr-FR',
  'hr-HR' = 'hr-HR',
  'it-IT' = 'it-IT',
  'hu-HU' = 'hu-HU',
  'nl-HU' = 'nl-HU',
  'no-NO' = 'no-NO',
  'pl-PL' = 'pl-PL',
  'pt-BR' = 'pt-BR',
  'ro-RO' = 'ro-RO',
  'sl-SI' = 'sl-SI',
  'sv-SE' = 'sv-SE',
  'vi-VN' = 'vi-VN',
  'tr-TR' = 'tr-TR',
  'yo-NG' = 'yo-NG',
  'el-GR' = 'el-GR',
  'bg-BG' = 'bg-BG',
  'ru-RU' = 'ru-RU',
  'uk-UA' = 'uk-UA',
  'he-IL' = 'he-IL',
  'ar-SA' = 'ar-SA',
  'ne-NP' = 'ne-NP',
  'hi-IN' = 'hi-IN',
  'as-IN' = 'as-IN',
  'bn-IN' = 'bn-IN',
  'ta-IN' = 'ta-IN',
  'lo-LA' = 'lo-LA',
  'th-TH' = 'th-TH',
  'ko-KR' = 'ko-KR',
  'ja-JP' = 'ja-JP',
  'zh-CN' = 'zh-CN',
  'af-ZA' = 'af-ZA',
  'auto' = 'auto',
}

enum rewardSetting {
  'SP' = 'SP',
  'Fifty' = '50',
  'STEEM' = 'STEEM'
}
