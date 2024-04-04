const axios = require('axios');
const Hived = require('@hiveio/dhive');
const { NODES_FOR_TEST } = require('../../constants/nodes');
const { redis2 } = require('../../redis');
const { REDIS_KEY } = require('../../constants/redis');

const URLS = [
  'https://engine.rishipanthee.com',
  'https://api.hive-engine.com/rpc/',
  'https://ha.herpc.dtools.dev',
  'https://api.primersion.com',
  'https://herpc.kanibot.com',
  'https://he.sourov.dev',
  'https://herpc.actifit.io',
  'https://api2.hive-engine.com/rpc/',
  'https://herpc.dtools.dev',
  'https://engine.waivio.com',
];

const MAX_BLOCK_DELAY = 20;

const getEngineNodeInfo = async (url) => {
  try {
    const response = await axios.get(url);
    return { result: response.data };
  } catch (error) {
    return { error };
  }
};
const run = async () => {
  try {
    const client = new Hived
      .Client(NODES_FOR_TEST.REGULAR, { failoverThreshold: 0, consoleOnFailover: true, timeout: 10 * 1000 });

    const dynamicProperties = await client.database.getDynamicGlobalProperties();

    const headBlock = dynamicProperties.head_block_number;

    if (!headBlock) return;
    const responses = URLS.map(async (url) => ({ url, data: await getEngineNodeInfo(url) }));
    const resolved = await Promise.all(responses);
    const filtered = resolved.filter((el) => !!el.data.result);

    const withDelay = filtered.map((el) => ({
      ...el,
      delay: headBlock - (el?.data?.result?.lastParsedHiveBlockNumber ?? 0),
    }));

    const sortedByDelay = withDelay.sort((a, b) => a.delay - b.delay);
    const allNodesHasDelay = sortedByDelay.slice(0, 2);

    const filteredWithDelay = withDelay.filter((el) => el.delay < MAX_BLOCK_DELAY);

    const finalResult = filteredWithDelay.length >= 2 ? filteredWithDelay : allNodesHasDelay;
    if (!finalResult.length) return;

    const setData = finalResult.map((el) => el.url);
    await redis2.set({ key: REDIS_KEY.ENGINE_NODES_LIST, data: JSON.stringify(setData) });
  } catch (error) {

  }
};

module.exports = {
  run,
};
