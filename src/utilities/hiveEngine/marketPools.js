const { engineProxy } = require('./engineQuery');

exports.getMarketPools = async ({ query }) => engineProxy({
  params: {
    contract: 'marketpools',
    table: 'pools',
    query,
  },
});
