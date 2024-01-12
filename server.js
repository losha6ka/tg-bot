const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const TronWeb = require('tronweb');
const token = "6163872748:AAFTTSgOJQ-9haJlhz_jMaz9-zHn8diutDI";
const adminUserIds = [709027639];
const bot = new TelegramBot(token, { polling: true });
const db = new sqlite3.Database('mydatabase.db');
const userStates = {}
const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io', });// Замените на свой узел Tron
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        login TEXT,
        balance INTEGER,
        totalPurchases INTEGER,
        tron_address TEXT
    )
`);
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userLogin = msg.from.username ? `@${msg.from.username}` : '@blank';

    try {
        await addUserToDatabase(userId, userLogin);

        const welcomeMessage = 'Привет! Вас приветствует бот. Выберите опцию';

        const mainKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Мой профиль', callback_data: 'my_profile' }],
                    [{ text: 'Купить', callback_data: 'buy' }],
                    [{ text: 'Пополнить баланс', callback_data: 'add_funds' }],
                    [{ text: 'Поддержка', callback_data: 'support' },
                    { text: 'Правила', callback_data: 'rules' }],
                ],
            },
        };

        const startMessage = await bot.sendMessage(chatId, welcomeMessage, mainKeyboard);
        const startMessageId = startMessage.message_id;

        // Сохраняем информацию о текущем сообщении в чате
        userStates[chatId] = { messageId: startMessageId };
    } catch (error) {
        console.error(error.message);
    }
});
bot.onText(/\/add_funds/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const tronAddress = await generateTronAddress(userId);
        await saveTronAddressToDatabase(userId, tronAddress);

        const fundsText = `Пополните свой баланс, отправив TRX на адрес: ${tronAddress.base58}`;
        await bot.sendMessage(chatId, fundsText);
        console.log(tronAddress)
        bot.emit('tronPayment', testPaymentEvent);

    } catch (error) {
        console.error('Произошла ошибка при генерации или сохранении Tron-адреса:', error.message);
        await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
});
function addUserToDatabase(userId, login) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                db.run("INSERT INTO users (id, login, balance, totalPurchases) VALUES (?, ?, ?, ?)", [userId, login, 0, 0], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}
async function saveTronAddressToDatabase(userId, tronAddress) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET tron_address = ? WHERE id = ?", [tronAddress.address, userId], (err) => {
            if (err) {
                console.error('Ошибка при сохранении Tron-адреса в базу данных:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
bot.on('tronPayment', async (payment) => {
    const userId = payment.userId;
    const amount = payment.amount;

    try {
        // Обновляем баланс пользователя в базе данных
        await updateBalance(userId, amount);

        // Вызываем функцию, обрабатывающую успешное пополнение баланса
        await handleSuccessfulRecharge(userId, amount);
    } catch (error) {
        console.error('Произошла ошибка при обновлении баланса:', error);
    }
});
// Функция для обновления баланса пользователя
async function updateBalance(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], (err) => {
            if (err) {
                console.error('Ошибка при обновлении баланса в базе данных:', err);
                reject(err);
            } else {
                console.log(`Баланс пользователя ${userId} обновлен на ${amount}`);
                resolve();
            }
        });
    });
}
// Функция, которая будет вызываться при успешном пополнении баланса
async function handleSuccessfulRecharge(userId, amount) {
    // Ваша логика здесь, например, отправка уведомления пользователю
    if (userId) {
        const rechargeMessage = `Ваш баланс успешно пополнен на ${amount}!`;
        await bot.sendMessage(userId, rechargeMessage);
    }
}
async function generateTronAddress(userId) {
    try {
        const uniqueAddress = await tronWeb.createAccount();
        return uniqueAddress.address;
    } catch (error) {
        console.error(`Произошла ошибка при генерации Tron-адреса для пользователя ${userId}:`, error);
        throw error;
    }
}
const testPaymentEvent = {
    userId: 709027639, //717989011
    amount: 10.0,
};

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const currentState = userStates[chatId];
    const action = callbackQuery.data;
    const userId = callbackQuery.from.id;

    switch (action) {
        case 'my_profile':
            db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, row) => {
                const profileText = "Мой профиль";
                if (!err && row) {
                    const profileKeyboard = {
                        inline_keyboard: [
                            [{ text: `Логин: ${row.login}`, callback_data: 'show_login' }],
                            [{ text: `Баланс: ${row.balance}`, callback_data: 'show_balance' }],
                            [{ text: `Сумма покупок: ${row.totalPurchases}`, callback_data: 'show_purchases' }],
                            [{ text: 'Вернуться назад', callback_data: 'back_to_main' }],
                        ],
                    };
                    if (currentState && currentState.messageId) {
                        await bot.editMessageText(profileText, { chat_id: chatId, message_id: currentState.messageId });
                        await bot.editMessageReplyMarkup(profileKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                    }
                } else {
                    await bot.sendMessage(chatId, 'Не удалось найти информацию о профиле.');
                }
            });
            break;
        case 'buy':
            const buyText = "Купить"
            const buyKeyboard = {
                inline_keyboard: [
                    [{ text: 'Ручной фарм', callback_data: 'manual_farm' }],
                    [{ text: 'Автореги', callback_data: 'auto_reg' }],
                    [{ text: 'Бизнес менеджер (BM)', callback_data: 'business_manager' }],
                    [{ text: 'Карты для ПБ', callback_data: 'cards_for_pb' }],
                    [{ text: 'Прокси', callback_data: 'proxy' }],
                    [{ text: 'Вернуться назад', callback_data: 'back_to_main' }],
                ],
            };
            await bot.editMessageText(buyText, { chat_id: chatId, message_id: currentState.messageId });
            await bot.editMessageReplyMarkup(buyKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            break;
        case 'manual_farm':
            const manualFarmText = 'Ручной фарм.';

            const manualFarmKeyboard = {
                inline_keyboard: [
                    [{ text: 'Фарм UA', callback_data: 'farm_ua' }],
                    [{ text: 'Пополнение по ГЕО', callback_data: 'geo_recharge' }],
                    [{ text: 'Вернуться назад', callback_data: 'buy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(manualFarmText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(manualFarmKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentManualFarmMessage = await bot.sendMessage(chatId, manualFarmText, {
                    reply_markup: manualFarmKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentManualFarmMessage.message_id;
            }
            break;
        case 'auto_reg':
            const autoRegText = 'Автореги';

            const autoRegKeyboard = {
                inline_keyboard: [
                    [{ text: 'Авторег UA', callback_data: 'auto_reg_ua' }],
                    [{ text: 'Пополнение по ГЕО', callback_data: 'geo_recharge' }],
                    [{ text: 'Вернуться назад', callback_data: 'buy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(autoRegText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(autoRegKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentAutoRegMessage = await bot.sendMessage(chatId, autoRegText, {
                    reply_markup: autoRegKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentAutoRegMessage.message_id;
            }
            break;
        case 'auto_reg_ua':
            const autoRegUaText = 'Авторег UA';

            const autoRegUaKeyboard = {
                inline_keyboard: [
                    [{ text: 'Авторег UA + FP | цена | кол-во | наличие', callback_data: 'auto_reg_ua_fp' }],
                    // Добавьте другие варианты авторегов по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'auto_reg' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(autoRegUaText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(autoRegUaKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentAutoRegUaMessage = await bot.sendMessage(chatId, autoRegUaText, {
                    reply_markup: autoRegUaKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentAutoRegUaMessage.message_id;
            }
            break;
        case 'business_manager':
            const bmText = 'Бизнес менеджер (BM)';

            const bmKeyboard = {
                inline_keyboard: [
                    [{ text: 'Insta BM', callback_data: 'insta_bm' }],
                    [{ text: 'Insta BM + FP', callback_data: 'insta_bm_fp' }],
                    [{ text: 'Insta BM + FP + РК', callback_data: 'insta_bm_fp_rk' }],
                    [{ text: 'Вернуться назад', callback_data: 'buy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(bmText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(bmKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentBmMessage = await bot.sendMessage(chatId, bmText, {
                    reply_markup: bmKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentBmMessage.message_id;
            }
            break;
        case 'insta_bm':
            const instaBmText = 'Insta BM';

            const instaBmKeyboard = {
                inline_keyboard: [
                    [{ text: 'Insta BM | цена | кол-во | наличие', callback_data: 'insta_bm_info' }],
                    [{ text: 'Вернуться назад', callback_data: 'business_manager' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(instaBmText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(instaBmKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentInstaBmMessage = await bot.sendMessage(chatId, instaBmText, {
                    reply_markup: instaBmKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentInstaBmMessage.message_id;
            }
            break;
        case 'insta_bm_fp':
            const instaBmFpText = 'Insta BM + FP';

            const instaBmFpKeyboard = {
                inline_keyboard: [
                    [{ text: 'Insta BM + FP | цена | кол-во | наличие', callback_data: 'insta_bm_fp_info' }],
                    // Добавьте другие варианты Insta BM + FP по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'business_manager' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(instaBmFpText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(instaBmFpKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentInstaBmFpMessage = await bot.sendMessage(chatId, instaBmFpText, {
                    reply_markup: instaBmFpKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentInstaBmFpMessage.message_id;
            }
            break;
        case 'insta_bm_fp_rk':
            const instaBmFpRkText = 'Insta BM + FP + РК';

            const instaBmFpRkKeyboard = {
                inline_keyboard: [
                    [{ text: 'Insta BM + FP + РК | цена | кол-во | наличие', callback_data: 'insta_bm_fp_rk_info' }],
                    // Добавьте другие варианты Insta BM + FP + РК по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'business_manager' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(instaBmFpRkText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(instaBmFpRkKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentInstaBmFpRkMessage = await bot.sendMessage(chatId, instaBmFpRkText, {
                    reply_markup: instaBmFpRkKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentInstaBmFpRkMessage.message_id;
            }
            break;
        case 'cards_for_pb':
            const cardsForPbText = 'Карты для ПБ';

            const cardsForPbKeyboard = {
                inline_keyboard: [
                    [{ text: 'Приват', callback_data: 'cards_for_pb_privat' }],
                    [{ text: 'Монобанк', callback_data: 'cards_for_pb_monobank' }],
                    [{ text: 'А-Банк', callback_data: 'cards_for_pb_a_bank' }],
                    [{ text: 'Сенс', callback_data: 'cards_for_pb_sens' }],
                    [{ text: 'Вернуться назад', callback_data: 'buy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(cardsForPbText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(cardsForPbKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentCardsForPbMessage = await bot.sendMessage(chatId, cardsForPbText, {
                    reply_markup: cardsForPbKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentCardsForPbMessage.message_id;
            }
            break;
        case 'cards_for_pb_privat':
            const privatText = 'Приват';

            const privatKeyboard = {
                inline_keyboard: [
                    [{ text: 'Приват bin | цена | кол-во | наличие', callback_data: 'privat_info' }],
                    // Добавьте другие варианты Приват банк по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(privatText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(privatKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentPrivatMessage = await bot.sendMessage(chatId, privatText, {
                    reply_markup: privatKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentPrivatMessage.message_id;
            }
            break;
        case 'cards_for_pb_monobank':
            const monobankText = 'Монобанк';

            const monobankKeyboard = {
                inline_keyboard: [
                    [{ text: 'Монобанк bin | цена | кол-во | наличие', callback_data: 'monobank_info' }],
                    // Добавьте другие варианты Монобанк по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(monobankText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(monobankKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentMonobankMessage = await bot.sendMessage(chatId, monobankText, {
                    reply_markup: monobankKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentMonobankMessage.message_id;
            }
            break;
        case 'cards_for_pb_a_bank':
            const aBankText = 'А-Банк';

            const aBankKeyboard = {
                inline_keyboard: [
                    [{ text: 'А-Банк bin | цена | кол-во | наличие', callback_data: 'a_bank_info' }],
                    // Добавьте другие варианты А-Банк по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(aBankText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(aBankKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentABankMessage = await bot.sendMessage(chatId, aBankText, {
                    reply_markup: aBankKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentABankMessage.message_id;
            }
            break;
        case 'cards_for_pb_sens':
            const sensText = 'Сенс';

            const sensKeyboard = {
                inline_keyboard: [
                    [{ text: 'Сенс bin | цена | кол-во | наличие', callback_data: 'sens_info' }],
                    // Добавьте другие варианты Сенс по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(sensText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(sensKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentSensMessage = await bot.sendMessage(chatId, sensText, {
                    reply_markup: sensKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentSensMessage.message_id;
            }
            break;
        case 'proxy':
            const proxyText = 'Прокси';

            const proxyKeyboard = {
                inline_keyboard: [
                    [{ text: 'Vodafone', callback_data: 'proxy_vodafone' }],
                    [{ text: 'Life', callback_data: 'proxy_life' }],
                    [{ text: 'Kyivstar', callback_data: 'proxy_kyivstar' }],
                    // Добавьте другие варианты Прокси по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'buy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(proxyText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(proxyKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentProxyMessage = await bot.sendMessage(chatId, proxyText, {
                    reply_markup: proxyKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentProxyMessage.message_id;
            }
            break;
        case 'proxy_vodafone':
            const vodafoneText = 'Vodafone';

            const vodafoneKeyboard = {
                inline_keyboard: [
                    [{ text: '30 дней | цена | кол-во | наличие', callback_data: 'proxy_30_days' }],
                    // Добавьте другие варианты для Vodafone по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'proxy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(vodafoneText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(vodafoneKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentVodafoneMessage = await bot.sendMessage(chatId, vodafoneText, {
                    reply_markup: vodafoneKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentVodafoneMessage.message_id;
            }
            break;
        case 'proxy_life':
            const lifeText = 'Life';

            const lifeKeyboard = {
                inline_keyboard: [
                    [{ text: '30 дней | цена | кол-во | наличие', callback_data: 'proxy_30_days' }],
                    // Добавьте другие варианты для Life по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'proxy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(lifeText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(lifeKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentLifeMessage = await bot.sendMessage(chatId, lifeText, {
                    reply_markup: lifeKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentLifeMessage.message_id;
            }
            break;
        case 'proxy_kyivstar':
            const kyivstarText = 'Kyivstar';

            const kyivstarKeyboard = {
                inline_keyboard: [
                    [{ text: '30 дней | цена | кол-во | наличие', callback_data: 'proxy_30_days' }],
                    // Добавьте другие варианты для Kyivstar по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'proxy' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(kyivstarText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(kyivstarKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentKyivstarMessage = await bot.sendMessage(chatId, kyivstarText, {
                    reply_markup: kyivstarKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentKyivstarMessage.message_id;
            }
            break;
        case 'back_to_main':
            const mainText = "Меню"
            const mainKeyboard = {
                inline_keyboard: [
                    [{ text: 'Мой профиль', callback_data: 'my_profile' }],
                    [{ text: 'Купить', callback_data: 'buy' }],
                    [{ text: 'Пополнить баланс', callback_data: 'add_funds' }],
                    [{ text: 'Поддержка', callback_data: 'support' },
                    { text: 'Правила', callback_data: 'rules' }],
                ],
            };
            if (bot.editMessageText && bot.editMessageReplyMarkup) {
                bot.editMessageText(mainText, { chat_id: chatId, message_id: currentState.messageId });
                bot.editMessageReplyMarkup(mainKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                // Вывод сообщения или логирование об отсутствии поддержки методов
                console.error('Методы editMessageText или editMessageReplyMarkup не поддерживаются в данной версии библиотеки или среде выполнения.');
                // Возможно, вам нужно обновить библиотеку или использовать другой метод редактирования сообщения.
            }
            break;
        case 'rules':
            const rulesText = `
        *Правила:*
        Покупая товары в нашем магазине, вы автоматически принимаете эти правила.
        Внимательно читаем описание товара, потом только спрашиваем!
        Мы не несем ответственности за RISK PAYMENT, POLICY и другие причины бана.
        Это касается как учетных записей Facebook, так и карт и вашего запуска.
        Все претензии по возврату/обмену принимаются в течение одного дня с момента покупки (не более 24 часов).
        По истечении 24-х часов, любые возвраты/обмены автоматически сгорают и уходят в счет сервиса.
        Вывод средств с бота невозможен, манибеков нет, поэтому учитывайте это при пополнении своих балансов! Это очень важно.
        В случае обмана с вашей стороны с невалидом - отказ в возврате средств, сотрудничестве, замене. Вечный БАН и добавление в СКАМ лист.
        Чтобы получить замену аккаунтов нужно переслать сообщение с заказа в боте и прислать скриншот с ошибкой менеджеру.
        Всем топовых заливов!
        Незнание правил не освобождает от ответственности!
    `;

            const rulesKeyboard = {
                inline_keyboard: [
                    [{ text: 'Вернуться назад', callback_data: 'back_to_main' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(rulesText, { chat_id: chatId, message_id: currentState.messageId, parse_mode: 'Markdown' });
                await bot.editMessageReplyMarkup(rulesKeyboard, { chat_id: chatId, message_id: currentState.messageId });

            } else {
                const sentRulesMessage = await bot.sendMessage(chatId, rulesText, {
                    parse_mode: 'Markdown',
                    reply_markup: rulesKeyboard,
                });
                // Сохраняем новый messageId в состоянии пользователя
                // currentState.messageId = sentRulesMessage.message_id;
            }
            break;
        case 'support':
            const supportText = "Поддержка"
            const supportKeyboard = {
                inline_keyboard: [
                    [{ text: '@поддержка', callback_data: 'supprot_user' }],
                    [{ text: 'Вернуться назад', callback_data: 'back_to_main' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(supportText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(supportKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentSupportMessage = await bot.sendMessage(chatId, supportText, {
                    reply_markup: supportKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentSupportMessage.message_id;
            }
            break;
        case 'farm_ua':
            const manualFText = "Фарм UA"
            const farmUaKeyboard = {
                inline_keyboard: [
                    [{ text: 'UA фарм 7 дней | цена | кол-во | наличие', callback_data: 'ua_farm_7_days' }],
                    [{ text: 'UA фарм 14 дней | цена | кол-во | наличие', callback_data: 'ua_farm_14_days' }],
                    [{ text: 'UA фарм 30 дней | цена | кол-во | наличие', callback_data: 'ua_farm_30_days' }],
                    [{ text: 'Вернуться назад', callback_data: 'manual_farm' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(manualFText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(farmUaKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentFarmUaMessage = await bot.sendMessage(chatId, {
                    reply_markup: farmUaKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentFarmUaMessage.message_id;
            }
            break;
        case 'add_funds':
            const addFundsText = 'Пополнения баланса:';

            const addFundsKeyboard = {
                inline_keyboard: [
                    [{ text: 'Binance ID', callback_data: 'binance_id' }],
                    [{ text: 'Криптовалюта (bitcoin/trc20/eth)', callback_data: 'crypto' }],
                    [{ text: 'Украинская карта', callback_data: 'ua_card' }],
                    // Добавьте другие способы по необходимости
                    [{ text: 'Вернуться назад', callback_data: 'back_to_main' }],
                ],
            };

            if (currentState && currentState.messageId) {
                await bot.editMessageText(addFundsText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(addFundsKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentAddFundsMessage = await bot.sendMessage(chatId, addFundsText, {
                    reply_markup: addFundsKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя
                currentState.messageId = sentAddFundsMessage.message_id;
            }
            break;
        case 'binance_id':
            // Отправляем сообщение с запросом о вводе суммы в долларах
            const inputBinanceMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');

            // Начинаем прослушивание ввода пользователя
            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputBinanceMessage.message_id);

                const enteredAmount = parseFloat(msg.text);

                // Проверка, что введенное значение является числом
                if (!isNaN(enteredAmount)) {
                    const fundsBinanceText = `Вы можете произвести оплату ${enteredAmount}$ по Binance {присылаем реквизиты}\nДля подтверждения платежа обязательно пришлите скрин оплаты.`
                    await bot.sendMessage(chatId, fundsBinanceText);
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное число в $.');
                }
            });
            break;
        case 'crypto':
            const inputCryptoMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');

            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputCryptoMessage.message_id);

                const enteredAmount = parseFloat(msg.text);

                if (!isNaN(enteredAmount)) {
                    const userId = msg.from.id;

                    try {
                        const tronAddress = await getTronAddress(userId);

                        if (tronAddress) {
                            const fundsCryptoText = `Вы можете произвести оплату ${enteredAmount}$ по Crypto ${tronAddress}\nДля подтверждения платежа обязательно пришлите скрин оплаты.`
                            await bot.sendMessage(chatId, fundsCryptoText);
                        } else {
                            await bot.sendMessage(chatId, 'Произошла ошибка. Tron-адрес не был возвращен.');
                        }
                    } catch (error) {
                        await bot.sendMessage(chatId, 'Произошла ошибка при получении Tron-адреса.');
                    }
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное число в $.');
                }
            });
            break;
        case 'ua_card':
            // Отправляем сообщение с запросом о вводе суммы в долларах
            const inputUACardsMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');

            // Начинаем прослушивание ввода пользователя
            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputUACardsMessage.message_id);

                const enteredAmount = parseFloat(msg.text);

                // Проверка, что введенное значение является числом
                if (!isNaN(enteredAmount)) {
                    const fundsUACardsText = `Вы можете произвести оплату ${enteredAmount}$ по украинской карте {присылаем реквизиты}\nДля подтверждения платежа обязательно пришлите скрин оплаты.`
                    await bot.sendMessage(chatId, fundsUACardsText);
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное число в $.');
                }
            });
            break;
        case 'ua_farm_7_days':
            const uaFarm7Message = `
\n*--- Мощный ручной фарм 7 дней ---*
\n**Описание:**
\n- Кинг/мамка/соц аккаунт полностью готов к использованию.
\n- Регистрация и все действия производились на украинском IP.
\n**Дополнительно:**
\n- Женский пол
\n- Имена аккаунтов на кириллице
\n- Друзья 20-100
\n- Нагулянные cookies (2000+)
\n- 15+ рекламных интересов
\n- Уникальные 8+ фото в профиле и ленте
\n- 20+ постов/репостов
\n- 2 адекватно и полностью заполненные Fan Page + 3 поста
\n- Возраст 20-35
\n- Привязана почта
\n- Паспорт с вероятностью прохождения ЗРД 70%
\n- Внутренний фарм (переписки, лайки, игры, комментарии, видео, посты)
\n- Внешний фарм (логин на сайтах, репосты, просмотр ютуб)
\n- Включен проф. режим
\n- Установлена 2ФА
\n- Пройден чек по "селфи"
\n**В комплекте:**
\n- Логин/пароль аккаунта ФБ + почта
\n- Дата рождения
\n- ID аккаунта
\n- Cookies .JSON
\n- USERAGENT
\n- Селфи и паспорт для прохождения ЗРД
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, uaFarm7Message, { parse_mode: 'Markdown' });
            break;
        case 'ua_farm_14_days':
            const uaFarm14Message = `
\n*--- Мощный ручной фарм 14 дней ---*
\n**Описание:**
\n- Кинг/мамка/соц аккаунт полностью готов к использованию.
\n- Регистрация и все действия производились на украинском IP.
\n**Дополнительно:**
\n- Женский пол
\n- Имена аккаунтов на кириллице
\n- Друзья 20-100
\n- Нагулянные cookies (2000+)
\n- 15+ рекламных интересов
\n- Уникальные 8+ фото в профиле и ленте
\n- 20+ постов/репостов
\n- 2 адекватно и полностью заполненные Fan Page + 3 поста
\n- Возраст 20-35
\n- Привязана почта
\n- Паспорт с вероятностью прохождения ЗРД 70%
\n- Внутренний фарм (переписки, лайки, игры, комментарии, видео, посты)
\n- Внешний фарм (логин на сайтах, репосты, просмотр ютуб)
\n- Включен проф. режим
\n- Установлена 2ФА
\n- Пройден чек по "селфи"
\n**В комплекте:**
\n- Логин/пароль аккаунта ФБ + почта
\n- Дата рождения
\n- ID аккаунта
\n- Cookies .JSON
\n- USERAGENT
\n- Селфи и паспорт для прохождения ЗРД
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, uaFarm14Message, { parse_mode: 'Markdown' });
            break;
        case 'ua_farm_30_days':
            const uaFarm30Message = `
\n*--- Мощный ручной фарм 30 дней ---*
\n**Описание:**
\n- Кинг/мамка/соц аккаунт полностью готов к использованию.
\n- Регистрация и все действия производились на украинском IP.
\n**Дополнительно:**
\n- Женский пол
\n- Имена аккаунтов на кириллице
\n- Друзья 20-100
\n- Нагулянные cookies (2000+)
\n- 15+ рекламных интересов
\n- Уникальные 8+ фото в профиле и ленте
\n- 20+ постов/репостов
\n- 2 адекватно и полностью заполненные Fan Page + 3 поста
\n- Возраст 20-35
\n- Привязана почта
\n- Паспорт с вероятностью прохождения ЗРД 70%
\n- Внутренний фарм (переписки, лайки, игры, комментарии, видео, посты)
\n- Внешний фарм (логин на сайтах, репосты, просмотр ютуб)
\n- Включен проф. режим
\n- Установлена 2ФА
\n- Пройден чек по "селфи"
\n**В комплекте:**
\n- Логин/пароль аккаунта ФБ + почта
\n- Дата рождения
\n- ID аккаунта
\n- Cookies .JSON
\n- USERAGENT
\n- Селфи и паспорт для прохождения ЗРД
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, uaFarm30Message, { parse_mode: 'Markdown' });
            break;
        case 'auto_reg_ua_fp':
            const autoRegUaFpMessage = `
\n*--- Авторег UA + FP ---*
\n**Описание:**
\nСтабильные автореги, подходящие для любых задач - автозалив, ручной залив, линковка к кингу, дофарм и создание крепкого кинга и т.д. Аккаунты UA, готовы для рекламы.
\n**Дополнительно:**
\n- Установлена аватарка
\n- Заполнен город/работа и т.д.
\n- Имена и фамилии на украинском языке
\n- Пол - женский
\n**В комплекте:**
\n- Логин/пароль аккаунта ФБ + почта
\n- Дата рождения
\n- ID аккаунта
\n- Cookies .JSON
\n- USERAGENT
\n- EAAB-токен в комплекте.
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, autoRegUaFpMessage, { parse_mode: 'Markdown' });
            break;
        case 'insta_bm_info':
            const instaBmMessage = `
\n*--- Insta BM ---*
\n**Описание:**
\nБизнес менеджер Facebook (БМ ФБ) Лимит 50$ Без РК и ФП.\nВ комплекте идёт ссылка для приёма бизнес менеджера.\nСрок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, instaBmMessage, { parse_mode: 'Markdown' });
            break;
        case 'insta_bm_fp_info':
            const instaBmFpMessage = `
\n*--- Insta BM & FP ---*
\n**Описание:**
\nБизнес менеджер Facebook (БМ ФБ) Лимит 50$ Без РК.\nВ комплекте идёт ссылка для приёма бизнес менеджера.\nСрок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, instaBmFpMessage, { parse_mode: 'Markdown' });
            break;
        case 'insta_bm_fp_rk_info':
            const instaBmFpRkMessage = `
\n*--- Insta BM & FP & PK---*
\n**Описание:**
\nБизнес менеджер Facebook (БМ ФБ) Лимит 50$.\nВ комплекте идёт ссылка для приёма бизнес менеджера.\nСрок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, instaBmFpRkMessage, { parse_mode: 'Markdown' });
            break;
        case 'privat_info':
            const privatBinMessage = `
\n*--- Приват bin ---*
\n**Описание:**
\nКарта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            // Отправляем сообщение с описанием
            await bot.sendMessage(chatId, privatBinMessage, { parse_mode: 'Markdown' });
            break;
        case 'monobank_info':
            const monobankCardsText = `
\n*--- Монобанк bin ---*
\n**Описание:**
\nКарта для первого била, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            await bot.sendMessage(chatId, monobankCardsText, { parse_mode: 'Markdown' });

            break;
        case 'a_bank_info':
            const aBankCardsText = `
\n*--- А-банк bin ---*
\n**Описание:**
\nКарта для первого била, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;
            await bot.sendMessage(chatId, aBankCardsText, { parse_mode: 'Markdown' });

            break;
        case 'sens_info':
            const sensCardsText = `
\n*--- Сенс bin ---*
\n**Описание:**
\nКарта для первого била, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            await bot.sendMessage(chatId, sensCardsText, { parse_mode: 'Markdown' });

            break;
        case 'proxy_30_days':
            const proxy30DaysText = `
\n*--- Proxy 30 дней ---*
\n**Описание:**
\n- Socks5/HTTP одновременно работающие протоколы
\n- Смена IP по ссылке
\n- 1 прокси = 1 руки
\n**В комплекте:**
\nIP/Port/Log/Pass + информация
\n**ЦЕНА:**
\n**ОСТАТОК:**
            `;

            await bot.sendMessage(chatId, proxy30DaysText, { parse_mode: 'Markdown' });
            break;

        default:
            // Обработка других действий
            break;
    }
});

// const links = [
//     "https://example.com/link1",
//     "https://example.com/link2",
//     "https://example.com/link3",
//     // Добавьте все необходимые ссылки
// ];
// const price = 100;
// const duration = 7; // Например, 7 дней
// db.run(`
//     CREATE TABLE IF NOT EXISTS services (
//         id INTEGER PRIMARY KEY,
//         name TEXT,
//         description TEXT,
//         duration INTEGER,
//         price INTEGER,
//         availability INTEGER,
//         link TEXT
//     )
// `);
// links.forEach((link) => {
//     db.run("INSERT INTO services (name, description, duration, price, availability, link) VALUES (?, ?, ?, ?, ?, ?)",
//         ["UA фарм на 7 дней", "Описание услуги", duration, price, 10, link], (err) => {
//             if (err) {
//                 console.error("Ошибка при вставке в базу данных:", err.message);
//             } else {
//                 console.log(`Ссылка добавлена в базу данных: ${link}`);
//             }
//         });
// });