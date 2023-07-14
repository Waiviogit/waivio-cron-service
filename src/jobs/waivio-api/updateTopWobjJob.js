const { objectTypeModel, wobjectModel } = require('../../database/models');

const OBJECT_TYPE_TOP_WOBJECTS_COUNT = 30;
const LOW_PRIORITY_STATUS_FLAGS = ['relisted', 'unavailable'];

const updateTopWobjJob = async () => {
  const { result } = await objectTypeModel.find({ filter: {}, options: { projection: { name: 1, _id: 1 } } });
  for (const doc of result) {
    const { result: wobjsArray } = await wobjectModel.aggregate({
      pipeline: [
        { $match: { object_type: doc.name } },
        {
          $addFields: {
            priority: {
              $cond: {
                if: { $in: ['$status.title', LOW_PRIORITY_STATUS_FLAGS] },
                then: 0,
                else: 1,
              },
            },
          },
        },
        { $sort: { priority: -1, weight: -1, _id: -1 } },
        { $limit: OBJECT_TYPE_TOP_WOBJECTS_COUNT },
      ],
    });
    const authorPermlinks = wobjsArray.map((p) => p.author_permlink);
    const { result: res } = await objectTypeModel.updateOne({
      filter: { _id: doc._id },
      update: { $set: { top_wobjects: authorPermlinks } },
    });

    if (res.modifiedCount) {
      console.log(`Object Type ${doc.name} updated! Add ${authorPermlinks.length} wobjects refs!`);
    }
  }
};

const run = async () => {
  await updateTopWobjJob();
};

module.exports = {
  run,
};
