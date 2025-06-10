import { t } from './i18n.js';

/**
 * @param {Array<Array<[string, string|object]>>} buttonRows
 *   — массив строк, где каждая строка — массив кортежей [текст, payload].
 *   payload может быть:
 *     • string — тогда создаётся { callback_data: payload }
 *     • object — любые поля, которые нужны в InlineKeyboardButton (url, web_app и т.д.)
 */
const makeRows = (buttonRows) =>
    buttonRows.map(row =>
        row.map(([text, payload]) => {
        const btn = { text };
        if (typeof payload === 'string') {
            btn.callback_data = payload;
        } else {
            Object.assign(btn, payload);
        }
        return btn;
        })
);
  
export const keyboard = (lng, ...args) => ({
    language: {
      inline_keyboard: makeRows([
        [['🇷🇺 Русский', 'lang_ru']], 
        [['🇬🇧 English', 'lang_en']]
      ])
    },
    confirm: {
      inline_keyboard: makeRows([
        [[t(lng, 'adultBtn'), 'age_adult']], 
        [[t(lng, 'minorBtn'), 'age_minor']]
      ])
    },
    welcome: {
      inline_keyboard: makeRows([
        [[t(lng, 'recipesBtn'), 'recipes']],
        // [[t(lng, 'favoriteBtn'), 'choice_category_' + args[0]]],
        [[t(lng, 'goToProfileBtn'), 'profile']],
        ...args[1] == true ? [[[t(lng, 'recommendFromAI'), 'recommend']]] : [],
        [[t(lng, 'supportBtn'), 'support']]
      ].filter(Boolean))
    },
    profile: {
        inline_keyboard: makeRows([
            [[t(lng, `subscribe_${args[0]}`), `sub_${args[0]}`]],
            [[t(lng, 'addRecipesBtn'), { web_app: { url: 'https://sommellierpanel.ru/telegram/send_request.php?token=' + args[1] }}]],
            [[t(lng, 'buyVipBtn'), 'vip']],
            [[t(lng, 'backToMainBtn'), 'main']]
        ])
    }, 
    support: {
        inline_keyboard: makeRows([
            [[t(lng, 'backToMainBtn'), 'main']]
        ])
    }, 
    categories: {
        inline_keyboard: makeRows([
            ...(args[0] == '1')
            ? [
              [[t(lng, `absintheBtn`), 'choice_category_absinthe'], [t(lng, `beerBtn`), 'choice_category_beer']],
              [[t(lng, `champagneBtn`), 'choice_category_champagne'], [t(lng, `cognacBtn`), 'choice_category_cognac']],
              [[t(lng, `ginBtn`), 'choice_category_gin'], [t(lng, `liqorsBtn`), 'choice_category_liqors']],
              [[t(lng, `rumBtn`), 'choice_category_rum'], [t(lng, `sakeBtn`), 'choice_category_sake']],
              [[t(lng, `tequilaBtn`), 'choice_category_tequila'], [t(lng, `vermouthBtn`), 'choice_category_vermouth']],
              [[t(lng, `wineBtn`), 'choice_category_wine'], [t(lng, `vodkaBtn`), 'choice_category_vodka']],
              [[t(lng, `whiskeyBtn`), 'choice_category_whiskey']],
          ] : [],
          [[t(lng, `coffeeBtn`), 'choice_category_coffee'], [t(lng, `detoxBtn`), 'choice_category_detox']],
          [[t(lng, `milkshakeBtn`), 'choice_category_milkshake'], [t(lng, `teaBtn`), 'choice_category_tea']],
          [[t(lng, `punshBtn`), 'choice_category_punsh']],
          // [[t(lng, 'searchBtn'), 'search']],
          [[t(lng, 'backToMainBtn'), 'main']],
        ].filter(Boolean))
    },
    list: {
      inline_keyboard: makeRows([
        ...Number(args[4]) > 1
          ? [
            [
              [t(lng, 'backPageBtn' + (args[3] == "Last" ? "Last" : "")), `page_back_list_${args[0]}_${args[4]}_${args[5]}_${args[6]}`], 
              [t(lng, 'nextPageBtn' + (args[3] == "First" ? "First" : "")), `page_next_list_${args[0]}_${args[4]}_${args[5]}_${args[6]}`]
            ]
          ] : [],
        [[t(lng, 'rating'), { web_app: { url: 'https://sommellierpanel.ru/telegram/send_review.php?token=' + args[7] + '&recipe_id=' + args[8] }}], [t(lng, args[1]), 'favorite_' + args[8]]],
        [[t(lng, 'backToChoiceBtn'), args[2]]]
      ].filter(Boolean))
    }
  });