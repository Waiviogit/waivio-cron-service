const _ = require('lodash');
const { PrivateKey } = require('@hiveio/dhive');

const { broadcastClient, databaseClient } = require('./hiveClient');

exports.likePost = async ({
  key, voter, author, permlink, weight,
}) => {
  try {
    const result = await broadcastClient.broadcast.vote(
      {
        voter, author, permlink, weight,
      },
      PrivateKey.fromString(key),
    );
    return { result: true };
  } catch (error) {
    return { error };
  }
};

/**
 * @param names {[string]}
 * @returns {Promise<any>}
 */
exports.getAccountsInfo = async (names) => {
  try {
    return databaseClient.database.call('get_accounts', [names]);
  } catch (error) {
    return { error };
  }
};

/**
 * @param name {string}
 * @returns {Promise<null|*>}
 */
exports.getAccountInfo = async (name) => {
  try {
    const accounts = await databaseClient.database.call('get_accounts', [[name]]);

    if (!_.isEmpty(accounts)) return accounts[0];
    return null;
  } catch (error) {
    return { error };
  }
};

/**
 * @param author {string}
 * @param permlink {string}
 * @returns {Promise<any>}
 */
exports.getPostInfo = async ({ author, permlink }) => {
  try {
    return databaseClient.database.call('get_content', [author, permlink]);
  } catch (error) {
    return { error };
  }
};

/**
 * @returns {Promise<{currentPrice: number, rewardFund: any}|{error: any}>}
 */
exports.getCurrentPriceInfo = async () => {
  try {
    const sbdMedian = await databaseClient.database.call('get_current_median_history_price', []);
    const rewardFund = await databaseClient.database.call('get_reward_fund', ['post']);
    const props = await databaseClient.database.getDynamicGlobalProperties();
    return {
      currentPrice: parseToFloat(sbdMedian.base) / parseToFloat(sbdMedian.quote),
      rewardFund,
      props,
    };
  } catch (error) {
    return { error };
  }
};

exports.getPostAuthorReward = async ({ reward_price: rewardPrice }) => {
  try {
    const sbdMedian = await databaseClient.database.call('get_current_median_history_price', []);

    return parseFloat(rewardPrice) * (parseFloat(sbdMedian.quote) / parseFloat(sbdMedian.base));
  } catch (error) {
    return { error };
  }
};

exports.getPostState = async ({ author, permlink, category }) => {
  try {
    return {
      result: await databaseClient.database.call(
        'get_state',
        [`${category}/@${author}/${permlink}`],
      ),
    };
  } catch (error) {
    return { error };
  }
};

exports.sendOperations = async ({ operations, key }) => {
  try {
    return {
      result: await broadcastClient
        .broadcast
        .sendOperations([operations], PrivateKey.fromString(key)),
    };
  } catch (error) {
    return { error };
  }
};

/*
Calculate vote value after vote, returns -1 if it is downVote
return 0 if vote weight = 0
 */
exports.getVoteValue = async (vote) => {
  const post = await this.getPostInfo({ author: vote.author, permlink: vote.permlink });
  if (!post.author || parseFloat(post.pending_payout_value) === 0 || +post.net_rshares === 0) {
    return { weight: 0, voteValue: 0 };
  }

  const currentVote = _.find(
    post.active_votes,
    (hiveVote) => vote.voter === hiveVote.voter,
  );
  if (!currentVote || currentVote.percent === 0) {
    return {
      weight: _.get(currentVote, 'percent', 0),
      voteValue: 0,
      metadata: post.json_metadata,
    };
  }
  if (currentVote.percent < 0) {
    return { weight: currentVote.percent, voteValue: -1, metadata: post.json_metadata };
  }

  const voteHDBWeight = +currentVote.rshares
    / (+post.net_rshares / parseFloat(post.pending_payout_value));
  const { currentPrice } = await this.getCurrentPriceInfo();

  return {
    weight: currentVote.percent,
    voteValue: _.round(voteHDBWeight / currentPrice, 3),
    metadata: post.json_metadata,
  };
};

exports.claimRewards = async (account) => {
  const accountInfo = await this.getAccountInfo(account.name);
  if (accountInfo.error) return;
  const operations = [
    'claim_reward_balance',
    {
      account: account.name,
      reward_hbd: accountInfo.reward_hbd_balance,
      reward_hive: accountInfo.reward_hive_balance,
      reward_vests: `${accountInfo.reward_vesting_balance.split(' ')[0]} VESTS`,
    },
  ];
  return this.sendOperations({ operations, key: account.key });
};

const parseToFloat = (balance) => parseFloat(balance.match(/.\d*.\d*/)[0]);

exports.getRewardFund = async () => {
  try {
    return {
      result: await databaseClient.call('condenser_api', 'get_reward_fund', ['post']),
    };
  } catch (error) {
    return { error };
  }
};

exports.getCurrentMedianHistoryPrice = async () => {
  try {
    return {
      result: await databaseClient.call('condenser_api', 'get_current_median_history_price', []),
    };
  } catch (error) {
    return { error };
  }
};

exports.getFollowCount = async (name) => {
  try {
    const result = await databaseClient.call(
      'condenser_api',
      'get_follow_count',
      [name],
    );
    if (result && result.error) return { error: result.error };
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.getFollowingsList = async ({ name, startAccount, limit }) => {
  try {
    const followings = await databaseClient.call(
      'follow_api',
      'get_following',
      [name, startAccount, 'blog', limit],
    );

    return { followings };
  } catch (error) {
    return { error };
  }
};

exports.getFollowersList = async ({ name, startAccount, limit }) => {
  try {
    const followers = await databaseClient.call(
      'condenser_api',
      'get_followers',
      [name, startAccount, 'blog', limit],
    );
    return { followers };
  } catch (error) {
    return { error };
  }
};
