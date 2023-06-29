/* eslint-disable camelcase */
const _ = require('lodash');
const { objectTypeModel, wobjectModel, userWobjectsModel } = require('../../database/models');

const OBJECT_TYPE_TOP_EXPERTS_COUNT = 30;
const getObjectTypeWobjects = async (name) => {
  const { result: wobjects, error } = await wobjectModel.find({
    filter: { object_type: name },
    options: {
      projection: { _id: 0, author_permlink: 1 },
    },
  });
  if (error) return { error };
  return { author_permlinks: _.map(wobjects, (w) => w.author_permlink, []) };
};

const getExpertsByAuthorPermlinks = async ({ author_permlinks, limit = 50 }) => {
  const { result: experts, error } = await userWobjectsModel.aggregate({
    pipeline: [
      { $match: { author_permlink: { $in: author_permlinks } } },
      { $group: { _id: '$user_name', total_weight: { $sum: '$weight' } } },
      { $sort: { total_weight: -1 } },
      { $limit: limit },
    ],
  });
  if (error) return { error };
  return { experts };
};

const getExpertsByType = async (objectTypeName) => {
  // eslint-disable-next-line camelcase
  const { author_permlinks, error } = await getObjectTypeWobjects(objectTypeName);

  if (error) return { error };
  // eslint-disable-next-line prefer-const
  let { experts, error: expError } = await getExpertsByAuthorPermlinks(
    { author_permlinks, limit: OBJECT_TYPE_TOP_EXPERTS_COUNT },
  );

  if (expError) return { error: expError };
  experts = _.map(experts, (ex) => ({ name: ex._id, weight: ex.total_weight }));
  return { experts };
};
const updateObjectTypeExperts = async () => {
  const { result } = await objectTypeModel.find({ options: { projection: { name: 1 } } });
  let successCount = 0;

  for (const doc of result) {
    const { experts } = await getExpertsByType(doc.name);

    if (!_.isEmpty(experts)) {
      const { result: res, error } = await objectTypeModel
        .updateOne({
          filter: { name: doc.name },
          update: { $set: { top_experts: experts } },
        });

      if (res.modifiedCount) {
        successCount++;
      }
    }
  }

  console.log(`${successCount} Object Types successfully updated with experts`);
};

const run = async () => {
  await updateObjectTypeExperts();
};

module.exports = {
  run,
};
