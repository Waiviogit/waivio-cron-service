const _ = require('lodash');
const { wobjectModel, userWobjectsModel } = require('../../database/models');
const { redis10 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');

const collectWobjTopUsers = async ({ limit }) => {
  const { result: hashtags } = await wobjectModel.find(
    {
      filter: {
        weight: { $gt: 0 }, object_type: 'hashtag',
      },
      options: {
        projection: { author_permlink: 1, _id: 1 },
        sort: { weight: -1 },
        skip: 0,
        limit,
      },
    },
  );

  const { result: objects } = await wobjectModel.find(
    {
      filter: {
        weight: { $gt: 0 }, object_type: { $ne: 'hashtag' },
      },
      options: {
        projection: { author_permlink: 1, _id: 1 },
        sort: { weight: -1 },
        skip: 0,
        limit,
      },
    },
  );

  for (const wobj of _.concat(hashtags, objects)) {
    await redis10.del({ key: `${REDIS_KEY.TOP_WOBJ_USERS_KEY}:${wobj.author_permlink}` });
    const { result: userWobjects } = await userWobjectsModel.find({
      filter: { author_permlink: wobj.author_permlink },
      options: {
        sort: { weight: -1 },
        limit: 5,
      },
    });
    const ids = _.map(userWobjects, (user) => `${user.user_name}:${user.weight}`);
    if (ids && ids.length) {
      await redis10.sadd({
        key: `${REDIS_KEY.TOP_WOBJ_USERS_KEY}:${wobj.author_permlink}`,
        member: ids,
      });
    }
  }
};

const run = async () => {
  await collectWobjTopUsers({ limit: 400 });
};

module.exports = {
  run,
};
