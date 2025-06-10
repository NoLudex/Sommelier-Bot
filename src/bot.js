import TelegramApi from 'node-telegram-bot-api';
import print from './logger.js';
import config from '../config.js';
import { t } from './i18n.js';
import { keyboard } from './keyboards.js';
import { getRecipeById } from './getRecipeByList.js';
import { getUserBySocial, createUser, setSubscribedRecipe, extendSubscriptionBy30Days, createTransaction, isRecipeFavorite, addRecipeToFavorites, removeRecipeFromFavorites, getUserFavoriteRecipes } from './userService.js';
import { parseISO, differenceInCalendarDays, format, isPast, parse, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';
import { recommendCocktails } from './recommendService.js';

const bot = new TelegramApi(config.api.telegram_token, {polling: true});

let recipe, idMainMessage;
const costSubscribe = 1;

const choice_images = {
    absinthe: { path: './src/images/absinthe.png', caption: t('ru', 'absinthe') },
    beer: { path: './src/images/beer.png', caption: t('ru', 'beer') },
    champagne: { path: './src/images/champagne.png', caption: t('ru', 'champagne') },
    coffee: { path: './src/images/coffee.png', caption: t('ru', 'coffee') },
    cognac: { path: './src/images/cognac.png', caption: t('ru', 'cognac') },
    detox: { path: './src/images/detox.png', caption: t('ru', 'detox') },
    gin: { path: './src/images/gin.png', caption: t('ru', 'gin') },
    liqors: { path: './src/images/liqors.png', caption: t('ru', 'liqors') },
    milkshake: { path: './src/images/milkshake.png', caption: t('ru', 'milkshake') },
    punsh: { path: './src/images/punsh.png', caption: t('ru', 'punsh') },
    rum: { path: './src/images/rum.png', caption: t('ru', 'rum') },
    sake: { path: './src/images/sake.png', caption: t('ru', 'sake') },
    tea: { path: './src/images/tea.png', caption: t('ru', 'tea') },
    tequila: { path: './src/images/tequila.png', caption: t('ru', 'tequila') },
    vermouth: { path: './src/images/vermouth.png', caption: t('ru', 'vermouth') },
    wine: { path: './src/images/wine.png', caption: t('ru', 'wine') },
    vodka: { path: './src/images/vodka.png', caption: t('ru', 'vodka') },
    whiskey: { path: './src/images/whiskey.png', caption: t('ru', 'whiskey') },
};

const commands = [
    { command: '/start', description: t("ru", "restartBotBtn") },
    { command: '/recipes', description: t("ru", "openRecipesBtn") },
    { command: '/profile', description: t("ru", "profileBtn") },
    { command: '/vip', description: t("ru", "vipBtn") },
    { command: '/support', description: t("ru", "openInfoBotCreatorsBtn") },
]

function startTelegramBot(token) {
    if (token == null) throw new Error("Telegram Token is Null")

    bot.setMyCommands(commands);

    bot.on('pre_checkout_query', async ctx => {
        bot.answerPreCheckoutQuery(ctx.id, true).catch(() => {
            print('Error chekout Query for payment system', "error");
        });
    })

    bot.on('successful_payment', async ctx => {
        const userId = ctx.from.id;
        const socialType = "tg";
        const paymentType = "telegram_star";

        await extendSubscriptionBy30Days(userId);

        let user = await getUserBySocial(userId, socialType)

        await createTransaction({ userId: user.id, type: paymentType, amount: costSubscribe })

        const subscriptionEnd = new Date(user.subscription_date);
        const now = new Date();

        const daysLeft = differenceInCalendarDays(subscriptionEnd, now);
        const formatted = format(subscriptionEnd, 'dd.MM.yyyy', { locale: ru });

        await bot.sendMessage(userId, t("ru", "subThanks", daysLeft, formatted), {
            reply_markup: keyboard("ru").support
        })

        return;
    })
    
    // Обработчик сообщений
    bot.on('message', async ctx => {
        const text = ctx.text;
        const chatId = ctx.chat.id;
        const username = ctx.from.username || t("ru", "guest");
        const userId = ctx.from.id;
        const socialType = "tg";

        

        // bot.setMyCommands(defaultCommands(lng))
        let user = await getUserBySocial(userId, socialType)

        if (!text?.startsWith('/')) return print("@" + username + " - Написал сообщение [\"" + text + "\"]");

        if (!user) {
            await bot.sendPhoto(chatId, "./src/images/confirm.png", {
                caption: t("ru"), 
                reply_markup: keyboard("ru").confirm
            });
            return;
        }

        // Подписка
        const raw = user.subscription_date;
        const subDate = new Date(raw);
        const nowDate = new Date();

        const [command, ...args] = text.slice(1).split(' ');
        print("@" + username + " - \"/" + command + "\" Args: " + JSON.stringify(args));

        try {
            switch(command) {
                // case 'test':
                //     print(await getUserFavoriteRecipes(user.id))
                //     return;
                case 'recipes':
                    await bot.sendPhoto(chatId, "./src/images/list.png", {
                        caption: t("ru", "recipes"), 
                        reply_markup: keyboard("ru", user.age_confirmed).categories
                    });
                    return;
                case 'start':
                    
                    await bot.sendPhoto(chatId, "./src/images/welcome.png", {
                        caption: t("ru", "welcome"), 
                        reply_markup: keyboard("ru", user.id, isAfter(subDate, nowDate)).welcome
                    });
                    return;
                case 'profile':
                    const subscriptionEnd = new Date(user.subscription_date);
                    let subscripteLifeTime, subscribed_recipe;
                    
                    if (isPast(subscriptionEnd)) {
                        subscripteLifeTime = t("ru", "subNoTime");
                    } else {
                        const daysLeft = differenceInCalendarDays(subscriptionEnd, nowDate);
                        const formatted = format(subscriptionEnd, 'dd.MM.yyyy', { locale: ru });
                        subscripteLifeTime = t("ru", "subTime", daysLeft, formatted);
                    }

                    switch (user.subscribed_recipe) {
                        case "1":
                            subscribed_recipe = "on"
                            break;
                        default:
                            subscribed_recipe = "off"
                            break;
                    }

                    await bot.deleteMessage(chatId, messageId)
                    await bot.sendPhoto(chatId, "./src/images/profile.png", { // 20 - Рецепты в избранном, 10 - Рецепты пользователя
                        caption: t("ru", "profile", username, userId, subscripteLifeTime), 
                        reply_markup: keyboard("ru", subscribed_recipe, user.token ).profile,
                        parse_mode: "HTML"
                    });
                    return;
                // case 'lang':
                //     await bot.sendPhoto(chatId, "./src/images/lang.png", {
                //         // caption: "Выбрать язык", 
                //         reply_markup: keyboard("ru").language
                //     });
                //     return;
                case 'support':
                    await bot.sendPhoto(chatId, "./src/images/support.png", {
                        caption: t("ru", "info"), 
                        reply_markup: keyboard("ru").support
                    });
                    return;
                case 'vip':
                    await bot.sendInvoice(chatId, 
                        t("ru", "subTitle"), 
                        t("ru", "subDescription"),
                        "{}",
                        "",
                        "XTR",
                        [{ amount: costSubscribe, label: "VIP Subscribe (30d)" }]
                    )
                    return;
                default:
                    return;
            }
        } catch (error) {
            print(error, 'error')
        }
    })

    // Обработчик callbacka
    bot.on('callback_query', async ctx => {
        const chatId = ctx.message.chat.id;
        const messageId = ctx.message.message_id;
        const username = ctx.from.username || t("ru", "guest");
        const userId = ctx.from.id;
        let callback = ctx.data;
        const socialType = "tg";

        const [command, ...args] = callback.split('_');

        let user = await getUserBySocial(userId, socialType)
        if (!user) {
            if (command == "age") {
                switch (args[0]) {
                    case "adult":
                        user = await createUser({ userId, username, socialType, language: "ru", age: 1 });
                        break;
                    default:
                        user = await createUser({ userId, username, socialType, language: "ru", age: 0 });
                        break;
                }
                print(`Created new user with id = ${user.id}`);
            } else {
                return
            }
            
        }

        // Подписка
        const raw = user.subscription_date;
        const subDate = new Date(raw);
        const nowDate = new Date();

        print("@" + username + " - callback \"" + command + "\" Args: " + JSON.stringify(args));
        // const { command, args } = parseCallbackData(data);

        try {
            switch (command) {
                case 'recommend':
                    if (isAfter(subDate, nowDate)) {
                        // await bot.deleteMessage(chatId, messageId)
                        await bot.sendMessage(chatId, 
                            `⏳ Анализируем ваш список избранного...\n\nЭто может занять некоторое время, стоит подождать! Обычно это занимает от минуты и более!\n`
                        ).then((message) => {
                            idMainMessage = message.message_id.toString();
                        });

                        let recs;
                        try {
                            recs = await recommendCocktails(user.id);
                        } catch (err) {
                            print(`OpenAI error: ${err.message ?? JSON.stringify(err)}`);
                            recs = "💔 Извините, не удалось получить рекомендации — попробуйте чуть позже.";
                        }
                        // print(recs);
                        await bot.editMessageText(recs, {
                            chat_id: chatId,
                            message_id: idMainMessage,
                            parse_mode: 'HTML',
                            reply_markup: keyboard("ru").support
                        })
                    } else {
                        print(`UserID: ${user.id} press 'recommend' callback without VIP`)
                    }
                    return
                case 'age':
                case 'main':
                    await bot.deleteMessage(chatId, messageId)
                    await bot.sendPhoto(chatId, "./src/images/welcome.png", {
                        caption: t("ru", "welcome"), 
                        reply_markup: keyboard("ru", user.id, isAfter(subDate, nowDate)).welcome
                    });
                    return;
                case 'recipes':
                    await bot.deleteMessage(chatId, messageId)
                    if (args[1]) await bot.deleteMessage(chatId, args[1]);
                    await bot.sendPhoto(chatId, "./src/images/list.png", {
                        caption: t("ru", "recipes"), 
                        reply_markup: keyboard("ru", user.age_confirmed).categories
                    });
                    return;
                case 'profile':
                    const subscriptionEnd = new Date(user.subscription_date);
                    const now = new Date();

                    let subscripteLifeTime, subscribed_recipe;
                    
                    if (isPast(subscriptionEnd)) {
                        subscripteLifeTime = t("ru", "subNoTime");
                    } else {
                        const daysLeft = differenceInCalendarDays(subscriptionEnd, now);
                        const formatted = format(subscriptionEnd, 'dd.MM.yyyy', { locale: ru });
                        subscripteLifeTime = t("ru", "subTime", daysLeft, formatted);
                    }

                    switch (user.subscribed_recipe) {
                        case "1":
                            subscribed_recipe = "on"
                            break;
                        default:
                            subscribed_recipe = "off"
                            break;
                    }

                    await bot.deleteMessage(chatId, messageId)
                    await bot.sendPhoto(chatId, "./src/images/profile.png", {
                        caption: t("ru", "profile", username, userId, subscripteLifeTime), 
                        reply_markup: keyboard("ru", subscribed_recipe, user.token ).profile,
                        parse_mode: "HTML"
                    });
                    return;
                case 'support':
                    await bot.deleteMessage(chatId, messageId)
                    await bot.sendPhoto(chatId, "./src/images/support.png", {
                        caption: t("ru", "info"), 
                        reply_markup: keyboard("ru").support
                    });
                    return;
                case 'sub':
                    const newStateSub = args[0] == "on" ? "0" : "1";
                    setSubscribedRecipe(userId, newStateSub);
                    await bot.editMessageReplyMarkup(keyboard("ru", newStateSub == "1" ? "on" : "off", user.token).profile, {
                        chat_id: chatId,
                        message_id: messageId,
                    })
                    return;
                case 'favorite': 
                    const alreadyFav = await isRecipeFavorite(user.id, args[0]);
                    let notificationText;

                    if (alreadyFav) {
                        await removeRecipeFromFavorites(user.id, args[0]);
                        notificationText = 'Рецепт удалён из любимых';
                    } else {
                        await addRecipeToFavorites(user.id, args[0]);
                        notificationText = 'Рецепт добавлен в любимые';
                    }

                    await bot.answerCallbackQuery(ctx.id, { text: notificationText, show_alert: true });
                    return;
                case 'page':
                    // вычисляем номер следующей страницы
                    const nextPage = args[0] === "next"
                        ? (parseInt(args[2]) >= args[4] ? 1 : parseInt(args[2]) + 1)
                        : (parseInt(args[2]) <= 1 ? args[4] : parseInt(args[2]) - 1);

                    // получаем рецепт
                    recipe = await getRecipeById(
                        args[5],
                        args[6],
                        nextPage
                    );

                    const combinedId = `${nextPage}_${messageId}`;

                    await bot.editMessageText(
                        `🍹 <b>${recipe.name}</b> (${nextPage}/${recipe.totalRecipes})\n\n` +
                        `<blockquote expandable>${recipe.description}</blockquote>\n\n` +
                        `🔗 https://telegra.ph/${recipe.link}\n\n` +
                        `➡️ Оценка: ${
                            recipe.average_rating == null
                                ? "Недостаточно данных"
                                : `${recipe.average_rating} ⭐⭐⭐⭐⭐ (${recipe.reviews_count})`
                        }`,
                        {
                            chat_id: chatId,
                            message_id: messageId,
                            parse_mode: 'HTML',
                            reply_markup: keyboard(
                                "ru",
                                combinedId,                                 // args[0]: для callback backToChoiceBtn
                                "addFavorite",                              // args[1]
                                `recipes_${nextPage}_${messageId}`,         // args[2]: callback для возврата в список
                                nextPage === 1
                                    ? "Last"
                                    : (nextPage === recipe.totalRecipes
                                        ? "First"
                                        : ""),                              // args[3]: для меток кнопок
                                recipe.totalRecipes,                        // args[4]: всего страниц
                                args[5],                                    // args[5]: категория
                                args[6],                                     // args[6]: ID списка
                                user.token, 
                                recipe.id
                            ).list
                        }
                    );
                    return;
                case 'choice': 
                    if (args[0] == 'category') {
                        const choice_category = args[1];
                        if (choice_images[choice_category]) {
                            // await bot.deleteMessage(chatId, messageId)
                            if (args[1] != user.id) {
                                await bot.sendPhoto(chatId, choice_images[choice_category].path, { caption: choice_images[choice_category].caption }).then((message) => {
                                    idMainMessage = message.message_id.toString();
                                });
                            } else {
                                await bot.sendMessage(chatId, `Ваши избранные рецепты!`).then((message) => {
                                    idMainMessage = message.message_id.toString();
                                });
                            }
                            
                        } else {
                            return await bot.sendMessage(chatId, `На данный момент категория ${choice_category} недоступна!`);
                        }
                    }

                    await bot.deleteMessage(chatId, messageId);

                    recipe = await getRecipeById(args[0], args[1], args[2]);

                    if (args[2] == undefined) args[2] = 1;
                    print(`${args[2]}_${idMainMessage} ` +
                                "addFavorite " +
                                `recipes_${args[2]}_${idMainMessage} ` +
                                (args[2] == 1 ? "Last " : (
                                            args[2] == recipe.totalRecipes) ? "First ": null) +
                                recipe.totalRecipes + " " +
                                args[0] + " " +
                                args[1] + " " +
                                user.token + " " + 
                                recipe.id);

                    await bot.sendMessage(chatId,
                        `🍹 <b>${recipe.name}</b> ( ${args[2]}/${recipe.totalRecipes} )\n\n` +
                        `<blockquote expandable>${recipe.description}</blockquote>\n\n` +
                        `🔗 https://telegra.ph/${recipe.link}\n\n` +
                        `➡️ Оценка: ${recipe.average_rating == null ? "Недостаточно данных" : `${recipe.average_rating} ⭐⭐⭐⭐⭐ (${recipe.reviews_count})`}`,
                        { parse_mode: 'HTML', 
                            reply_markup: keyboard(
                                "ru", 
                                `${args[2]}_${idMainMessage}`, 
                                "addFavorite", 
                                `recipes_${args[2]}_${idMainMessage}`, 
                                (args[2] == 1 ? "Last" : (
                                            args[2] == recipe.totalRecipes) ? "First": null), 
                                recipe.totalRecipes, 
                                args[0], 
                                args[1], 
                                user.token, 
                                recipe.id).list 
                            }
                    )

                    // print(, 'warn');


                    
                    // Отправка первого рецепта
                    // const recipe = await getRecipe(args[0], 0)
                    // const maxPage = await getMaxId('recipe_' + args[1])
                    // await bot.sendMessage(chatId, `${recipe.name} ( 1/${maxPage} ) \n\nОписание: ${recipe.desc}\n\nСтатья с рецептом: https://telegra.ph/${recipe.link}`, {
                    //     ...keyboard_switch(args[1], 1, maxPage)}).then((message) => {
                    //         addMessage(chatId, message.message_id, userId, 1, args[1])
                    //     })

                    // const recipe = await getRecipeById()

                    return;
                case 'vip':
                    await bot.sendInvoice(chatId, 
                        t("ru", "subTitle"), 
                        t("ru", "subDescription"),
                        "{}",
                        "",
                        "XTR",
                        [{ amount: 1, label: "VIP Subscribe (30d)" }]
                    )
                    return ;
                default:
                    return;
            }
        } catch (error) {
            print(error, 'error')
        }
    })

    print("Telegram - OK") 
}

export default startTelegramBot;