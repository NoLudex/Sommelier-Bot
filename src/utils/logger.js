import chalk from "chalk";

/**
 * Выводит цветное сообщение в консоль
 * @param {string} message - Текст сообщения
 * @param {'error'|'info'|'warn'} type - Тип сообщения
 */
function print(message, type = 'info') {
    switch (type.toLowerCase()) {
        case 'error':
            console.log(chalk.redBright('[Error] ') + message);
            break;
        case 'info':
            console.log(chalk.blueBright('[Info] ') + message);
            break;
        case 'warn':
            console.log(chalk.yellowBright('[Warn] ') + message);
            break;
        default:
            console.log(chalk.greenBright('[Unknown] ') + message);
            throw new Error('Unknown message type: ' + type);
    }
}

export default print;