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
    HOST: 'https://www.waivio.com',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
    WARNING_MESSAGE: '/cron-message',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
    WARNING_MESSAGE: '/cron-message',
  },
  development: {
    HOST: 'http://localhost:8000',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
    WARNING_MESSAGE: '/cron-message',
  },
};

const NOTIFICATIONS_API = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
  development: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
  test: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
  },
};

module.exports = {
  OBJECT_BOT: OBJECT_BOT[process.env.NODE_ENV || 'development'],
  TELEGRAM_API: TELEGRAM_API[process.env.NODE_ENV || 'development'],
  NOTIFICATIONS_API: NOTIFICATIONS_API[process.env.NODE_ENV || 'development'],
};
