const { appModel, userWobjectsModel } = require('../../database/models');

const collectAppExperts = async ({ limit }) => {
  const { result: apps, error } = await appModel.find({});

  if (error) return { error };
  const res = await Promise.all(apps.map(async (app) => {
    if (!app.supported_objects || !app.supported_objects.length) return { [app.name]: 'empty' };
    const { result, error: aggregateError } = await userWobjectsModel.aggregate({
      pipeline: [
        { $match: { author_permlink: { $in: app.supported_objects } } },
        { $group: { _id: '$user_name', weight: { $sum: '$weight' } } },
        { $sort: { weight: -1 } },
        { $limit: limit },
        { $project: { _id: 0, name: '$_id', weight: 1 } },
      ],
    });

    if (aggregateError) return { [app.name]: 'aggregation error' };
    const { result: updResult, error: updError } = await appModel.updateOne({
      filter: { name: app.name },
      update: { $set: { top_users: result } },
    });
    if (updError) return { [app.name]: 'update error' };
    return { [app.name]: updResult };
  }));
  return res;
};

const run = async () => {
  await collectAppExperts({ limit: 50 });
};

module.exports = {
  run,
};
