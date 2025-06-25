const crypto = require('crypto');
const { OBJECT_TYPES, FIELDS_NAMES } = require('@waivio/objects-processor');
const { wobjectModel, appModel } = require('../../database/models');
const { redis10 } = require('../../redis');
const { APP_HOST } = require('../../constants/common');
const { REDIS_KEY } = require('../../constants/redis');

const STATUSES = {
  RELISTED: 'relisted',
  UNAVAILABLE: 'unavailable',
  NSFW: 'nsfw',
  FLAGGED: 'flagged',
};

const REMOVE_OBJ_STATUSES = [
  STATUSES.NSFW,
  STATUSES.RELISTED,
  STATUSES.UNAVAILABLE,
];

// Normalize domain for consistent hashing
const normalizeDomain = (domain) => domain.toLowerCase().trim();

// Extract base domain (remove subdomains)
const getBaseDomain = (hostname) => {
  const normalized = normalizeDomain(hostname);
  const parts = normalized.split('.');
  if (parts.length <= 2) return normalized;
  return parts.slice(-2).join('.');
};

// Create hash prefix as bytes (not hex string)
const getHashPrefixBytes = (host, prefixLen = 6) => {
  const normalized = normalizeDomain(host);
  const baseDomain = getBaseDomain(normalized);
  const hash = crypto.createHash('sha256').update(baseDomain).digest();
  return hash.slice(0, prefixLen); // Return actual bytes
};

// Generate compact binary data for Redis storage
const generateRedisData = (hosts, prefixLen = 6) => {
  // Use Set to deduplicate hash prefixes
  const uniquePrefixes = new Set();

  hosts.forEach((host) => {
    const prefix = getHashPrefixBytes(host, prefixLen);
    // Convert Buffer to string for Set comparison
    uniquePrefixes.add(prefix.toString('base64'));
  });

  // Convert back to Buffer array
  const prefixes = Array.from(uniquePrefixes).map((prefixStr) => Buffer.from(prefixStr, 'base64'));

  // Convert to base64 for Redis storage
  const buffer = Buffer.concat(prefixes);
  const base64Data = buffer.toString('base64');

  return {
    data: base64Data,
    prefixLength: prefixLen,
    count: prefixes.length, // Use actual unique count
  };
};

const getHostFromUrl = (url = '') => {
  try {
    // Clean the URL first
    let cleanUrl = url.trim();

    // Remove any trailing punctuation that might have slipped through
    cleanUrl = cleanUrl.replace(/[*.,;:!?)\]}>"']+$/, '');

    const urlObj = new URL(cleanUrl);
    return urlObj.hostname;
  } catch (error) {
    console.log(`Failed to parse URL: ${url}`, error.message);
    return null;
  }
};

const cacheGoodUrls = async () => {
  const { result: app } = await appModel.findOne({
    filter: {
      host: APP_HOST,
    },
    options: {
      projection: {
        authority: 1,
      },
    },
  });

  const { result = [] } = await wobjectModel.find({
    filter: {
      object_type: OBJECT_TYPES.LINK,
      fields: {
        $elemMatch: {
          name: 'rating',
          body: 'Safety',
          average_rating_weight: { $gte: 9 },
        },
      },
      'authority.administrative': { $in: app.authority },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    },
  });

  const hosts = result.map((el) => {
    const url = (el?.fields || []).find((f) => f.name === FIELDS_NAMES.URL)?.body || '';
    return getHostFromUrl(url);
  }).filter((el) => !!el);

  hosts.push(APP_HOST);

  const { result: apps = [] } = await appModel.find({
    filter: {
      $or: [
        {
          canBeExtended: false,
          inherited: true,
        },
        {
          canBeExtended: true,
          inherited: false,
        },
      ],
    },
    options: {
      projection: {
        host: 1,
      },
    },
  });

  hosts.push(...apps.map((a) => a.host));

  const redisData = generateRedisData(hosts);

  await redis10.set({ key: REDIS_KEY.SAFE_SITE_PREFIX_DATA, data: JSON.stringify(redisData) });
};

const run = async () => {
  await cacheGoodUrls();
};

module.exports = {
  run,
};
