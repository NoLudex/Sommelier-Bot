import TelegramApi from 'node-telegram-bot-api';
import print from '../../utils/logger.js';
import config from '../../../config.js';

const bot = new TelegramApi(config.api.telegram_token, {polling: true});

const sendPhotoWithKeyboard = async (chatId, imagePath, caption, keyboard) => {
    try {
        return await bot.sendPhoto(chatId, imagePath, { caption, ...keyboard })
    } catch (error) {
        print(error, 'error')
    }
}

/**
 * Запускает бота Telegram
 * @param {string} token - Токен из FatherBot
 */
function startTelegramBot(token) {
    if (token == null) throw new Error("Telegram Token is Null")
    
    // Обработчик сообщений
    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const username = msg.from.username;
        const userId = msg.from.id;

        if (!text?.startsWith('/')) return;

        const [command, ...args] = text.slice(1).split(' ');
        print("@" + username + " - \"/" + command + "\" Args: " + JSON.stringify(args));


        try {
            switch(command) {
                case 'start':
                    await bot.sendMessage(chatId, "Пример приложения", {
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Открыть сайт', web_app: {url: 'https://lambent-kataifi-ea2d5b.netlify.app/'}}]
                            ]
                        }
                    })
                    return;
                default:
                    return;
                    // throw new Error(`Unknown command from id${from.id}, "/${command}" Args: ${JSON.stringify(args)}`);
            }
        } catch (error) {
            print(error, 'error')
        }
    })

    // Обработчик callback ответов
    // bot.on('callback_query', async msg => {
    //     const { message, from, data } = msg;
    //     const { chat, message_id} = message;
    //     const [command, ...args] = data.slice(1).split(' ');
    //     // const { command, args } = parseCallbackData(data);

    //     try {
    //         switch (command) {
    //             case 'page':
    //                 return bot.sendMessage(chat.id, "Hu")
    //             default:
    //                 return;
    //         }
    //     } catch (error) {
    //         print(error, 'error')
    //     }
    // })

    print("Telegram - OK") 
}

export default startTelegramBot;