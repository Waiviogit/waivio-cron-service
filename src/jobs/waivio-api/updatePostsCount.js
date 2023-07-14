const _ = require('lodash');
const { userModel, wobjectModel } = require('../../database/models');

const findLastHourCount = (arrCounts, summaryCount) => summaryCount - _.sum(arrCounts);
const decreasedSummaryCount = (arrCounts, summaryCount) => (
  arrCounts.length < 24 ? summaryCount : summaryCount - _.last(arrCounts));
const pushLastCountToArray = (arrCounts, lastHourCount) => {
  const newArr = [...arrCounts];

  newArr.unshift(lastHourCount);
  return newArr.slice(0, 24);
};
const refreshUsersCounts = async () => {
  // update users which has no any posts by last 24 hours
  await userModel.updateMany({
    filter: { last_posts_count: 0 },
    update: {
      $push: {
        last_posts_counts_by_hours: {
          $each: [0],
          $position: 0,
          $slice: 24,
        },
      },
    },
  });
  // update wobjects which has posts by last 24 hours
  const cursor = userModel.collection.find({ last_posts_count: { $ne: 0 } });
  let successCount = 0;
  for await (const user of cursor) {
    const lastHourPosts = findLastHourCount(user.last_posts_counts_by_hours, user.last_posts_count);

    user.last_posts_count = decreasedSummaryCount(
      user.last_posts_counts_by_hours,
      user.last_posts_count,
    );
    user.last_posts_counts_by_hours = pushLastCountToArray(
      user.last_posts_counts_by_hours,
      lastHourPosts,
    );
    const { result: res } = await userModel.updateOne({
      filter: { _id: user._id },
      update: {
        $set: {
          last_posts_count: user.last_posts_count,
          last_posts_counts_by_hours: user.last_posts_counts_by_hours,
        },
      },
    });

    if (res.modifiedCount) successCount++;
  }

  console.log(`Users posts count updates: ${successCount}`);
};

const refreshWobjectsCounts = async () => {
  // update wobjects which has no any posts by last 24 hours
  await wobjectModel.updateMany({
    filter: { last_posts_count: 0 },
    update: {
      $push: {
        last_posts_counts_by_hours: {
          $each: [0],
          $position: 0,
          $slice: 24,
        },
      },
    },
  });
  // update wobjects which has posts by last 24 hours
  const cursor = wobjectModel.collection.find({ last_posts_count: { $ne: 0 } });
  let successCount = 0;
  for await (const wobject of cursor) {
    const lastHourPosts = findLastHourCount(
      wobject.last_posts_counts_by_hours,
      wobject.last_posts_count,
    );

    wobject.last_posts_count = decreasedSummaryCount(
      wobject.last_posts_counts_by_hours,
      wobject.last_posts_count,
    );
    wobject.last_posts_counts_by_hours = pushLastCountToArray(
      wobject.last_posts_counts_by_hours,
      lastHourPosts,
    );
    const { result: res } = await wobjectModel.updateOne({
      filter: { _id: wobject._id },
      update: {
        $set: {
          last_posts_count: wobject.last_posts_count,
          last_posts_counts_by_hours: wobject.last_posts_counts_by_hours,
        },
      },
    });

    if (res.modifiedCount) successCount++;
  }

  console.log(`Wobjects posts count updates: ${successCount}`);
};

const run = async () => {
  await refreshUsersCounts();
  await refreshWobjectsCounts();
};

module.exports = {
  run,
};
