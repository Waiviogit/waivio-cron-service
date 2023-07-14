const moment = require('moment');
const _ = require('lodash');
const { redis2 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');
const { userModel, subscriptionModel } = require('../../database/models');
const {
  getFollowCount, getAccountInfo, getFollowingsList, getFollowersList,
} = require('../../utilities/hiveApi/hiveOperations');
const { parseJson } = require('../../helpers/jsonHelper');

const getGuestSubscriptionsCount = async (userName, flag) => {
  const filter = flag ? {
    follower: { $in: [/waivio_/, /bxy_/] },
    following: userName,
  } : {
    following: { $in: [/waivio_/, /bxy_/] },
    follower: userName,
  };
  const { result: count, error } = await subscriptionModel.count({
    filter,
  });
  if (error) return { error };
  return { count };
};

const getFollowings = async ({ follower, skip = 0, limit = 30 }) => {
  const { result, error } = await subscriptionModel.find(
    {
      filter: { follower },
      options: {
        skip,
        limit,
        projection: { following: 1 },
      },
    },
  );
  if (error) return { error };

  return { users: result.map((el) => el.following) };
};

const getFollowers = async ({ following, skip = 0, limit = 30 }) => {
  const { result, error } = await subscriptionModel.find({
    filter: { following },
    options: {
      skip,
      limit,
      projection: { follower: 1 },
    },
  });
  if (error) return { error };
  return { users: result.map((el) => el.follower) };
};

const updateUserFollowings = async (name) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = '';
  let hiveArray = [];

  do {
    const { followings = [], error } = await getFollowingsList(
      { name, startAccount, limit: batchSize },
    );

    if (error || followings.error) {
      console.error('getFollowingsList Error');
      return { error: error || followings.error };
    }
    hiveArray = _.concat(hiveArray, _.map(followings, (el) => el.following));
    currBatchSize = followings.length;
    startAccount = _.get(followings, `[${currBatchSize - 1}].following`, '');
  } while (currBatchSize === batchSize);

  let { users } = await getFollowings({ follower: name, limit: 0 });
  users = _.filter(users, (u) => !u.includes('_'));
  const deleteData = _.difference(users, hiveArray);
  const updateData = _.difference(hiveArray, users);

  for (const following of updateData) await subscriptionModel.insertOne({ doc: { follower: name, following } });
  await subscriptionModel.deleteMany({
    filter: { follower: name, following: { $in: deleteData } },
  });

  return { ok: true };
};

const updateUserFollowers = async (name) => {
  const batchSize = 1000;
  let currBatchSize = 0;
  let startAccount = '';
  let hiveArray = [];

  do {
    const { followers = [], error } = await getFollowersList(
      { name, startAccount, limit: batchSize },
    );

    if (error || followers.error) {
      console.error('getFollowersList error');
      return { error: error || followers.error };
    }
    hiveArray = _.concat(hiveArray, _.map(followers, (el) => el.follower));
    currBatchSize = followers.length;
    startAccount = _.get(followers, `[${currBatchSize - 1}].follower`, '');
  } while (currBatchSize === batchSize);

  let { users } = await getFollowers({ following: name, limit: 0 });
  users = _.filter(users, (u) => !u.includes('_'));
  const deleteData = _.difference(users, hiveArray);
  const updateData = _.difference(hiveArray, users);

  for (const follower of updateData) await subscriptionModel.insertOne({ doc: { follower, following: name } });

  await subscriptionModel.deleteMany({
    filter: { follower: { $in: deleteData }, following: name },
  });

  return { ok: true };
};
const getUserSteemInfo = async (name) => {
  const userData = await getAccountInfo(name);
  if (userData?.error) return { error: `User ${name} not exist, can't import.` };

  const { result: followCountRes, error: followCountErr } = await getFollowCount(name);

  if (followCountErr) return { error: followCountErr };

  const {
    count: guestFollCount,
    error: guestFollErr,
  } = await getGuestSubscriptionsCount(name, true);
  const { count: guestFollowingsCount } = await getGuestSubscriptionsCount(name, false);
  if (guestFollErr) return { error: guestFollErr };

  const metadata = parseJson(userData.json_metadata);
  const postingMetadata = parseJson(userData.posting_json_metadata);
  const data = {
    name,
    alias: _.get(postingMetadata, 'profile.name', _.get(metadata, 'profile.name', '')),
    profile_image: _.get(postingMetadata, 'profile.profile_image', _.get(metadata, 'profile.profile_image', '')),
    json_metadata: userData.json_metadata,
    posting_json_metadata: userData.posting_json_metadata,
    last_root_post: userData.last_root_post,
    user_following_count: _.get(followCountRes, 'following_count', 0) + guestFollowingsCount,
    followers_count: _.get(followCountRes, 'follower_count', 0) + guestFollCount,
    objects_follow: [],
    wobjects_weight: 0,
    count_posts: 0,
    last_posts_count: 0,
    last_posts_counts_by_hours: [],
    user_metadata: {},
    auth: null,
    referralStatus: 'notActivated',
    referral: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { data };
};

const importUser = async (userName) => {
  const { result: existUser, error: dbError } = await userModel.findOne({
    filter: { name: userName },
  });

  if (_.get(existUser, 'stage_version') === 1) return { user: existUser };

  const {
    data: userData, error: steemError,
  } = await getUserSteemInfo(userName);

  if (steemError) return { error: steemError };

  await updateUserFollowings(userName);
  await updateUserFollowers(userName);
  return userModel.updateOne({
    filter: { name: userName },
    update: {
      $set: { ...userData, stage_version: 1 },
    },
    options: { upsert: true, new: true },
  });
};

const runImport = async (userName, userKey) => {
  const { error } = await importUser(userName);

  if (!error) {
    await redis2.del({ key: `${userKey}${userName}` });
    return;
  }

  const { result: alreadyErrored } = await redis2.get({ key: `${REDIS_KEY.IMPORTED_USER_ERROR}${userName}` });
  if (alreadyErrored) {
    await redis2.del({ key: `${REDIS_KEY.IMPORTED_USER_ERROR}${userName}` });
    return;
  }
  await redis2.set({
    key: `${REDIS_KEY.IMPORTED_USER_ERROR}${userName}`,
    data: JSON.stringify(error),
  });
};

const importUsers = async ({ userKey }) => {
  const { result: users } = await redis2.keys({ key: `${userKey}*` });
  if (users && users.length) {
    for (const user of users) {
      const userName = user.split(':')[1];
      const { result: addingDate } = await redis2.get({ key: `${userKey}${userName}` });
      if (user.split(':')[0] === 'import_user_error' || moment.utc().subtract(15, 'minute') > moment.utc(addingDate)) {
        await runImport(userName, userKey);
      }
    }
  }
};

const run = async (key) => {
  await importUsers({ userKey: key });
};

module.exports = {
  run,
};
