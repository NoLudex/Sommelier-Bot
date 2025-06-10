import chalk from "chalk";
import { createLogger, format, transports } from "winston";
import 'winston-daily-rotate-file';

const rotateTransport = new transports.DailyRotateFile({
  filename: 'logs-%DATE%.txt',
  datePattern: 'DD-MM-YYYY',
  dirname: './logs/',
  maxFiles: '14d',
  zippedArchive: false,
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] [${level.toUpperCase()}] ${message}`
    )
  )
});

const consoleTransport = new transports.Console({
  format: format.combine(
    format.colorize(),
    format.printf(({ level, message }) =>
      `[${level}] ${message}`
    )
  )
});

const logger = createLogger({
  transports: [ rotateTransport, consoleTransport ]
});

/**
 * Выводит цветное сообщение в консоль и пишет через Winston
 * @param {string|Error|any} maybeMsgOrType — либо сообщение (или Error/объект), либо уровень ('info'|'warn'|'error')
 * @param {string|Error|any} [maybeTypeOrMsg='info'] — либо уровень, либо сообщение/Error/объект
 */
function print(maybeMsgOrType, maybeTypeOrMsg = 'info') {
  const validLevels = ['error','warn','info'];
  const isLevel = v =>
    typeof v === 'string' &&
    validLevels.includes(v.toLowerCase());

  let message, level;

  if (isLevel(maybeMsgOrType) && !isLevel(maybeTypeOrMsg)) {
    level = maybeMsgOrType.toLowerCase();
    message = maybeTypeOrMsg;
  } else if (!isLevel(maybeMsgOrType) && isLevel(maybeTypeOrMsg)) {
    level = maybeTypeOrMsg.toLowerCase();
    message = maybeMsgOrType;
  } else {
    // ни первый, ни второй — не уровень, или оба — уровни
    level = 'info';
    message = maybeMsgOrType;
  }

  // Если передали Error, берём только текст
  if (message instanceof Error) {
    message = message.message;
  }
  // Если передали не строку — сериализуем
  else if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }

  // Добавляем префикс для консоли
  let prefix;
  switch (level) {
    case 'error':
      prefix = chalk.redBright('[Error] ');
      break;
    case 'warn':
      prefix = chalk.yellowBright('[Warn] ');
      break;
    case 'info':
      prefix = chalk.blueBright('[Info] ');
      break;
    default:
      prefix = chalk.greenBright('[Log] ');
      level = 'info';
  }

  // Сначала выводим в консоль с цветным префиксом
  // console.log(prefix + message);
  // Потом пишем в файл по уровню через Winston
  if (typeof logger[level] === 'function') {
    logger[level](message);
  } else {
    logger.info(message);
  }
}

export default print;
