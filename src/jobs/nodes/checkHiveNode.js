const _ = require('lodash');
const Hived = require('@hiveio/dhive');
const {
  NODES_FOR_TEST, BLOCK_TEST_DATA, REGULAR_TEST_DATA, REDIS_KEY, HISTORY_TEST_DATA,
} = require('../../constants/nodes');
const { redis2 } = require('../../redis');

const getCache = (nodes) => _.reduce(nodes, (acc, el) => {
  acc[el.url] = JSON.stringify(_.omit(el, ['url']));
  return acc;
}, { nodes: JSON.stringify(_.map(nodes, 'url')) });

const hivedRequest = async ({
  url, options, api, method, args = [], timeout = 5000, cbTest,
}) => {
  let timer;
  const client = new Hived.Client(url, options);

  // Function to execute the Hived request
  const executeRequest = async () => {
    try {
      const startTime = Date.now();
      let result;
      if (api) {
        result = await client[api][method](...args);
      } else {
        result = await client[method](...args);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      clearTimeout(timer); // Clear the timeout since the request completed successfully
      const test = cbTest(result);

      return { result, executionTime, test };
    } catch (error) {
      clearTimeout(timer); // Clear the timeout in case of an error
      return { error, executionTime: null };
    }
  };

  try {
    const result = await Promise.race([
      executeRequest(),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, timeout);
      }),
    ]);

    return result;
  } catch (error) {
    return { error };
  }
};

const formatData = (data) => data.reduce((result, item) => {
  const existingItem = result.find((x) => x.url === item.url);
  if (existingItem) {
    existingItem.success += item.success ? 1 : 0;
    existingItem.errors += item.success ? 0 : 1;
    if (item.executionTime) {
      existingItem.executionTimeSum += item.executionTime;
    }
    existingItem.count += 1;
  } else {
    result.push({
      url: item.url,
      success: item.success ? 1 : 0,
      errors: item.success ? 0 : 1,
      executionTimeSum: item.executionTime ? item.executionTime : 0,
      count: 1,
    });
  }
  return result;
}, []);

const finalFormatData = (formattedData) => formattedData.map((item) => ({
  ...item,
  latency: item.executionTimeSum / item.count,
}));

const testNodes = async ({ nodes, testData }) => {
  const results = [];
  for (const url of nodes) {
    for (const testChunk of testData) {
      const { executionTime, test } = await hivedRequest({ url, ...testChunk });
      results.push({
        success: !!test,
        executionTime,
        url,
        scope: testChunk.scope,
      });
    }
  }
  return finalFormatData(formatData(results));
};

const testBlockchain = async () => {
  const testResults = await testNodes({
    nodes: NODES_FOR_TEST.REGULAR,
    testData: BLOCK_TEST_DATA,
  });

  const nodes = _.orderBy(testResults, ['success', 'latency'], ['desc', 'asc']);

  await redis2.hmset({ key: REDIS_KEY.BLOCK, data: getCache(nodes) });
};

const testCommonCalls = async () => {
  const testResults = await testNodes({
    nodes: NODES_FOR_TEST.REGULAR,
    testData: REGULAR_TEST_DATA,
  });

  const nodes = _.orderBy(testResults, ['success', 'latency'], ['desc', 'asc']);

  await redis2.hmset({ key: REDIS_KEY.POST, data: getCache(nodes) });
};

const testHistory = async () => {
  const testResults = await testNodes({
    nodes: NODES_FOR_TEST.REGULAR,
    testData: HISTORY_TEST_DATA,
  });

  const nodes = _.orderBy(testResults, ['success', 'latency'], ['desc', 'asc']);
  await redis2.hmset({ key: REDIS_KEY.HISTORY, data: getCache(nodes) });
};

const run = async () => {
  console.info(`hiveNodeJob started ${new Date().toISOString()}`);
  console.time('hiveNodeJob finished in');
  await testBlockchain();
  await testHistory();
  await testCommonCalls();
  console.timeEnd('hiveNodeJob finished in');
};

module.exports = {
  run,
};
