const { setTimeout } = require('node:timers/promises');
const { siteStatisticModel } = require('../database/models');

const addWebsiteStatisticMissingTimestamps = async () => {
  await setTimeout(4000);
  const { result: docs } = await siteStatisticModel.find({ filter: { createdAt: { $exists: false } } });
  for (const doc of docs) {
    const timestamp = doc._id.getTimestamp();
    await siteStatisticModel.updateOne({
      filter: { _id: doc._id },
      update: {
        $set: {
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
    });
  }
};

(async () => {
  await addWebsiteStatisticMissingTimestamps();
  process.exit(0);
})();
