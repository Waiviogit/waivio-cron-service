const moment = require('moment');
const _ = require('lodash');
const { redisGetter, redisSetter } = require('../../redis');
const { postModel } = require('../../database/models');
const { hiveOperations } = require('../../utilities/hiveApi');
const { REDIS_KEY } = require('../../constants/redis');

const run = async () => {
  const hourAgo = moment.utc().subtract(1, 'hour').startOf('hour').format();
  const { result: records } = await redisGetter.smembers({
    key: `${REDIS_KEY.CHILDREN_UPDATE}:${hourAgo}`,
  });
  if (_.isEmpty(records)) return;

  for (const record of records) {
    const [author, permlink] = record.split('/');
    const comment = await hiveOperations.getPostInfo({ author, permlink });
    if (!comment || !comment.root_author) continue;
    const post = await hiveOperations.getPostInfo({
      author: comment.root_author, permlink: comment.root_permlink,
    });
    if (!post || !post.author) continue;

    const { result: res } = await postModel.updateOne({
      filter: {
        root_author: post.root_author,
        permlink: post.permlink,
      },
      update: {
        $set: { children: post.children },
      },
    });
    if (res.modifiedCount) this.logger.log(`Children on @${post.root_author}/${post.permlink} updated!`);
  }
  await redisSetter.del(`${REDIS_KEY.CHILDREN_UPDATE}:${hourAgo}`);
};

module.exports = {
  run,
};
