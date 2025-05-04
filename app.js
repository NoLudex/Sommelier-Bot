import config from './config.js';
import startTelegramBot from './src/bot/telegram/index.js';
import print from './src/utils/logger.js';

console.clear();

try {
    startTelegramBot(config.api.telegram_token);
} catch (error) {
    print(error, 'error');
}