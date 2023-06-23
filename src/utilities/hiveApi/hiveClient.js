const { Client } = require('@hiveio/dhive');
const { NODE_URLS } = require('../../constants/hive');

exports.broadcastClient = new Client(NODE_URLS, { failoverThreshold: 0, timeout: 10 * 1000 });
exports.databaseClient = new Client(NODE_URLS, { failoverThreshold: 0, timeout: 10 * 1000 });
