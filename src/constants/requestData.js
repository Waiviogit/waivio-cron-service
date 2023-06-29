const OBJECT_BOT = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
  development: {
    HOST: 'http://localhost:8093',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
  test: {
    HOST: 'http://localhost:8093',
    BASE_URL: '/objects-bot',
    CREATE_WEBSITE: '/create-site',
    DELETE_WEBSITE: '/delete-site',
    SEND_INVOICE: '/send-invoice',
  },
};

const TELEGRAM_API = {
  production: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
  },
  development: {
    HOST: 'http://localhost:8000',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
  },
};

module.exports = {
  OBJECT_BOT: OBJECT_BOT[process.env.NODE_ENV || 'development'],
  TELEGRAM_API: TELEGRAM_API[process.env.NODE_ENV || 'development'],
};