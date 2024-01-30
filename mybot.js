require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const token = process.env.TOKEN;
const adminUserIds = [
    717989011,
    5343154126,
    6445079871
];
const bot = new TelegramBot(token, { polling: true });
const db = new sqlite3.Database('mydatabase.db');
const userStates = {}
// users
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        login TEXT,
        balance INTEGER,
        totalPurchases INTEGER,
        tron_address TEXT,
        chatId INTEGER
    );
`);
// autoreg
db.run(`
    CREATE TABLE IF NOT EXISTS auto_reg_links (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS auto_reg_fp_links (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS auto_reg_fp_pk_links (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
// farmUA
db.run(`
    CREATE TABLE IF NOT EXISTS farm_ua_links7d (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS farm_ua_links14d (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS farm_ua_links30d (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
// insta
db.run(`
    CREATE TABLE IF NOT EXISTS insta_bm (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS insta_bm_fp (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS insta_bm_fp_rk (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
// pb
db.run(`
    CREATE TABLE IF NOT EXISTS pb_privat (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS pb_mono (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS pb_abank (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS pb_sens (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
// proxy
db.run(`
    CREATE TABLE IF NOT EXISTS proxy_vodafone (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS proxy_life (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS proxy_kyivstar (
        id INTEGER PRIMARY KEY,
        link TEXT,
        price INTEGER
    );
`);
// 
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userLogin = msg.from.username ? `@${msg.from.username}` : '@blank';

    try {
        await addUserToDatabase(userId, userLogin, chatId);

        const welcomeMessage = 'Привет! Вас приветствует бот.';

        const startMessage = await bot.sendMessage(chatId, welcomeMessage);
        const startMessageId = startMessage.message_id;

        // Сохраняем информацию о текущем сообщении в чате
        userStates[chatId] = { messageId: startMessageId };
    } catch (error) {
        console.error(error.message);
    }
});
bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userLogin = msg.from.username ? `@${msg.from.username}` : '@blank';

    try {
        await addUserToDatabase(userId, userLogin, chatId);

        const welcomeMessage = 'Меню';

        const mainKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🤖 Мой профиль', callback_data: 'my_profile' }],
                    [{ text: '💰 Купить', callback_data: 'buy' }],
                    [{ text: '💳 Пополнить баланс', callback_data: 'add_funds' }],
                    [{ text: '🛠 Поддержка', callback_data: 'support' },
                    { text: '📃 Правила', callback_data: 'rules' }],
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
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (adminUserIds.includes(userId)) {
        const commands = `
\nПополнить счёт пользователя - /add_funds 
\nДобавить пост -  /add_post
\nДобавить авторег -  /add_auto_reg
\nДобавить авторег Fp -  /add_auto_fp
\nДобавить авторег Fp Pk -  /add_auto_pk
\nДобавить Farm UA 7дней - /add_farm_ua_7d
\nДобавить Farm UA 14дней - /add_farm_ua_14d
\nДобавить Farm UA 30дней - /add_farm_ua_30d
\nДобавить Insta BM - /add_insta_bm
\nДобавить Insta BM + FP - /add_insta_fp
\nДобавить Insta BM + FP + RK - /add_insta_rk 
\nДобавить ПБ приват - /add_pb_privat
\nДобавить ПБ моно - /add_pb_mono
\nДобавить ПБ абанк - /add_pb_abank
\nДобавить ПБ сенс - /add_pb_sens
\nДобавить Proxy Vodafone - /add_proxy_vodafone
\nДобавить Proxy Life - /add_proxy_life
\nДобавить Proxy Kyivstar - /add_proxy_kyivstar
        `
        await bot.sendMessage(chatId, commands);
    }

});
bot.onText(/\/add_funds/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (adminUserIds.includes(userId)) {
        try {
            // Запрос ID пользователя для пополнения
            const askUserIdMessage = await bot.sendMessage(chatId, 'Введите ID пользователя для пополнения:');

            // Ожидание текстового ответа с ID пользователя
            bot.once('text', async (userIdMsg) => {
                await bot.deleteMessage(chatId, askUserIdMessage.message_id);

                const targetUserId = parseInt(userIdMsg.text);
                if (!isNaN(targetUserId)) {
                    // Запрос суммы для пополнения
                    const askAmountMessage = await bot.sendMessage(chatId, 'Введите сумму для пополнения в $:');

                    // Ожидание текстового ответа с суммой
                    bot.once('text', async (amountMsg) => {
                        await bot.deleteMessage(chatId, askAmountMessage.message_id);

                        const enteredAmount = parseFloat(amountMsg.text);
                        if (!isNaN(enteredAmount)) {
                            // Ваша логика по пополнению баланса пользователя по ID и сумме
                            // Например, вы можете вызвать функцию, которая обновит баланс пользователя в базе данных
                            await updateBalance(targetUserId, enteredAmount);

                            // Отправка сообщения об успешном пополнении
                            const successText = `Баланс пользователя с ID ${targetUserId} успешно пополнен на ${enteredAmount}$.`;
                            await bot.sendMessage(chatId, successText);
                        } else {
                            // В случае некорректного ввода суммы
                            await bot.sendMessage(chatId, 'Некорректная сумма. Попробуйте еще раз.');
                        }
                    });
                } else {
                    // В случае некорректного ввода ID
                    await bot.sendMessage(chatId, 'Некорректный ID пользователя. Попробуйте еще раз.');
                }
            });
        } catch (error) {
            console.error('Произошла ошибка:', error.message);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_post/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (adminUserIds.includes(userId)) {
        try {
            // Запрос текста для поста
            const askPostMessage = await bot.sendMessage(chatId, 'Введите текст для поста:');

            // Ожидание текстового ответа с текстом поста
            bot.once('text', async (textMsg) => {
                const postText = textMsg.text;

                // Удаление сообщения с запросом текста поста
                await bot.deleteMessage(chatId, askPostMessage.message_id);

                // Подготовка клавиатуры подтверждения
                const confirmNewPostKeyboard = {
                    inline_keyboard: [
                        [{ text: 'Опубликовать пост', callback_data: 'confirm_post' }],
                    ],
                };

                // Отправка сообщения с текстом поста и клавиатурой подтверждения
                const askAmountMessage = await bot.sendMessage(chatId, `Пост:\n${postText}`, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmNewPostKeyboard,
                });

                // Ожидание нажатия на кнопку "Опубликовать пост"
                bot.once('callback_query', async (query) => {
                    const data = query.data;
                    const messageId = askAmountMessage.message_id;

                    if (data === 'confirm_post') {
                        try {
                            // Получение всех пользовательских идентификаторов
                            const allUserIds = await getAllUsersId();

                            // Отправка поста каждому пользователю
                            for (const userId of allUserIds) {
                                try {
                                    await bot.sendMessage(userId, `${postText}`, { parse_mode: 'MarkdownV2' });
                                } catch (error) {
                                    console.error(`Ошибка при отправке поста пользователю ${userId}:`, error.message);
                                }
                            }
                        } catch (error) {
                            console.error('Ошибка при получении пользовательских идентификаторов:', error.message);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Произошла ошибка:', error.message);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
function addUserToDatabase(userId, login, chatId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                db.run("INSERT INTO users (id, login, balance, totalPurchases, chatId) VALUES (?, ?, ?, ?, ?)", [userId, login, 0, 0, chatId], (err) => {
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
bot.on('tronPayment', async (payment) => {
    const userId = payment.userId;
    const amount = payment.amount;

    // Обновляем баланс пользователя в базе данных
    try {
        await updateBalance(userId, amount);
        // Уведомляем пользователя о пополнении
        await notifyUser(userId, amount);
    } catch (error) {
        console.error('Произошла ошибка при обновлении баланса:', error);
    }
});
async function makePurchase(userId, purchaseAmount) {
    try {
        // После успешного списания с баланса обновляем количество покупок
        db.run("UPDATE users SET totalPurchases = totalPurchases + ? WHERE id = ?", [purchaseAmount, userId]);
    } catch (error) {
        console.error('Произошла ошибка при совершении покупки:', error);
        throw error; // Можете обработать ошибку в соответствии с вашими потребностями
    }
}
async function notifyUser(userId, amount) {
    // Используйте ваш механизм отправки уведомлений, например, Telegram Bot API
    const chatId = await getChatId(userId);
    const notificationText = `Ваш баланс пополнен на ${amount}$. Новый баланс: ${await getBalance(userId)}$`;
    await bot.sendMessage(chatId, notificationText);
}
async function getBalance(userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.balance);
            }
        });
    });
}
async function getAllUsersId() {
    return new Promise((resolve, reject) => {
        db.all("SELECT id FROM users", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Извлечь все идентификаторы из массива объектов результатов
                const userIds = rows.map(row => row.id);
                resolve(userIds);
            }
        });
    });
}
async function getChatId(userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT chatId FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.chatId);
            }
        });
    });
}
async function updateBalance(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], (err) => {
            if (err) {
                console.error('Ошибка при обновлении баланса в базе данных:', err);
                reject(err);
            } else {
                console.log(`Баланс пользователя ${userId} обновлен на ${amount}`);
                notifyUser(userId, amount)
                resolve();
            }
        });
    });
}
async function deductBalance(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId], function (err) {
            if (err) {
                console.error('Ошибка при списании с баланса:', err);
                reject(err);
            } else {
                makePurchase(userId, amount); // Передаем сумму покупки в функцию makePurchase
                resolve();
            }
        });
    });
}
// 
async function removeFarmUa7d(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM farm_ua_links7d WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeFarmUa14d(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM farm_ua_links14d WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeFarmUa30d(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM farm_ua_links30d WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeInstaBm(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM insta_bm WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeInstaBmFp(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM insta_bm_fp WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeInstaBmFpRk(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM insta_bm_fp_rk WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removePbPrivat(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM pb_privat WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removePbMono(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM pb_mono WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removePbAbank(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM pb_abank WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removePbSens(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM pb_sens WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeProxyVodafone(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM proxy_vodafone WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeProxyLife(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM proxy_life WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeProxyKyivstar(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM proxy_kyivstar WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeAutoReg(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM auto_reg_links WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeAutoRegFp(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM auto_reg_fp_links WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
async function removeAutoRegFpPk(autoRegId) {
    return new Promise((resolve, reject) => {
        // Удаляем запись из auto_reg_links
        db.run("DELETE FROM auto_reg_fp_pk_links WHERE id = ?", [autoRegId], function (err) {
            if (err) {
                console.error('Ошибка при удалении авторега:', err);
                reject(err);
            } else {
                // Здесь вы можете добавить дополнительные действия, если нужно
                resolve();
            }
        });
    });
}
// 
async function getUserById(userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}
// 
bot.onText(/\/add_auto_reg/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену авторега:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addAutoRegLink(link, price);
                    }

                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Авторег успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableAutoRegs(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_auto_fp/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену авторега fp:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addAutoRegFpLink(link, price);
                    }

                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Авторег fp успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableAutoRegsFp(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_auto_pk/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену авторега fp pk:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addAutoRegFpPkLink(link, price);
                    }

                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Авторег fp pk успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableAutoRegsFpPk(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
// 
bot.onText(/\/add_farm_ua_7d/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Farm UA 7d:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addFarmUaLink7D(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Farm UA успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableFarmUa7D(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_farm_ua_14d/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Farm UA 14d:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addFarmUaLink14D(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Farm UA успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableFarmUa14D(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_farm_ua_30d/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Farm UA 30d:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addFarmUaLink30D(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Farm UA успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableFarmUa30D(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
// 
bot.onText(/\/add_insta_bm/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену InstaBm:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addInstaBmLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'InstaBm успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableInstaBm(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_insta_fp/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену InstaBmFp:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addInstaBmFpLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'InstaBmFp успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableInstaBmFp(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_insta_rk/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену InstaBmFpRk:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addInstaBmFpRkLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'InstaBmFpRk успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableInstaBmFpRk(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
// 
bot.onText(/\/add_pb_privat/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Privat:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addPbPrivatLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'PB Privat успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailablePbPrivat(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_pb_mono/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Mono:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addPbMonoLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'PB Mono успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailablePbMono(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_pb_abank/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Abank:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addPbAbankLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'PB Abank успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailablePbAbank(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_pb_sens/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Sens:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addPbSensLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'PB Sens успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailablePbSens(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
// 
bot.onText(/\/add_proxy_vodafone/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Proxy Vodafone:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addProxyVodafoneLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Proxy Vodafone успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableProxyVodafone(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_proxy_life/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Proxy Life:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addProxyLifeLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Proxy Life успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableProxyLife(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
bot.onText(/\/add_proxy_kyivstar/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId)) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Proxy Kyivstar:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linksMessage = await bot.sendMessage(chatId, 'Введите ссылки на Google Диск (каждая ссылка с новой строки):');

                bot.once('text', async (msg) => {
                    const links = msg.text.split('\n');

                    // Проход по каждой ссылке и добавление в базу данных
                    for (const link of links) {
                        await addProxyKyivstarLink(link, price);
                    }
                    // Опционально: Отправьте сообщение об успешном добавлении
                    await bot.sendMessage(chatId, 'Proxy Kyivstar успешно добавлен.');

                    // Получаем обновленный список доступных авторегов
                    const autoRegs = await getAvailableProxyKyivstar(userId);

                    // Отправляем обновленный список пользователю
                });
            });
        } catch (error) {
            console.error('Произошла ошибка при добавлении ссылки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }
});
// 
async function addAutoRegLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в auto_reg_links
        db.run("INSERT INTO auto_reg_links ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addAutoRegFpLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в auto_reg_links
        db.run("INSERT INTO auto_reg_fp_links ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addAutoRegFpPkLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в auto_reg_links
        db.run("INSERT INTO auto_reg_fp_pk_links ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addFarmUaLink7D(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO farm_ua_links7d ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addFarmUaLink14D(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO farm_ua_links14d ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addFarmUaLink30D(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO farm_ua_links30d ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addInstaBmLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO insta_bm ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addInstaBmFpLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO insta_bm_fp ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addInstaBmFpRkLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO insta_bm_fp_rk ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addPbPrivatLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_privat ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addPbMonoLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_mono ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addPbAbankLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_abank ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addPbSensLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_sens ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addProxyVodafoneLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO proxy_vodafone ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addProxyLifeLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO proxy_life ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
async function addProxyKyivstarLink(link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO proxy_kyivstar ( link, price) VALUES ( ?, ?)", [link, price], function (err) {
            if (err) {
                console.error('Ошибка при добавлении ссылки на авторег:', err);
                reject(err);
            } else {
                const autoRegId = this.lastID; // ID только что вставленной записи
                resolve({ id: autoRegId, price, link });
            }
        });
    });
}
// 
async function getAvailableAutoRegs() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM auto_reg_links", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableAutoRegsFp() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM auto_reg_fp_links", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableAutoRegsFpPk() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM auto_reg_fp_pk_links", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableFarmUa7D() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM farm_ua_links7d", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableFarmUa14D() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM farm_ua_links14d", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableFarmUa30D() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM farm_ua_links30d", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableInstaBm() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM insta_bm", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableInstaBmFp() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM insta_bm_fp", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableInstaBmFpRk() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM insta_bm_fp_rk", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbPrivat() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_privat", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbMono() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_mono", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbAbank() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_abank", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbSens() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_sens", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableProxyVodafone() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM proxy_vodafone", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных proxy vodafone:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableProxyLife() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM proxy_life", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableProxyKyivstar() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM proxy_kyivstar", (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function sendAutoRegLinks(userId, quantity) {
    try {
        const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
        const balance = await getBalance(userId)
        if (autoRegs.length > 0) {
            for (let i = 0; i < quantity; i++) {
                const autoReg = autoRegs[i];
                // Отправляем ссылку на каждый авторег
                await bot.sendMessage(userId, `Ваш товар: ${autoReg.link}\nВаш баланс: ${balance}$`);
            }
        } else {
            await bot.sendMessage(chatId, 'Товара нет в наличии');

            console.error('Ошибка при получении информации об автореге.');
        }
    } catch (error) {
        console.error('Произошла ошибка при отправке авторегов:', error);
        throw error;
    }
}
async function sendAutoRegFpLinks(userId, quantity) {
    try {
        const autoRegs = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
        const balance = await getBalance(userId)
        if (autoRegs.length > 0) {
            for (let i = 0; i < quantity; i++) {
                const autoReg = autoRegs[i];
                // Отправляем ссылку на каждый авторег
                await bot.sendMessage(userId, `Ваш товар: ${autoReg.link}\nВаш баланс: ${balance}$`);
            }
        } else {
            await bot.sendMessage(chatId, 'Товара нет в наличии');

            console.error('Ошибка при получении информации об автореге.');
        }
    } catch (error) {
        console.error('Произошла ошибка при отправке авторегов:', error);
        throw error;
    }
}
async function sendAutoRegFpPkLinks(userId, quantity) {
    try {
        const autoRegs = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
        const balance = await getBalance(userId)
        if (autoRegs.length > 0) {
            for (let i = 0; i < quantity; i++) {
                const autoReg = autoRegs[i];
                // Отправляем ссылку на каждый авторег
                await bot.sendMessage(userId, `Ваш товар: ${autoReg.link}\nВаш баланс: ${balance}$`);
            }
        } else {
            await bot.sendMessage(chatId, 'Товара нет в наличии');

            console.error('Ошибка при получении информации об автореге.');
        }
    } catch (error) {
        console.error('Произошла ошибка при отправке авторегов:', error);
        throw error;
    }
}
// 
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const currentState = userStates[chatId];
    const action = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const userLogin = callbackQuery.from.username ? `@${callbackQuery.from.username}` : '@blank';

    switch (action) {
        case 'my_profile':
            db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, row) => {
                const profileText = "Мой профиль";
                if (!err && row) {
                    const profileKeyboard = {
                        inline_keyboard: [
                            [{ text: `Логин: ${row.login || userId}`, callback_data: 'show_login' }],
                            [{ text: `Баланс: ${row.balance}$`, callback_data: 'show_balance' }],
                            [{ text: `Сумма покупок: ${row.totalPurchases}$`, callback_data: 'show_purchases' }],
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
            if (currentState && currentState.messageId) {
                await bot.editMessageText(buyText, { chat_id: chatId, message_id: currentState.messageId });
                await bot.editMessageReplyMarkup(buyKeyboard, { chat_id: chatId, message_id: currentState.messageId });
            } else {
                const sentManualFarmMessage = await bot.sendMessage(chatId, buyText, {
                    reply_markup: buyKeyboard,
                });

                // Сохраняем новый messageId в состоянии пользователя

            }
            break;
        case 'manual_farm':
            const manualFarmText = 'Ручной фарм.';

            const manualFarmKeyboard = {
                inline_keyboard: [
                    [{ text: 'Фарм UA', callback_data: 'farm_ua' }],
                    [{ text: 'Ожидайте новые ГЕО', callback_data: 'geo_recharge' }],
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

            }
            break;
        case 'auto_reg':
            const autoRegText = 'Автореги';

            const autoRegKeyboard = {
                inline_keyboard: [
                    [{ text: 'Авторег UA', callback_data: 'auto_reg_ua' }],
                    [{ text: 'Ожидайте новые ГЕО', callback_data: 'geo_recharge' }],
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

            }
            break;
        case 'auto_reg_ua':
            try {
                const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(autoRegs.map(autoReg => autoReg.price));
                const uniquePricesFp = new Set(autoRegsFp.map(autoReg => autoReg.price));
                const uniquePricesFpPK = new Set(autoRegsFpPk.map(autoReg => autoReg.price));
                // Формируем клавиатуру с уникальными ценами
                const autoRegUaText = 'Авторег UA';
                const autoRegUaKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Авторег UA | ${price || 0}$ | Кол-во: ${autoRegs.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `auto_reg_ua_info`
                        }]),
                        ...Array.from(uniquePricesFp).map(price => [{
                            text: `Авторег UA + FP | ${price || 0}$ | Кол-во: ${autoRegsFp.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `auto_reg_ua_fp`
                        }]),
                        ...Array.from(uniquePricesFpPK).map(price => [{
                            text: `Авторег UA + FP + PK | ${price || 0}$ | Кол-во: ${autoRegsFpPk.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `auto_reg_ua_fp_pk`
                        }]),
                        ...(autoRegs.length === 0 ? [[{ text: 'Авторег UA | 0$ | Кол-во: 0', callback_data: 'auto_reg_ua_info' }]] : []),
                        ...(autoRegsFp.length === 0 ? [[{ text: 'Авторег UA + FP | 0$ | Кол-во: 0', callback_data: 'auto_reg_ua_fp' }]] : []),
                        ...(autoRegsFpPk.length === 0 ? [[{ text: 'Авторег UA + FP + PK | 0$ | Кол-во: 0', callback_data: 'auto_reg_ua_fp_pk' }]] : []),
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

                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
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

            }
            break;
        case 'insta_bm':
            try {
                const instaBms = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(instaBms.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const instaBmText = 'Insta BM';
                const instaBmKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Insta BM | ${price || 10}$ | Кол-во: ${instaBms.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `insta_bm_info`
                        }]),
                        ...(instaBms.length === 0 ? [[{ text: 'Insta BM | 0$ | Кол-во: 0', callback_data: 'insta_bm_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'business_manager' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(instaBmText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(instaBmKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, instaBmText, {
                        reply_markup: instaBmKeyboard,
                    });

                    // Сохраняем новый messageId в состоянии пользователя

                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'insta_bm_fp':
            try {
                const instaBmsFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(instaBmsFp.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const instaBmFpText = 'Insta BM + FP';
                const instaBmFpKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Insta BM + FP | ${price || 10}$ | Кол-во: ${instaBmsFp.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `insta_bm_fp_info`
                        }]),
                        ...(instaBmsFp.length === 0 ? [[{ text: 'Insta BM + FP | 0$ | Кол-во: 0', callback_data: 'insta_bm_fp_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'business_manager' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(instaBmFpText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(instaBmFpKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, instaBmFpText, {
                        reply_markup: instaBmFpKeyboard,
                    });

                    // Сохраняем новый messageId в состоянии пользователя

                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'insta_bm_fp_rk':
            try {
                const instaBmsFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(instaBmsFpRk.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const instaBmFpRkText = 'Insta BM + FP + PK';
                const instaBmFpRkKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Insta BM + FP + PK | ${price || 10}$ | Кол-во: ${instaBmsFpRk.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `insta_bm_fp_rk_info`
                        }]),
                        ...(instaBmsFpRk.length === 0 ? [[{ text: 'Insta BM + FP + PK | 0$ | Кол-во: 0', callback_data: 'insta_bm_fp_rk_info' }]] : []),

                        [{ text: 'Вернуться назад', callback_data: 'business_manager' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(instaBmFpRkText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(instaBmFpRkKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, instaBmFpRkText, {
                        reply_markup: instaBmFpRkKeyboard,
                    });

                    // Сохраняем новый messageId в состоянии пользователя

                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
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

            }
            break;
        case 'cards_for_pb_privat':
            try {
                const privats = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(privats.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const privatText = 'Приват';
                const privatKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Приват bin | ${price || 10}$ | Кол-во: ${privats.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `privat_info`
                        }]),
                        ...(privats.length === 0 ? [[{ text: 'Приват bin | 0$ | Кол-во: 0', callback_data: 'privat_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(privatText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(privatKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, privatText, {
                        reply_markup: privatKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'cards_for_pb_monobank':
            try {
                const mono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(mono.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const monoText = 'Монобанк';
                const monoKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Монобанк bin | ${price || 10}$ | Кол-во: ${mono.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `monobank_info`
                        }]),
                        ...(mono.length === 0 ? [[{ text: 'Монобанк bin | 0$ | Кол-во: 0', callback_data: 'monobank_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(monoText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(monoKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, monoText, {
                        reply_markup: monoKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'cards_for_pb_a_bank':
            try {
                const abank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(abank.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const abankText = 'А-банк';
                const abankKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `А-банк bin | ${price || 10}$ | Кол-во: ${abank.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `a_bank_info`
                        }]),
                        ...(abank.length === 0 ? [[{ text: 'А-банк bin | 0$ | Кол-во: 0', callback_data: 'a_bank_info' }]] : []),

                        [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(abankText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(abankKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, abankText, {
                        reply_markup: abankKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'cards_for_pb_sens':
            try {
                const sens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(sens.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const sensText = 'Сенс';
                const sensKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Сенс bin | ${price || 10}$ | Кол-во: ${sens.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `sens_info`
                        }]),
                        ...(sens.length === 0 ? [[{ text: 'Сенс bin | 0$ | Кол-во: 0', callback_data: 'sens_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'cards_for_pb' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(sensText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(sensKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, sensText, {
                        reply_markup: sensKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
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

            }
            break;
        case 'proxy_vodafone':
            try {
                const vodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(vodafone.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const vodafoneText = 'Vodafone';
                const vodafoneKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `30 дней | ${price || 10}$`,
                            callback_data: `vodafone_info`
                        }]),
                        ...(vodafone.length === 0 ? [[{ text: '30 дней | 40$', callback_data: 'vodafone_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'proxy' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(vodafoneText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(vodafoneKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, vodafoneText, {
                        reply_markup: vodafoneKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'proxy_life':
            try {
                const life = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(life.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const lifeText = 'Life';
                const lifeKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `30 дней | ${price || 10}$`,
                            callback_data: `life_info`
                        }]),
                        ...(life.length === 0 ? [[{ text: '30 дней | 40$', callback_data: 'life_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'proxy' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(lifeText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(lifeKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, lifeText, {
                        reply_markup: lifeKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'proxy_kyivstar':
            try {
                const kyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(kyivstar.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const kyivstarText = 'Kyivstar';
                const kyivstarKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `30 дней | ${price || 10}$`,
                            callback_data: `kyivstar_info`
                        }]),
                        ...(kyivstar.length === 0 ? [[{ text: '30 дней | 40$', callback_data: 'kyivstar_info' }]] : []),
                        [{ text: 'Вернуться назад', callback_data: 'proxy' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(kyivstarText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(kyivstarKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentAutoRegUaMessage = await bot.sendMessage(chatId, kyivstarText, {
                        reply_markup: kyivstarKeyboard,
                    });
                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'back_to_main':
            const mainText = "Меню"
            const mainKeyboard = {
                inline_keyboard: [
                    [{ text: '🤖 Мой профиль', callback_data: 'my_profile' }],
                    [{ text: '💰 Купить', callback_data: 'buy' }],
                    [{ text: '💳 Пополнить баланс', callback_data: 'add_funds' }],
                    [{ text: '🛠 Поддержка', callback_data: 'support' },
                    { text: '📃 Правила', callback_data: 'rules' }],
                ],
            };
            if (bot.editMessageText && bot.editMessageReplyMarkup) {
                if (currentState && currentState.messageId) {
                    bot.editMessageText(mainText, { chat_id: chatId, message_id: currentState.messageId });
                    bot.editMessageReplyMarkup(mainKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentRulesMessage = await bot.sendMessage(chatId, mainText, {
                        parse_mode: 'Markdown',
                        reply_markup: mainKeyboard,
                    })
                }
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
                // 
            }
            break;
        case 'support':
            const supportText = "Поддержка\n@r0yal13"
            const supportKeyboard = {
                inline_keyboard: [
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

            }
            break;
        case 'farm_ua':
            try {
                const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                // Используем объект Set для хранения уникальных цен
                const uniquePrices7D = new Set(farmUa7D.map(farmUa => farmUa.price));
                const uniquePrices14D = new Set(farmUa14D.map(farmUa => farmUa.price));
                const uniquePrices30D = new Set(farmUa30D.map(farmUa => farmUa.price));

                // Формируем клавиатуру с уникальными ценами
                const manualFText = "Фарм UA"
                const farmUaKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices7D).map(price => [{
                            text: `UA фарм 7 дней | ${price || "ошибка"}$ | Кол-во: ${farmUa7D.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `ua_farm_7_days`
                        }]),
                        ...Array.from(uniquePrices14D).map(price => [{
                            text: `UA фарм 14 дней | ${price || "ошибка"}$ | Кол-во: ${farmUa14D.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `ua_farm_14_days`
                        }]),
                        ...Array.from(uniquePrices30D).map(price => [{
                            text: `UA фарм 30 дней | ${price || "ошибка"}$ | Кол-во: ${farmUa30D.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `ua_farm_30_days`
                        }]),
                        ...(farmUa7D.length === 0 ? [[{ text: 'UA фарм 7 дней | 0$ | Кол-во: 0', callback_data: 'ua_farm_7_days' }]] : []),
                        ...(farmUa14D.length === 0 ? [[{ text: 'UA фарм 14 дней | 0$ | Кол-во: 0', callback_data: 'ua_farm_14_days' }]] : []),
                        ...(farmUa30D.length === 0 ? [[{ text: 'UA фарм 30 дней | 0$ | Кол-во: 0', callback_data: 'ua_farm_30_days' }]] : []),

                        [{ text: 'Вернуться назад', callback_data: 'manual_farm' }],
                    ],
                };

                if (currentState && currentState.messageId) {
                    await bot.editMessageText(manualFText, { chat_id: chatId, message_id: currentState.messageId });
                    await bot.editMessageReplyMarkup(farmUaKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentFarmUaMessege = await bot.sendMessage(chatId, manualFText, {
                        reply_markup: farmUaKeyboard,
                    });

                    // Сохраняем новый messageId в состоянии пользователя

                }
            } catch (error) {
                console.error('Произошла ошибка при отображении авторегов:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'add_funds':
            const addFundsText = 'Пополнения баланса:';

            const addFundsKeyboard = {
                inline_keyboard: [
                    [{ text: 'Binance ID', callback_data: 'binance_id' }],
                    [{ text: 'Криптовалюта (USDT TRC20)', callback_data: 'crypto' }],
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

            }
            break;
        case 'binance_id':
            const inputBinanceMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');
            let photoReceivedBinance = false;

            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputBinanceMessage.message_id);

                const enteredAmount = parseFloat(msg.text);
                const copyBinance = `<code>391483018</code>`;

                if (!isNaN(enteredAmount)) {
                    const fundsBinanceText = `Вы можете произвести оплату ${enteredAmount}$ по Binance\n${copyBinance}\nОтправьте чек об оплате (прикрепите одно фото, на котором видно подтверждение оплаты).`;
                    await bot.sendMessage(chatId, fundsBinanceText, { parse_mode: 'HTML' });
                    // Ожидание фото
                    while (!photoReceivedBinance) {
                        try {
                            const photo = await new Promise((resolve) => bot.once('photo', resolve));
                            const photoInfo = photo.photo[0];

                            if (photoInfo && photoInfo.file_id) {
                                await bot.sendMessage(userId, `Заявка успешно отправлена саппортам. Пожалуйста, ожидайте ответа.`);
                                photoReceivedBinance = true;
                                const userIdToCopyBinance = `<code>👆${userId}</code>`
                                for (const adminUserId of adminUserIds) {
                                    await bot.sendPhoto(adminUserId, photoInfo.file_id, { caption: `Фото платежа на сумму ${enteredAmount}$\nID: ${userId}\nНик: ${userLogin}\nЧерез: Binance` });
                                    await bot.sendMessage(adminUserId, userIdToCopyBinance, { parse_mode: 'HTML' });
                                }
                            } else {
                                console.error('Ошибка: Фото не содержит информацию о файле.');
                                await bot.sendMessage(chatId, 'Прикрепите фото с подтверждением оплаты.');
                            }
                        } catch (error) {
                            console.error('Ошибка при получении фото:', error.message);
                        }
                    }
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное числовое значение в $.');
                }
            });
            break;
        case 'crypto':
            const inputCryptoMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');
            let photoReceivedCrypto = false;

            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputCryptoMessage.message_id);

                const enteredAmount = parseFloat(msg.text);
                const copyBinance = `<code>TSgbGfsYGvCPNG7StbapVaNP727vrXBig9</code>`;

                if (!isNaN(enteredAmount)) {
                    const fundsCryptoText = `Вы можете произвести оплату ${enteredAmount}$ по Crypto\n${copyBinance}\nОтправьте чек об оплате (прикрепите одно фото, на котором видно подтверждение оплаты).`;
                    await bot.sendMessage(chatId, fundsCryptoText, { parse_mode: 'HTML' });
                    // Ожидание фото
                    while (!photoReceivedCrypto) {
                        try {
                            const photo = await new Promise((resolve) => bot.once('photo', resolve));
                            const photoInfo = photo.photo[0];

                            if (photoInfo && photoInfo.file_id) {
                                await bot.sendMessage(userId, `Заявка успешно отправлена саппортам. Пожалуйста, ожидайте ответа.`);
                                photoReceivedCrypto = true;
                                const userIdToCopyCrypto = `<code>👆${userId}</code>`
                                for (const adminUserId of adminUserIds) {
                                    await bot.sendPhoto(adminUserId, photoInfo.file_id, { caption: `Фото платежа на сумму ${enteredAmount}$\nID: ${userId}\nНик: ${userLogin}\nЧерез: Crypto` });
                                    await bot.sendMessage(adminUserId, userIdToCopyCrypto, { parse_mode: 'HTML' });

                                }
                            } else {
                                console.error('Ошибка: Фото не содержит информацию о файле.');
                                await bot.sendMessage(chatId, 'Прикрепите фото с подтверждением оплаты.');
                            }
                        } catch (error) {
                            console.error('Ошибка при получении фото:', error.message);
                        }
                    }
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное числовое значение в $.');
                }
            });
            break;
        case 'ua_card':
            const inputUACardsMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');
            let photoReceivedUaCard = false;

            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputUACardsMessage.message_id);

                const enteredAmount = parseFloat(msg.text);
                const copyCard = `<code>4028082011730940</code>`;

                if (!isNaN(enteredAmount)) {
                    const fundsUACardsText = `Вы можете произвести оплату ${enteredAmount}$ по украинской карте\n${copyCard}\nОтправьте чек об оплате (прикрепите одно фото, на котором видно подтверждение оплаты).`;
                    await bot.sendMessage(chatId, fundsUACardsText, { parse_mode: 'HTML' });
                    // Ожидание фото
                    while (!photoReceivedUaCard) {
                        try {
                            const photo = await new Promise((resolve) => bot.once('photo', resolve));
                            const photoInfo = photo.photo[0];

                            if (photoInfo && photoInfo.file_id) {
                                await bot.sendMessage(userId, `Заявка успешно отправлена саппортам. Пожалуйста, ожидайте ответа.`);
                                photoReceivedUaCard = true;
                                const userIdToCopyUaCard = `<code>👆${userId}</code>`
                                for (const adminUserId of adminUserIds) {
                                    await bot.sendPhoto(adminUserId, photoInfo.file_id, { caption: `Фото платежа на сумму ${enteredAmount}$\nID: ${userId}\nНик: ${userLogin}\nЧерез: UA Card` });
                                    await bot.sendMessage(chatId, userIdToCopyUaCard, { parse_mode: 'HTML' });
                                }
                            } else {
                                console.error('Ошибка: Фото не содержит информацию о файле.');
                                await bot.sendMessage(chatId, 'Прикрепите фото с подтверждением оплаты.');
                            }
                        } catch (error) {
                            console.error('Ошибка при получении фото:', error.message);
                        }
                    }
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное числовое значение в $.');
                }
            });
            break;
        case 'ua_farm_7_days':
            const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя

            if (farmUa7D.length > 0) {
                const farmUa7DPrice = farmUa7D[0].price;
                const uaFarm7Message = `
*--- Мощный ручной фарм 7 дней ---*

**Описание:**
- Кинг/мамка/соц аккаунт полностью готов к использованию.
- Регистрация и все действия производились на украинском IP.

**Дополнительно:**
- Женский пол
- Имена аккаунтов на кириллице
- Друзья 20-100
- Нагулянные cookies (2000+)
- 15+ рекламных интересов
- Уникальные 8+ фото в профиле и ленте
- 20+ постов/репостов
- 2 адекватно и полностью заполненные Fan Page + 3 поста
- Возраст 20-35
- Привязана почта
- Паспорт с вероятностью прохождения ЗРД 70%
- Внутренний фарм (переписки, лайки, игры, комментарии, видео, посты)
- Внешний фарм (логин на сайтах, репосты, просмотр ютуб)
- Включен проф. режим
- Установлена 2ФА
- Пройден чек по "селфи"

**В комплекте:**
- Логин/пароль аккаунта ФБ + почта
- Дата рождения
- ID аккаунта
- Cookies .JSON
- USERAGENT
- Селфи и паспорт для прохождения ЗРД

**ЦЕНА:** ${farmUa7DPrice}$
**ОСТАТОК:** ${farmUa7D.length || 0}
            `;
                const buttonsToShow = farmUa7D.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_farm_ua_7d_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, uaFarm7Message, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'ua_farm_14_days':
            const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя

            if (farmUa14D.length > 0) {
                const farmUa14DPrice = farmUa14D[0].price;
                const uaFarm14Message = `
*--- Мощный ручной фарм 14 дней ---*

**Описание:**
- Кинг/мамка/соц аккаунт полностью готов к использованию.
- Регистрация и все действия производились на украинском IP.

**Дополнительно:**
- Женский пол
- Имена аккаунтов на кириллице
- Друзья 20-100
- Нагулянные cookies (2000+)
- 15+ рекламных интересов
- Уникальные 8+ фото в профиле и ленте
- 20+ постов/репостов
- 2 адекватно и полностью заполненные Fan Page + 3 поста
- Возраст 20-35
- Привязана почта
- Паспорт с вероятностью прохождения ЗРД 70%
- Внутренний фарм (переписки, лайки, игры, комментарии, видео, посты)
- Внешний фарм (логин на сайтах, репосты, просмотр ютуб)
- Включен проф. режим
- Установлена 2ФА
- Пройден чек по "селфи"

**В комплекте:**
- Логин/пароль аккаунта ФБ + почта
- Дата рождения
- ID аккаунта
- Cookies .JSON
- USERAGENT
- Селфи и паспорт для прохождения ЗРД

**ЦЕНА:** ${farmUa14DPrice}$
**ОСТАТОК:** ${farmUa14D.length || 0}
            `;
                const buttonsToShow = farmUa14D.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_farm_ua_14d_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, uaFarm14Message, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'ua_farm_30_days':
            const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя

            if (farmUa30D.length > 0) {
                const farmUa30DPrice = farmUa30D[0].price;
                const uaFarm30Message = `
*--- Мощный ручной фарм 30 дней ---*

**Описание:**
- Кинг/мамка/соц аккаунт полностью готов к использованию.
- Регистрация и все действия производились на украинском IP.

**Дополнительно:**
- Женский пол
- Имена аккаунтов на кириллице
- Друзья 20-100
- Нагулянные cookies (2000+)
- 15+ рекламных интересов
- Уникальные 8+ фото в профиле и ленте
- 20+ постов/репостов
- 2 адекватно и полностью заполненные Fan Page + 3 поста
- Возраст 20-35
- Привязана почта
- Паспорт с вероятностью прохождения ЗРД 70%
- Внутренний фарм (переписки, лайки, игры, комментарии, видео, посты)
- Внешний фарм (логин на сайтах, репосты, просмотр ютуб)
- Включен проф. режим
- Установлена 2ФА
- Пройден чек по "селфи"

**В комплекте:**
- Логин/пароль аккаунта ФБ + почта
- Дата рождения
- ID аккаунта
- Cookies .JSON
- USERAGENT
- Селфи и паспорт для прохождения ЗРД

**ЦЕНА:** ${farmUa30DPrice}$
**ОСТАТОК:** ${farmUa30D.length || 0}
            `;
                const buttonsToShow = farmUa30D.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_farm_ua_30d_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, uaFarm30Message, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'auto_reg_ua_info':
            const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя

            if (autoRegs.length > 0) {
                const firstAutoRegPrice = autoRegs[0].price;
                const autoRegUaFpMessage = `
*--- Авторег UA ---*

**Описание:**
Стабильные автореги, подходящие для любых задач - автозалив, ручной залив, линковка к кингу, дофарм и создание крепкого кинга и т.д. Аккаунты UA, готовы для рекламы.

**Дополнительно:**
- Установлена аватарка
- Заполнен город/работа и т.д.
- Имена и фамилии на украинском языке
- Пол - женский

**В комплекте:**
- Логин/пароль аккаунта ФБ + почта
- Дата рождения
- ID аккаунта
- Cookies .JSON
- USERAGENT
- EAAB-токен в комплекте.

**ЦЕНА:** ${firstAutoRegPrice}$
**ОСТАТОК:** ${autoRegs.length || 0}
                    `;
                const buttonsToShow = autoRegs.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_purchase_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, autoRegUaFpMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }
            break;
        case 'auto_reg_ua_fp':
            const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя

            if (autoRegsFp.length > 0) {
                const firstAutoRegPrice = autoRegsFp[0].price;
                const autoRegUaFpMessage = `
*--- Авторег UA + FP ---*

**Описание:**
Стабильные автореги, подходящие для любых задач - автозалив, ручной залив, линковка к кингу, дофарм и создание крепкого кинга и т.д. Аккаунты UA, готовы для рекламы.

**Дополнительно:**
- Установлена аватарка
- Заполнен город/работа и т.д.
- Имена и фамилии на украинском языке
- Пол - женский

**В комплекте:**
- Логин/пароль аккаунта ФБ + почта
- Дата рождения
- ID аккаунта
- Cookies .JSON
- USERAGENT
- EAAB-токен в комплекте.

**ЦЕНА:** ${firstAutoRegPrice}$
**ОСТАТОК:** ${autoRegsFp.length || 0}
                    `;
                const buttonsToShow = autoRegsFp.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_autoreg_fp_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, autoRegUaFpMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }
            break;
        case 'auto_reg_ua_fp_pk':
            const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя

            if (autoRegsFpPk.length > 0) {
                const firstAutoRegPrice = autoRegsFpPk[0].price;
                const autoRegUaFpMessage = `
*--- Авторег UA + FP + PK ---*

**Описание:**
Стабильные автореги, подходящие для любых задач - автозалив, ручной залив, линковка к кингу, дофарм и создание крепкого кинга и т.д. Аккаунты UA, готовы для рекламы.

**Дополнительно:**
- Установлена аватарка
- Заполнен город/работа и т.д.
- Имена и фамилии на украинском языке
- Пол - женский

**В комплекте:**
- Логин/пароль аккаунта ФБ + почта
- Дата рождения
- ID аккаунта
- Cookies .JSON
- USERAGENT
- EAAB-токен в комплекте.

**ЦЕНА:** ${firstAutoRegPrice}$
**ОСТАТОК:** ${autoRegsFpPk.length || 0}
                    `;
                const buttonsToShow = autoRegsFpPk.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_autoreg_fp_pk_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, autoRegUaFpMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }
            break;
        case 'insta_bm_info':
            const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя

            if (instaBm.length > 0) {
                const instaBmPrice = instaBm[0].price;
                const instaBmMessage = `
*--- Insta BM ---*

**Описание:**
Бизнес менеджер Facebook (БМ ФБ) Лимит 50$ Без РК и ФП.
В комплекте идёт ссылка для приёма бизнес менеджера.
Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${instaBmPrice}$
**ОСТАТОК:**  ${instaBm.length || 0}
            `;
                const buttonsToShow = instaBm.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_insta_bm_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, instaBmMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'insta_bm_fp_info':
            const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя

            if (instaBmFp.length > 0) {
                const instaBmFpPrice = instaBmFp[0].price;
                const instaBmFpMessage = `
*--- Insta BM & FP ---*

**Описание:**
Бизнес менеджер Facebook (БМ ФБ) Лимит 50$ Без ФП.
В комплекте идёт ссылка для приёма бизнес менеджера.
Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${instaBmFpPrice}$
**ОСТАТОК:**  ${instaBmFp.length || 0}
            `;
                const buttonsToShow = instaBmFp.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_autoreg_fp_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, instaBmFpMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'insta_bm_fp_rk_info':
            const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя

            if (instaBmFpRk.length > 0) {
                const instaBmFpRkPrice = instaBmFpRk[0].price;
                const instaBmFpRkMessage = `
*--- Insta BM & FP & PK ---*

**Описание:**
Бизнес менеджер Facebook (БМ ФБ) Лимит 50$.
В комплекте идёт ссылка для приёма бизнес менеджера.
Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${instaBmFpRkPrice}$
**ОСТАТОК:**  ${instaBmFpRk.length || 0}
            `;
                const buttonsToShow = instaBmFpRk.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_insta_bm_fp_rk_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, instaBmFpRkMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'privat_info':
            const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя

            if (pbPrivat.length > 0) {
                const pbPrivatPrice = pbPrivat[0].price;
                const pbPrivatMessage = `
*--- Приват bin ---*

**Описание:**
Карта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${pbPrivatPrice}$
**ОСТАТОК:**  ${pbPrivat.length || 0}
            `;
                const buttonsToShow = pbPrivat.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_privat_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbPrivatMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'monobank_info':
            const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя

            if (pbMono.length > 0) {
                const pbMonoPrice = pbMono[0].price;
                const pbMonoMessage = `
*--- Моно bin ---*

**Описание:**
Карта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${pbMonoPrice}$
**ОСТАТОК:**  ${pbMono.length || 0}
            `;
                const buttonsToShow = pbMono.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_mono_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbMonoMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'a_bank_info':
            const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя

            if (pbAbank.length > 0) {
                const pbAbankPrice = pbAbank[0].price;
                const pbAbankMessage = `
*--- А-банк bin ---*

**Описание:**
Карта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${pbAbankPrice}$
**ОСТАТОК:**  ${pbAbank.length || 0}
            `;
                const buttonsToShow = pbAbank.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_abank_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };
                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbAbankMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'sens_info':
            const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя

            if (pbSens.length > 0) {
                const pbSensPrice = pbSens[0].price;
                const pbSensMessage = `
*--- Сенс bin ---*

**Описание:**
Карта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)

**ЦЕНА:** ${pbSensPrice}$
**ОСТАТОК:**  ${pbSens.length || 0}
            `;
                const buttonsToShow = pbSens.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_sens_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbSensMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'vodafone_info':
            const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя

            if (proxyVodafone.length > 0) {
                const proxyVodafonePrice = proxyVodafone[0].price;
                const proxyVodafoneMessage = `
*--- Proxy 30 дней ---*

**Описание:**
- Socks5/HTTP одновременно работающие протоколы
- Смена IP по ссылке
- 1 прокси = 1 руки

**В комплекте:**
IP/Port/Log/Pass + информация

**ЦЕНА:** ${proxyVodafonePrice || 40}$
**После оплаты свяжитесь с саппортом @r0yal13**
            `;
                const buttonsToShow = proxyVodafone.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_vodafone_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, proxyVodafoneMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'life_info':
            const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

            if (proxyLife.length > 0) {
                const proxyLifePrice = proxyLife[0].price;
                const proxyLifeMessage = `
*--- Proxy 30 дней ---*

**Описание:**
- Socks5/HTTP одновременно работающие протоколы
- Смена IP по ссылке
- 1 прокси = 1 руки

**В комплекте:**
IP/Port/Log/Pass + информация

**ЦЕНА:** ${proxyLifePrice || 40}$
**После оплаты свяжитесь с саппортом @r0yal13**
            `;
                const buttonsToShow = proxyLife.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_life_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, proxyLifeMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'kyivstar_info':
            const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя

            if (proxyKyivstar.length > 0) {
                const proxyKyivstarPrice = proxyKyivstar[0].price;
                const proxyKyivstarMessage = `
*--- Proxy 30 дней ---*

**Описание:**
- Socks5/HTTP одновременно работающие протоколы
- Смена IP по ссылке
- 1 прокси = 1 руки

**В комплекте:**
IP/Port/Log/Pass + информация

**ЦЕНА:** ${proxyKyivstarPrice || 40}$
**После оплаты свяжитесь с саппортом @r0yal13**
            `;
                const buttonsToShow = proxyKyivstar.slice(0, 9).map((_, index) => {
                    const buttonText = `${index + 1}шт`;
                    const callbackData = `confirm_kyivstar_${index + 1}`;
                    return { text: buttonText, callback_data: callbackData };
                });

                // Добавляем кнопки "Вернуться назад"
                buttonsToShow.push({ text: 'Вернутся назад', callback_data: 'buy' });

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        buttonsToShow.slice(0, 3),
                        buttonsToShow.slice(3, 6),
                        buttonsToShow.slice(6, 9),
                        buttonsToShow.slice(9, 10),
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, proxyKyivstarMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                await bot.sendMessage(chatId, 'Товара нет в наличии');

                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'confirm_purchase_1':
            try {
                const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                if (autoRegs && autoRegs.length > 0) {
                    const autoReg = autoRegs[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < autoReg.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, autoReg.price);

                    // Удаляем авторег из базы данных
                    await removeAutoReg(autoReg.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    await sendAutoRegLinks(userId, 1);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedAutoReg = await getAvailableAutoRegs();
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_purchase_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_purchase_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const autoRegs = await getAvailableAutoRegs(); // Получаем доступные автореги для пользователя
                    if (autoRegs && autoRegs.length > 0) {
                        const autoReg = autoRegs[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoReg.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoReg.price);

                        // Удаляем авторег из базы данных
                        await removeAutoReg(autoReg.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegs();

                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_1':
            try {
                const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                if (autoRegsFp && autoRegsFp.length > 0) {
                    const autoRegFp = autoRegsFp[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < autoRegFp.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, autoRegFp.price);

                    // Удаляем авторег из базы данных
                    await removeAutoRegFp(autoRegFp.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    await sendAutoRegFpLinks(userId, 1);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedAutoRegFp = await getAvailableAutoRegsFp();
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_autoreg_fp_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const autoRegsFp = await getAvailableAutoRegsFp(); // Получаем доступные автореги для пользователя
                    if (autoRegsFp && autoRegsFp.length > 0) {
                        const autoRegFp = autoRegsFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFp.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFp.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFp(autoRegFp.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoRegFp = await getAvailableAutoRegsFp();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_1':
            try {
                const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                    const autoRegFpPk = autoRegsFpPk[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < autoRegFpPk.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, autoRegFpPk.price);

                    // Удаляем авторег из базы данных
                    await removeAutoRegFpPk(autoRegFpPk.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    await sendAutoRegFpPkLinks(userId, 1);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedAutoReg = await getAvailableAutoRegsFpPk();
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_autoreg_fp_pk_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_autoreg_fp_pk_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const autoRegsFpPk = await getAvailableAutoRegsFpPk(); // Получаем доступные автореги для пользователя
                    if (autoRegsFpPk && autoRegsFpPk.length > 0) {
                        const autoRegFpPk = autoRegsFpPk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < autoRegFpPk.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, autoRegFpPk.price);

                        // Удаляем авторег из базы данных
                        await removeAutoRegFpPk(autoRegFpPk.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        await sendAutoRegFpPkLinks(userId, 1);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedAutoReg = await getAvailableAutoRegsFpPk();
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_1':
            try {
                const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                if (farmUa7D && farmUa7D.length > 0) {
                    const farmUa7d = farmUa7D[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < farmUa7d.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, farmUa7d.price);

                    // Удаляем авторег из базы данных
                    await removeFarmUa7d(farmUa7d.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_farm_ua_7d_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_7d_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const farmUa7D = await getAvailableFarmUa7D(); // Получаем доступные автореги для пользователя
                    if (farmUa7D && farmUa7D.length > 0) {
                        const farmUa7d = farmUa7D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa7d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa7d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa7d(farmUa7d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_1':
            try {
                const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                if (farmUa14D && farmUa14D.length > 0) {
                    const farmUa14d = farmUa14D[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < farmUa14d.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, farmUa14d.price);

                    // Удаляем авторег из базы данных
                    await removeFarmUa14d(farmUa14d.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_farm_ua_14d_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_14d_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const farmUa14D = await getAvailableFarmUa14D(); // Получаем доступные автореги для пользователя
                    if (farmUa14D && farmUa14D.length > 0) {
                        const farmUa14d = farmUa14D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa14d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa14d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa14d(farmUa14d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_1':
            try {
                const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                if (farmUa30D && farmUa30D.length > 0) {
                    const farmUa30d = farmUa30D[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < farmUa30d.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, farmUa30d.price);

                    // Удаляем авторег из базы данных
                    await removeFarmUa30d(farmUa30d.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_farm_ua_30d_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_farm_ua_30d_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const farmUa30D = await getAvailableFarmUa30D(); // Получаем доступные автореги для пользователя
                    if (farmUa30D && farmUa30D.length > 0) {
                        const farmUa30d = farmUa30D[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < farmUa30d.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, farmUa30d.price);

                        // Удаляем авторег из базы данных
                        await removeFarmUa30d(farmUa30d.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_1':
            try {
                const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                if (instaBm && instaBm.length > 0) {
                    const instaBM = instaBm[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < instaBM.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, instaBM.price);

                    // Удаляем авторег из базы данных
                    await removeInstaBm(instaBM.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableInstaBm(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_insta_bm_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const instaBm = await getAvailableInstaBm(); // Получаем доступные автореги для пользователя
                    if (instaBm && instaBm.length > 0) {
                        const instaBM = instaBm[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBM.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBM.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBm(instaBM.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBm(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_1':
            try {
                const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                if (instaBmFp && instaBmFp.length > 0) {
                    const instaBMFP = instaBmFp[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < instaBMFP.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, instaBMFP.price);

                    // Удаляем авторег из базы данных
                    await removeInstaBmFp(instaBMFP.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_insta_bm_fp_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_4':
            for (let i = 0; i < 2; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const instaBmFp = await getAvailableInstaBmFp(); // Получаем доступные автореги для пользователя
                    if (instaBmFp && instaBmFp.length > 0) {
                        const instaBMFP = instaBmFp[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFP.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFP.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFp(instaBMFP.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_1':
            try {
                const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                if (instaBmFpRk && instaBmFpRk.length > 0) {
                    const instaBMFPRK = instaBmFpRk[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < instaBMFPRK.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, instaBMFPRK.price);

                    // Удаляем авторег из базы данных
                    await removeInstaBmFpRk(instaBMFPRK.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_insta_bm_fp_rk_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_insta_bm_fp_rk_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const instaBmFpRk = await getAvailableInstaBmFpRk(); // Получаем доступные автореги для пользователя
                    if (instaBmFpRk && instaBmFpRk.length > 0) {
                        const instaBMFPRK = instaBmFpRk[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < instaBMFPRK.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, instaBMFPRK.price);

                        // Удаляем авторег из базы данных
                        await removeInstaBmFpRk(instaBMFPRK.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_1':
            try {
                const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                if (pbPrivat && pbPrivat.length > 0) {
                    const pbPrivats = pbPrivat[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < pbPrivats.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, pbPrivats.price);

                    // Удаляем авторег из базы данных
                    await removePbPrivat(pbPrivats.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_privat_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_privat_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const pbPrivat = await getAvailablePbPrivat(); // Получаем доступные автореги для пользователя
                    if (pbPrivat && pbPrivat.length > 0) {
                        const pbPrivats = pbPrivat[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbPrivats.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbPrivats.price);

                        // Удаляем авторег из базы данных
                        await removePbPrivat(pbPrivats.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_1':
            try {
                const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                if (pbMono && pbMono.length > 0) {
                    const pbMonos = pbMono[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < pbMonos.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, pbMonos.price);

                    // Удаляем авторег из базы данных
                    await removePbMono(pbMonos.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbMono(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_mono_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_mono_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const pbMono = await getAvailablePbMono(); // Получаем доступные автореги для пользователя
                    if (pbMono && pbMono.length > 0) {
                        const pbMonos = pbMono[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbMonos.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbMonos.price);

                        // Удаляем авторег из базы данных
                        await removePbMono(pbMonos.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbMono(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_1':
            try {
                const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                if (pbAbank && pbAbank.length > 0) {
                    const pbAbanks = pbAbank[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < pbAbanks.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, pbAbanks.price);

                    // Удаляем авторег из базы данных
                    await removePbAbank(pbAbanks.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbAbank(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_abank_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_abank_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const pbAbank = await getAvailablePbAbank(); // Получаем доступные автореги для пользователя
                    if (pbAbank && pbAbank.length > 0) {
                        const pbAbanks = pbAbank[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbAbanks.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbAbanks.price);

                        // Удаляем авторег из базы данных
                        await removePbAbank(pbAbanks.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbAbank(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_1':
            try {
                const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                if (pbSens && pbSens.length > 0) {
                    const pbSenss = pbSens[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < pbSenss.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, pbSenss.price);

                    // Удаляем авторег из базы данных
                    await removePbSens(pbSenss.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbSens(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    await bot.sendMessage(chatId, 'Товара нет в наличии');

                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_sens_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_sens_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const pbSens = await getAvailablePbSens(); // Получаем доступные автореги для пользователя
                    if (pbSens && pbSens.length > 0) {
                        const pbSenss = pbSens[0];

                        // Проверяем, достаточно ли средств на балансе
                        const user = await getUserById(userId);
                        if (user.balance < pbSenss.price) {
                            await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                            return;
                        }

                        // Списываем с баланса пользователя цену авторега
                        await deductBalance(userId, pbSenss.price);

                        // Удаляем авторег из базы данных
                        await removePbSens(pbSenss.id);

                        // Отправляем пользователю сообщение об успешной покупке
                        const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}\nВаш баланс: ${await getBalance(userId)}$`;
                        await bot.sendMessage(chatId, successMessage);

                        // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                        const updatedFarmUa30D = await getAvailablePbSens(userId);
                    } else {
                        // Обработка ошибки, если не удалось получить информацию об автореге
                        await bot.sendMessage(chatId, 'Товара нет в наличии');

                        console.error('Ошибка при получении информации об автореге.');
                    }
                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_1':
            try {
                const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                const proxyVodafones = proxyVodafone[0];
                const proxyPriceVodafone = proxyVodafones.price || 40

                console.log(proxyPriceVodafone)
                // Проверяем, достаточно ли средств на балансе
                const user = await getUserById(userId);
                if (user.balance < proxyPriceVodafone) {
                    await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                    return;
                }

                // Списываем с баланса пользователя цену авторега
                await deductBalance(userId, proxyPriceVodafone);

                // Удаляем авторег из базы данных
                await removeProxyVodafone(proxyVodafones.id);

                // Отправляем пользователю сообщение об успешной покупке
                const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                await bot.sendMessage(chatId, successMessage);

                // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_vodafone_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40


                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40


                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40


                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);


                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40


                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40


                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_vodafone_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const proxyVodafone = await getAvailableProxyVodafone(); // Получаем доступные автореги для пользователя
                    const proxyVodafones = proxyVodafone[0];
                    const proxyPriceVodafone = proxyVodafones.price || 40


                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceVodafone) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceVodafone);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_1':
            try {
                const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                const proxyLifes = proxyLife[0];
                const proxyPriceLife = proxyLifes.price || 40

                // Проверяем, достаточно ли средств на балансе
                const user = await getUserById(userId);
                if (user.balance < proxyPriceLife) {
                    await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                    return;
                }

                // Списываем с баланса пользователя цену авторега
                await deductBalance(userId, proxyPriceLife);

                // Удаляем авторег из базы данных
                await removeProxyLife(proxyLifes.id);

                // Отправляем пользователю сообщение об успешной покупке
                const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                await bot.sendMessage(chatId, successMessage);

                // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                const updatedFarmUa30D = await getAvailableProxyLife(userId);

            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_life_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_life_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const proxyLife = await getAvailableProxyLife(); // Получаем доступные автореги для пользователя

                    const proxyLifes = proxyLife[0];
                    const proxyPriceLife = proxyLifes.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceLife) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceLife);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_1':
            try {
                const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                const proxyKyivstars = proxyKyivstar[0];
                const proxyPriceKyivstar = proxyKyivstars.price || 40

                // Проверяем, достаточно ли средств на балансе
                const user = await getUserById(userId);
                if (user.balance < proxyPriceKyivstar) {
                    await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                    return;
                }

                // Списываем с баланса пользователя цену авторега
                await deductBalance(userId, proxyPriceKyivstar);

                // Удаляем авторег из базы данных
                await removeProxyKyivstar(proxyKyivstars.id);

                // Отправляем пользователю сообщение об успешной покупке
                const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                await bot.sendMessage(chatId, successMessage);

                // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_kyivstar_2':
            for (let i = 0; i < 2; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_3':
            for (let i = 0; i < 3; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_4':
            for (let i = 0; i < 4; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_5':
            for (let i = 0; i < 5; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_6':
            for (let i = 0; i < 6; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_7':
            for (let i = 0; i < 7; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_8':
            for (let i = 0; i < 8; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;
        case 'confirm_kyivstar_9':
            for (let i = 0; i < 9; i++) {
                try {
                    const proxyKyivstar = await getAvailableProxyKyivstar(); // Получаем доступные автореги для пользователя
                    const proxyKyivstars = proxyKyivstar[0];
                    const proxyPriceKyivstar = proxyKyivstars.price || 40

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyPriceKyivstar) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyPriceKyivstar);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Отправьте этот скриншот саппорту @r0yal13\nВаш баланс: ${await getBalance(userId)}$`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);

                } catch (error) {
                    console.error('Произошла ошибка при подтверждении покупки:', error);
                    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
                }
            }
            break;

        default:
            break;
    }
});
// 
