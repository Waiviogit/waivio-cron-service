const _ = require('lodash');
const { appModel, wobjectModel } = require('../../database/models');
const { sendError } = require('../../helpers/sentryHelper');
const { FIELDS_NAMES } = require('../../constants/wobject');

const updateSupportedObjects = async ({ app }) => {
  if (!(app.inherited && !app.canBeExtended)) return;
  const authorities = _.get(app, 'authority', []);
  const orMapCond = [], orTagsCond = [];
  if (app.mapCoordinates.length) {
    app.mapCoordinates.forEach((points) => {
      orMapCond.push({
        map: {
          $geoWithin: {
            $box: [points.bottomPoint, points.topPoint],
          },
        },
      });
    });
  }
  if (app.object_filters && Object.keys(app.object_filters).length) {
    for (const type of Object.keys(app.object_filters)) {
      const typesCond = [];
      for (const category of Object.keys(app.object_filters[type])) {
        if (app.object_filters[type][category].length) {
          typesCond.push({
            fields: {
              $elemMatch: {
                name: FIELDS_NAMES.CATEGORY_ITEM,
                body: { $in: app.object_filters[type][category] },
                tagCategory: category,
              },
            },
          });
        }
      }
      if (typesCond.length)orTagsCond.push({ $and: [{ object_type: type }, { $or: typesCond }] });
    }
  }
  const condition = {
    $and: [{
      $or: [{
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.ownership', authorities] } },
            0,
          ],
        },
      }, {
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.administrative', authorities] } },
            0,
          ],
        },
      }],
    }],
    object_type: { $in: app.supported_object_types },
  };
  if (orMapCond.length)condition.$and[0].$or.push(...orMapCond);
  if (orTagsCond.length) condition.$and.push({ $or: orTagsCond });

  const { result, error } = await wobjectModel.find({
    filter: condition,
    options: {
      projection: { author_permlink: 1, _id: 0 },
    },
  });
  if (error) {
    await sendError(error);
  }
  await appModel.updateOne({
    filter: { _id: app._id },
    update: { $set: { supported_objects: _.map(result, 'author_permlink') } },
  });
};

const updateSiteWobjects = async () => {
  const { result: apps } = await appModel.find({
    filter: { inherited: true, canBeExtended: false },
    options: {
      projection: {
        host: 1,
        inherited: 1,
        canBeExtended: 1,
        authority: 1,
        mapCoordinates: 1,
        object_filters: 1,
        supported_object_types: 1,
      },
    },
  });
  for (const app of apps) {
    await updateSupportedObjects({ app });
  }
};

const run = async () => {
  await updateSiteWobjects();
};

module.exports = {
  run,
};
