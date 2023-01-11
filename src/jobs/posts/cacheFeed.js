const _ = require('lodash');
const { ObjectId } = require('mongodb');
const { postModel, appModel } = require('../../database/models');
const {
  APPS_FOR_FEED_CACHE, LANGUAGES, HOT_NEWS_CACHE_SIZE,
  TREND_NEWS_CACHE_SIZE, DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED,
} = require('../../constants/posts');

const objectIdFromDaysBefore = (daysCount) => {
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - daysCount);
  startDate.setMilliseconds(0);
  startDate.setSeconds(0);
  startDate.setMinutes(0);
  startDate.setHours(0);
  const str = `${Math.floor(startDate.getTime() / 1000).toString(16)}0000000000000000`;

  return new ObjectId(str);
};

const getDaysForFeed = (type) => {
  const days = {
    hot: DAYS_FOR_HOT_FEED,
    trending: DAYS_FOR_TRENDING_FEED,
    default: DAYS_FOR_HOT_FEED,
  };
  return (days[type] || days.default);
};

const getPipeline = ({ type, language, appName }) => ([
  {
    $match: {
      _id: { $gte: objectIdFromDaysBefore(getDaysForFeed(type)) },
    },
  },
]);

const getDbPostsIds = async (type, appName) => {
  let idsByWithLocales = [];
  switch (type) {
    case 'hot':
      idsByWithLocales = await Promise.all(LANGUAGES.map(async (locale) => {
        const { posts, error } = await getPostsByCategory({
          category: 'hot',
          skip: 0,
          limit: HOT_NEWS_CACHE_SIZE,
          user_languages: [locale],
          // select  keys: '_id children',
          forApp: appName,
        });
        if (error) {
          console.error(error.message);
          return console.error(`getDbPostsIds Error, type: ${type} appName: ${appName}, locale: ${locale}`);
        }
        return { locale, ids: posts.map((post) => `${post.children}_${post._id}`) };
      }));
      break;
    case 'trending':
      idsByWithLocales = await Promise.all(LANGUAGES.map(async (locale) => {
        const { posts, error } = await getPostsByCategory({
          category: 'trending',
          skip: 0,
          limit: TREND_NEWS_CACHE_SIZE,
          user_languages: [locale],
          keys: '_id net_rshares',
          forApp: appName,
        });
        if (error) {
          console.error(error.message);
          return console.error(`getDbPostsIds Error, type: ${type} appName: ${appName}, locale: ${locale}`);
        }
        return { locale, ids: posts.map((post) => `${post.net_rshares}_${post._id}`) };
      }));
      break;
  }
  return idsByWithLocales.filter((arr) => _.get(arr, 'ids.length', 0) > 0);
};

const run = async () => {
  const hotFeedAppCache = [];
  const trendFeedAppCache = [];
  const { result: apps = [], error } = await appModel.find({
    filter: { host: { $in: APPS_FOR_FEED_CACHE } },
    options: { projection: { name: 1 } },
  });
  if (error) {
    console.error('updateFeedsCache error');
    return;
  }
  for (const app of apps) {
    const hotIds = await getDbPostsIds('hot', app.name);
    const trendIds = await getDbPostsIds('trending', app.name);
    hotFeedAppCache.push({ appName: app.name, idsByLocales: hotIds });
    trendFeedAppCache.push({ appName: app.name, idsByLocales: trendIds });
  }

  // and get feed ids without any app moderation settings
  // only separated by locales(languages)
  const hotFeedNoAppCache = await getDbPostsIds('hot');
  const trendFeedNoAppCache = await getDbPostsIds('trending');

  // update id lists in redis(feeds without app moderation)
  await Promise.all(hotFeedNoAppCache.map(async (localeFeed) => {
    await redisSetter.updateHotLocaleFeedCache(localeFeed);
  }));
  await Promise.all(trendFeedNoAppCache.map(async (localeFeed) => {
    await redisSetter.updateTrendLocaleFeedCache(localeFeed);
  }));

  // update id lists in redis(feeds with app moderation)
  // update HOT feeds by apps
  for (const hotLocalesFeed of hotFeedAppCache) {
    await Promise.all(hotLocalesFeed.idsByLocales.map(async (localFeed) => {
      await redisSetter.updateHotLocaleFeedCache({
        ids: localFeed.ids,
        locale: localFeed.locale,
        app: hotLocalesFeed.appName,
      });
    }));
  }
  // update TREND feeds by apps
  for (const trendLocalesFeed of trendFeedAppCache) {
    await Promise.all(trendLocalesFeed.idsByLocales.map(async (localFeed) => {
      await redisSetter.updateTrendLocaleFeedCache({
        ids: localFeed.ids,
        locale: localFeed.locale,
        app: trendLocalesFeed.appName,
      });
    }));
  }
};
