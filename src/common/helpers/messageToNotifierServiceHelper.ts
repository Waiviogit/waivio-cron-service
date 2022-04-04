import axios from 'axios';
import { telegramApi } from '../constants/telegram-api.constants';

export const sendMessageToNotifierService = async (message) => {
  try {
    await axios.post(
      `${telegramApi.HOST}${telegramApi.BASE_URL}${telegramApi.CRON_MESSAGE}`,
      {
        cron_service_key: process.env.CRON_SERVICE_KEY,
        message,
      },
    );
  } catch (error) {
    console.error(error.message);
  }
};
