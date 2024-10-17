const Redis = require('ioredis');

const db2Client = new Redis({ db: 2 });
const db8Client = new Redis({ db: 8 });
const db9Client = new Redis({ db: 9 });
const db10Client = new Redis({ db: 10 });
const db11Client = new Redis({ db: 11 });

module.exports = {
  db2Client,
  db8Client,
  db9Client,
  db10Client,
  db11Client,
};
