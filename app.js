import chalk from 'chalk';
import config, { connection } from './config.js';
import startTelegramBot from './src/bot.js';
import print from './src/logger.js';

console.clear();

try {
    print('Bot is Launching...')
    connection.connect(err => {
        if (err) {
            print(err, 'error')
        } else {
            print('MySQL ---- OK')
        }
    })
    startTelegramBot(config.api.telegram_token);
} catch (error) {
    connection.end();
    print('MySQL Connection closed', 'warn')
    print(error, 'error');
}