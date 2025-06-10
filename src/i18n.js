import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';
import util from 'util';

const translationsCache = {};

/**
 * Загрузка файлов переводов из папки locales (например: locales/ru.json5, locales/en.json5)
 * @param {string} lang - код языка (например, 'ru', 'en')
 * @returns {object} - объект переводов
 */
function loadTranslations(lang) {
    if (!translationsCache[lang]) {
        const filePath = path.resolve("./src/locales", `${lang}.json5`)
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
        throw new Error(`Файл переводов для языка "${lang}" не найден: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        translationsCache[lang] = JSON5.parse(content);
    }
    return translationsCache[lang];
}

/**
 * Получить перевод строки или многострочного сообщения по ключу и языку.
 * Подставляет в текст параметры в формате %s.
 * @param {string} lang - код языка (ru, en и т.д.)
 * @param {string} key - ключ перевода
 * @param {...any} args - значения для %s
 * @returns {string}
 */
export function t(lang, key, ...args) {
    const translations = loadTranslations(lang);
    const raw = translations[key];
    if (raw === undefined) return key;
    if (Array.isArray(raw)) {
      const message = raw.join("\n");
      return util.format(message, ...args);
    }
    return util.format(raw, ...args);
}