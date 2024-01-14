require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const TronWeb = require('tronweb');
const token = process.env.TOKEN;
const adminUserIds = process.env.ADMIN.split(',');
const bot = new TelegramBot(token, { polling: true });
const db = new sqlite3.Database('mydatabase.db');
const userStates = {}
const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io', });// Замените на свой узел Tron
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
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
// farmUA
db.run(`
    CREATE TABLE IF NOT EXISTS farm_ua_links7d (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS farm_ua_links14d (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS farm_ua_links30d (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
// insta
db.run(`
    CREATE TABLE IF NOT EXISTS insta_bm (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS insta_bm_fp (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS insta_bm_fp_rk (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
// pb
db.run(`
    CREATE TABLE IF NOT EXISTS pb_privat (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS pb_mono (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS pb_abank (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS pb_sens (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
// proxy
db.run(`
    CREATE TABLE IF NOT EXISTS proxy_vodafone (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS proxy_life (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        link TEXT,
        price INTEGER
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS proxy_kyivstar (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
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
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (adminUserIds.includes(userId.toString())) {
        const commands = `
\nПополнить счёт пользователя - /add_funds 
\nДобавить авторег -  /add_auto_reg
\nДобавить Farm UA 7дней - /add_farm_ua_7d
\nДобавить Farm UA 14дней - /add_farm_ua_14d
\nДобавить Farm UA 30дней - /add_farm_ua_30d
\nДобавить Insta BM - /add_insta_fp
\nДобавить Insta BM + FP - /add_insta_rk
\nДобавить Insta BM + FP + RK - /add_insta_bm
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

    if (adminUserIds.includes(userId.toString())) {
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
function makePurchase(userId) {
    db.run("UPDATE users SET totalPurchases = totalPurchases + 1 WHERE id = ?", [userId]);
}
async function notifyUser(userId, amount) {
    // Используйте ваш механизм отправки уведомлений, например, Telegram Bot API
    const chatId = await getChatId(userId);
    const notificationText = `Ваш баланс пополнен на ${amount}. Новый баланс: ${await getBalance(userId)}`;
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
                makePurchase(userId)
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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену авторега:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addAutoRegLink(userId, link, price);

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
// 
bot.onText(/\/add_farm_ua_7d/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Farm UA 7d:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addFarmUaLink7D(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Farm UA 14d:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addFarmUaLink14D(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Farm UA 30d:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addFarmUaLink30D(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену InstaBm:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addInstaBmLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену InstaBmFp:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addInstaBmFpLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену InstaBmFpRk:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addInstaBmFpRkLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Privat:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addPbPrivatLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Mono:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addPbMonoLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Abank:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addPbAbankLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену PB Sens:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addPbSensLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Proxy Vodafone:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addProxyVodafoneLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Proxy Life:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addProxyLifeLink(userId, link, price);

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
    if (adminUserIds.includes(userId.toString())) {


        try {
            const priceMessage = await bot.sendMessage(chatId, 'Введите цену Proxy Kyivstar:');

            bot.once('text', async (msg) => {
                const price = parseFloat(msg.text);

                if (isNaN(price)) {
                    await bot.sendMessage(chatId, 'Некорректная цена. Пожалуйста, введите числовое значение.');
                    return;
                }

                const linkMessage = await bot.sendMessage(chatId, 'Введите ссылку на Google Диск:');

                bot.once('text', async (msg) => {
                    const link = msg.text;
                    await addProxyKyivstarLink(userId, link, price);

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
async function getAvailableAutoRegs(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM auto_reg_links WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function addAutoRegLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в auto_reg_links
        db.run("INSERT INTO auto_reg_links (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addFarmUaLink7D(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO farm_ua_links7d (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addFarmUaLink14D(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO farm_ua_links14d (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addFarmUaLink30D(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO farm_ua_links30d (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addInstaBmLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO insta_bm (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addInstaBmFpLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO insta_bm_fp (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addInstaBmFpRkLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO insta_bm_fp_rk (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addPbPrivatLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_privat (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addPbMonoLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_mono (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addPbAbankLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_abank (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addPbSensLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO pb_sens (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addProxyVodafoneLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO proxy_vodafone (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addProxyLifeLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO proxy_life (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function addProxyKyivstarLink(userId, link, price) {
    return new Promise((resolve, reject) => {
        // Вставляем новую запись в farm_ua_links7d
        db.run("INSERT INTO proxy_kyivstar (user_id, link, price) VALUES (?, ?, ?)", [userId, link, price], function (err) {
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
async function getAvailableFarmUa7D(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM farm_ua_links7d WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableFarmUa14D(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM farm_ua_links14d WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableFarmUa30D(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM farm_ua_links30d WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableInstaBm(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM insta_bm WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableInstaBmFp(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM insta_bm_fp WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableInstaBmFpRk(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM insta_bm_fp_rk WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbPrivat(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_privat WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbMono(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_mono WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbAbank(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_abank WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailablePbSens(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pb_sens WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableProxyVodafone(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM proxy_vodafone WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableProxyLife(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM proxy_life WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
async function getAvailableProxyKyivstar(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM proxy_kyivstar WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списка доступных авторегов:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
// 
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

            }
            break;
        case 'auto_reg_ua':
            try {
                const autoRegs = await getAvailableAutoRegs(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(autoRegs.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const autoRegUaText = 'Авторег UA';
                const autoRegUaKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Авторег UA + FP | Цена: ${price || 10} | Кол-во: ${autoRegs.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `auto_reg_ua_fp`
                        }]),
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
                const instaBms = await getAvailableInstaBm(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(instaBms.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const instaBmText = 'Insta BM';
                const instaBmKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Insta BM | Цена: ${price || 10} | Кол-во: ${instaBms.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `insta_bm_info`
                        }]),
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
                const instaBmsFp = await getAvailableInstaBmFp(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(instaBmsFp.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const instaBmFpText = 'Insta BM + FP';
                const instaBmFpKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Insta BM + FP | Цена: ${price || 10} | Кол-во: ${instaBmsFp.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `insta_bm_fp_info`
                        }]),
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
                const instaBmsFpRk = await getAvailableInstaBmFpRk(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(instaBmsFpRk.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const instaBmFpRkText = 'Insta BM + FP + PK';
                const instaBmFpRkKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Insta BM + FP + PK | Цена: ${price || 10} | Кол-во: ${instaBmsFpRk.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `insta_bm_fp_rk_info`
                        }]),
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
                const privats = await getAvailablePbPrivat(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(privats.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const privatText = 'Приват';
                const privatKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Приват bin | Цена: ${price || 10} | Кол-во: ${privats.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `privat_info`
                        }]),
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
                const mono = await getAvailablePbMono(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(mono.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const monoText = 'Монобанк';
                const monoKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Монобанк bin | Цена: ${price || 10} | Кол-во: ${mono.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `mono_info`
                        }]),
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
                const abank = await getAvailablePbAbank(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(abank.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const abankText = 'А-банк';
                const abankKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `А-банк bin | Цена: ${price || 10} | Кол-во: ${abank.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `a_bank_info`
                        }]),
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
                const sens = await getAvailablePbSens(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(sens.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const sensText = 'Сенс';
                const sensKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `Сенс bin | Цена: ${price || 10} | Кол-во: ${sens.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `sens_info`
                        }]),
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
                const vodafone = await getAvailableProxyVodafone(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(vodafone.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const vodafoneText = 'Vodafone';
                const vodafoneKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `30 дней | Цена: ${price || 10} | Кол-во: ${vodafone.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `vodafone_info`
                        }]),
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
                const life = await getAvailableProxyLife(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(life.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const lifeText = 'Life';
                const lifeKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `30 дней | Цена: ${price || 10} | Кол-во: ${life.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `life_info`
                        }]),
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
                const kyivstar = await getAvailableProxyKyivstar(userId); // Получаем доступные автореги для пользователя

                // Используем объект Set для хранения уникальных цен
                const uniquePrices = new Set(kyivstar.map(autoReg => autoReg.price));

                // Формируем клавиатуру с уникальными ценами
                const kyivstarText = 'Kyivstar';
                const kyivstarKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices).map(price => [{
                            text: `30 дней | Цена: ${price || 10} | Кол-во: ${kyivstar.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `kyivstar_info`
                        }]),
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
                    [{ text: 'Мой профиль', callback_data: 'my_profile' }],
                    [{ text: 'Купить', callback_data: 'buy' }],
                    [{ text: 'Пополнить баланс', callback_data: 'add_funds' }],
                    [{ text: 'Поддержка', callback_data: 'support' },
                    { text: 'Правила', callback_data: 'rules' }],
                ],
            };
            if (bot.editMessageText && bot.editMessageReplyMarkup) {
                if (currentState && currentState.messageId) {
                    bot.editMessageText(mainText, { chat_id: chatId, message_id: currentState.messageId });
                    bot.editMessageReplyMarkup(mainKeyboard, { chat_id: chatId, message_id: currentState.messageId });
                } else {
                    const sentRulesMessage = await bot.sendMessage(chatId, mainText, {
                        parse_mode: 'Markdown',
                        reply_markup: rulesKeyboard,
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

            }
            break;
        case 'farm_ua':
            try {
                const farmUa7D = await getAvailableFarmUa7D(userId); // Получаем доступные автореги для пользователя
                const farmUa14D = await getAvailableFarmUa14D(userId); // Получаем доступные автореги для пользователя
                const farmUa30D = await getAvailableFarmUa30D(userId); // Получаем доступные автореги для пользователя
                console.log(farmUa7D)
                console.log(farmUa14D)
                console.log(farmUa30D)
                // Используем объект Set для хранения уникальных цен
                const uniquePrices7D = new Set(farmUa7D.map(farmUa => farmUa.price));
                const uniquePrices14D = new Set(farmUa14D.map(farmUa => farmUa.price));
                const uniquePrices30D = new Set(farmUa30D.map(farmUa => farmUa.price));

                // Формируем клавиатуру с уникальными ценами
                const manualFText = "Фарм UA"
                const farmUaKeyboard = {
                    inline_keyboard: [
                        ...Array.from(uniquePrices7D).map(price => [{
                            text: `UA фарм 7 дней | Цена: ${price || "ошибка"} | Кол-во: ${farmUa7D.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `ua_farm_7_days`
                        }]),
                        ...Array.from(uniquePrices14D).map(price => [{
                            text: `UA фарм 14 дней | Цена: ${price || "ошибка"} | Кол-во: ${farmUa14D.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `ua_farm_14_days`
                        }]),
                        ...Array.from(uniquePrices30D).map(price => [{
                            text: `UA фарм 30 дней | Цена: ${price || "ошибка"} | Кол-во: ${farmUa30D.filter(reg => reg.price === price).length || 0}`,
                            callback_data: `ua_farm_30_days`
                        }]),
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

            }
            break;
        case 'binance_id':
            const inputBinanceMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');

            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputBinanceMessage.message_id);

                const enteredAmount = parseFloat(msg.text);
                const copyBinance = `<code>391483018</code>`;

                if (!isNaN(enteredAmount)) {
                    const fundsBinanceText = `Вы можете произвести оплату ${enteredAmount}$ по Binance\n${copyBinance}\nДля подтверждения платежа обязательно пришлите скрин оплаты.`;
                    await bot.sendMessage(chatId, fundsBinanceText, { parse_mode: 'HTML' });

                    // Ожидание фото
                    bot.once('photo', async (photo) => {
                        const photoInfo = photo.photo[0];
                        const adminId = 717989011; // Замените на актуальный идентификатор админа
                        if (photoInfo && photoInfo.file_id) {
                            await bot.sendPhoto(adminId, photoInfo.file_id, { caption: `Фото платежа на сумму ${enteredAmount}\nID: ${userId}` });
                        } else {
                            console.error('Ошибка: Фото не содержит информацию о файле.');
                        }
                    });
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное число в $.');
                }
            });
            break;
        case 'crypto':
            const inputCryptoMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');
            // Ожидание текстового сообщения
            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputCryptoMessage.message_id);

                const enteredAmount = parseFloat(msg.text);
                const copyTron = `<code>TSgbGfsYGvCPNG7StbapVaNP727vrXBig9</code>`;

                if (!isNaN(enteredAmount)) {
                    const fundsCryptoText = `Вы можете произвести оплату ${enteredAmount}$ по Crypto\n${copyTron}\nДля подтверждения платежа обязательно пришлите скрин оплаты.`;
                    await bot.sendMessage(chatId, fundsCryptoText, { parse_mode: 'HTML' });

                    // Ожидание фото
                    bot.once('photo', async (photo) => {
                        const photoInfo = photo.photo[0]
                        const adminId = 717989011; // Замените на актуальный идентификатор админа
                        if (photoInfo && photoInfo.file_id) {
                            await bot.sendPhoto(adminId, photoInfo.file_id, { caption: `Фото платежа на сумму ${enteredAmount}\nID: ${userId}` });
                        } else {
                            console.error('Ошибка: Фото не содержит информацию о файле.');
                        }
                    });
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное число в $.');
                }
            });
            break;
        case 'ua_card':
            const inputUACardsMessage = await bot.sendMessage(chatId, 'Введите сумму в $:');

            bot.once('text', async (msg) => {
                await bot.deleteMessage(chatId, inputUACardsMessage.message_id);

                const enteredAmount = parseFloat(msg.text);
                const copyCard = `<code>4028082011730940</code>`;

                if (!isNaN(enteredAmount)) {
                    const fundsUACardsText = `Вы можете произвести оплату ${enteredAmount}$ по украинской карте\n${copyCard}\nДля подтверждения платежа обязательно пришлите скрин оплаты.`;
                    await bot.sendMessage(chatId, fundsUACardsText, { parse_mode: 'HTML' });

                    // Ожидание фото
                    bot.once('photo', async (photo) => {
                        const photoInfo = photo.photo[0];
                        const adminId = 717989011; // Замените на актуальный идентификатор админа
                        if (photoInfo && photoInfo.file_id) {
                            await bot.sendPhoto(adminId, photoInfo.file_id, { caption: `Фото платежа на сумму ${enteredAmount}\nID: ${userId}` });
                        } else {
                            console.error('Ошибка: Фото не содержит информацию о файле.');
                        }
                    });
                } else {
                    await bot.sendMessage(chatId, 'Пожалуйста, введите корректное число в $.');
                }
            });
            break;
        case 'ua_farm_7_days':
            const farmUa7D = await getAvailableFarmUa7D(userId); // Получаем доступные автореги для пользователя

            if (farmUa7D.length > 0) {
                const farmUa7DPrice = farmUa7D[0].price;
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
\n**ЦЕНА:** ${farmUa7DPrice}
\n**ОСТАТОК:** ${farmUa7D.length - 1 || 0}
            `;
                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_farm_ua_7d`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, uaFarm7Message, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'ua_farm_14_days':
            const farmUa14D = await getAvailableFarmUa14D(userId); // Получаем доступные автореги для пользователя

            if (farmUa14D.length > 0) {
                const farmUa14DPrice = farmUa14D[0].price;
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
\n**ЦЕНА:** ${farmUa14DPrice}
\n**ОСТАТОК:** ${farmUa14D.length - 1 || 0}
            `;
                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_farm_ua_14d`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, uaFarm14Message, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'ua_farm_30_days':
            const farmUa30D = await getAvailableFarmUa30D(userId); // Получаем доступные автореги для пользователя

            if (farmUa30D.length > 0) {
                const farmUa30DPrice = farmUa30D[0].price;
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
\n**ЦЕНА:** ${farmUa30DPrice}
\n**ОСТАТОК:** ${farmUa30D.length - 1 || 0}
            `;
                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_farm_ua_30d`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, uaFarm30Message, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'auto_reg_ua_fp':
            const autoRegs = await getAvailableAutoRegs(userId); // Получаем доступные автореги для пользователя

            if (autoRegs.length > 0) {
                const firstAutoRegPrice = autoRegs[0].price;
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
                        \n**ЦЕНА:** ${firstAutoRegPrice}
                        \n**ОСТАТОК:** ${autoRegs.length - 1 || 0}
                    `;

                const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_purchase`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, autoRegUaFpMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }
            break;
        case 'insta_bm_info':
            const instaBm = await getAvailableInstaBm(userId); // Получаем доступные автореги для пользователя

            if (instaBm.length > 0) {
                const instaBmPrice = instaBm[0].price;
                const instaBmMessage = `
\n*--- Insta BM ---*
\n**Описание:**
\nБизнес менеджер Facebook (БМ ФБ) Лимит 50$ Без РК и ФП.
\nВ комплекте идёт ссылка для приёма бизнес менеджера.
\nСрок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${instaBmPrice}
\n**ОСТАТОК:**  ${instaBm.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_insta_bm`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, instaBmMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'insta_bm_fp_info':
            const instaBmFp = await getAvailableInstaBmFp(userId); // Получаем доступные автореги для пользователя

            if (instaBmFp.length > 0) {
                const instaBmFpPrice = instaBmFp[0].price;
                const instaBmFpMessage = `
\n*--- Insta BM & FP ---*
\n**Описание:**
\nБизнес менеджер Facebook (БМ ФБ) Лимит 50$ Без ФП.
\nВ комплекте идёт ссылка для приёма бизнес менеджера.
\nСрок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${instaBmFpPrice}
\n**ОСТАТОК:**  ${instaBmFp.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_insta_bm_fp`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, instaBmFpMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'insta_bm_fp_rk_info':
            const instaBmFpRk = await getAvailableInstaBmFpRk(userId); // Получаем доступные автореги для пользователя

            if (instaBmFpRk.length > 0) {
                const instaBmFpRkPrice = instaBmFpRk[0].price;
                const instaBmFpRkMessage = `
\n*--- Insta BM & FP & PK ---*
\n**Описание:**
\nБизнес менеджер Facebook (БМ ФБ) Лимит 50$.
\nВ комплекте идёт ссылка для приёма бизнес менеджера.
\nСрок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${instaBmFpRkPrice}
\n**ОСТАТОК:**  ${instaBmFpRk.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_insta_bm_fp_rk`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, instaBmFpRkMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'privat_info':
            const pbPrivat = await getAvailablePbPrivat(userId); // Получаем доступные автореги для пользователя

            if (pbPrivat.length > 0) {
                const pbPrivatPrice = pbPrivat[0].price;
                const pbPrivatMessage = `
\n*--- Приват bin ---*
\n**Описание:**
\nКарта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${pbPrivatPrice}
\n**ОСТАТОК:**  ${pbPrivat.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_privat`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbPrivatMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'monobank_info':
            const pbMono = await getAvailablePbMono(userId); // Получаем доступные автореги для пользователя

            if (pbMono.length > 0) {
                const pbMonoPrice = pbMono[0].price;
                const pbMonoMessage = `
\n*--- Моно bin ---*
\n**Описание:**
\nКарта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${pbMonoPrice}
\n**ОСТАТОК:**  ${pbMono.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_mono`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbMonoMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'a_bank_info':
            const pbAbank = await getAvailablePbAbank(userId); // Получаем доступные автореги для пользователя

            if (pbAbank.length > 0) {
                const pbAbankPrice = pbAbank[0].price;
                const pbAbankMessage = `
\n*--- А-банк bin ---*
\n**Описание:**
\nКарта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${pbAbankPrice}
\n**ОСТАТОК:**  ${pbAbank.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_abank`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbAbankMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'sens_info':
            const pbSens = await getAvailablePbSens(userId); // Получаем доступные автореги для пользователя

            if (pbSens.length > 0) {
                const pbSensPrice = pbSens[0].price;
                const pbSensMessage = `
\n*--- Сенс bin ---*
\n**Описание:**
\nКарта для первобила, без баланса. В комплекте идёт номер карты, срок действия, свв. Срок действия с момента покупки 24 часа (!!!)
\n**ЦЕНА:** ${pbSensPrice}
\n**ОСТАТОК:**  ${pbSens.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_sens`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, pbSensMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'vodafone_info':
            const proxyVodafone = await getAvailableProxyVodafone(userId); // Получаем доступные автореги для пользователя

            if (proxyVodafone.length > 0) {
                const proxyVodafonePrice = proxyVodafone[0].price;
                const proxyVodafoneMessage = `
\n*--- Proxy 30 дней ---*
\n**Описание:**
\n- Socks5/HTTP одновременно работающие протоколы
\n- Смена IP по ссылке
\n- 1 прокси = 1 руки
\n**В комплекте:**
\nIP/Port/Log/Pass + информация
\n**ЦЕНА:** ${proxyVodafonePrice}
\n**ОСТАТОК:**  ${proxyVodafone.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_vodafone`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, proxyVodafoneMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'life_info':
            const proxyLife = await getAvailableProxyLife(userId); // Получаем доступные автореги для пользователя

            if (proxyLife.length > 0) {
                const proxyLifePrice = proxyLife[0].price;
                const proxyLifeMessage = `
\n*--- Proxy 30 дней ---*
\n**Описание:**
\n- Socks5/HTTP одновременно работающие протоколы
\n- Смена IP по ссылке
\n- 1 прокси = 1 руки
\n**В комплекте:**
\nIP/Port/Log/Pass + информация
\n**ЦЕНА:** ${proxyLifePrice}
\n**ОСТАТОК:**  ${proxyLife.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_life`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, proxyLifeMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'kyivstar_info':
            const proxyKyivstar = await getAvailableProxyKyivstar(userId); // Получаем доступные автореги для пользователя

            if (proxyKyivstar.length > 0) {
                const proxyKyivstarPrice = proxyKyivstar[0].price;
                const proxyKyivstarMessage = `
\n*--- Proxy 30 дней ---*
\n**Описание:**
\n- Socks5/HTTP одновременно работающие протоколы
\n- Смена IP по ссылке
\n- 1 прокси = 1 руки
\n**В комплекте:**
\nIP/Port/Log/Pass + информация
\n**ЦЕНА:** ${proxyKyivstarPrice}
\n**ОСТАТОК:**  ${proxyKyivstar.length - 1 || 0}
            `; const confirmPurchaseKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: 'Подтвердить покупку',
                                callback_data: `confirm_kyivstar`
                            }
                        ]
                    ]
                };

                // Отправляем сообщение с описанием и кнопкой подтверждения
                await bot.sendMessage(chatId, proxyKyivstarMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: confirmPurchaseKeyboard
                });
            } else {
                // Обработка ошибки, если не удалось получить информацию об автореге
                console.error('Ошибка при получении информации об автореге.');
            }

            break;
        case 'confirm_purchase':
            try {
                const autoRegs = await getAvailableAutoRegs(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${autoReg.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedAutoReg = await getAvailableAutoRegs(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_farm_ua_7d':
            try {
                const farmUa7D = await getAvailableFarmUa7D(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa7d.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa7D = await getAvailableFarmUa7D(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_farm_ua_14d':
            try {
                const farmUa14D = await getAvailableFarmUa14D(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa14d.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa14D = await getAvailableFarmUa14D(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_farm_ua_30d':
            try {
                const farmUa30D = await getAvailableFarmUa30D(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${farmUa30d.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableFarmUa30D(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_insta_bm':
            try {
                const instaBm = await getAvailableInstaBm(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBM.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableInstaBm(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_insta_bm_fp':
            try {
                const instaBmFp = await getAvailableInstaBmFp(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFP.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableInstaBmFp(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_insta_bm_fp_rk':
            try {
                const instaBmFpRk = await getAvailableInstaBmFpRk(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${instaBMFPRK.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableInstaBmFpRk(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_privat':
            try {
                const pbPrivat = await getAvailablePbPrivat(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbPrivats.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbPrivat(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_mono':
            try {
                const pbMono = await getAvailablePbMono(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbMonos.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbMono(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_abank':
            try {
                const pbAbank = await getAvailablePbAbank(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbAbanks.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbAbank(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_sens':
            try {
                const pbSens = await getAvailablePbSens(userId); // Получаем доступные автореги для пользователя
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
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${pbSenss.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailablePbSens(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_vodafone':
            try {
                const proxyVodafone = await getAvailableProxyKyivstar(userId); // Получаем доступные автореги для пользователя
                if (proxyVodafone && proxyVodafone.length > 0) {
                    const proxyVodafones = proxyVodafone[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyVodafones.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyVodafones.price);

                    // Удаляем авторег из базы данных
                    await removeProxyVodafone(proxyVodafones.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${proxyVodafones.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyVodafone(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_life':
            try {
                const proxyLife = await getAvailableProxyLife(userId); // Получаем доступные автореги для пользователя
                if (proxyLife && proxyLife.length > 0) {
                    const proxyLifes = proxyLife[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyLifes.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyLifes.price);

                    // Удаляем авторег из базы данных
                    await removeProxyLife(proxyLifes.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${proxyLifes.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyLife(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;
        case 'confirm_kyivstar':
            try {
                const proxyKyivstar = await getAvailableProxyKyivstar(userId); // Получаем доступные автореги для пользователя
                if (proxyKyivstar && proxyKyivstar.length > 0) {
                    const proxyKyivstars = proxyKyivstar[0];

                    // Проверяем, достаточно ли средств на балансе
                    const user = await getUserById(userId);
                    if (user.balance < proxyKyivstars.price) {
                        await bot.sendMessage(chatId, 'Недостаточно средств на балансе. Пополните баланс для продолжения.');
                        return;
                    }

                    // Списываем с баланса пользователя цену авторега
                    await deductBalance(userId, proxyKyivstars.price);

                    // Удаляем авторег из базы данных
                    await removeProxyKyivstar(proxyKyivstars.id);

                    // Отправляем пользователю сообщение об успешной покупке
                    const successMessage = `Вы успешно приобрели товар! Ссылка: ${proxyKyivstars.link}`;
                    await bot.sendMessage(chatId, successMessage);

                    // Возможно, здесь вы захотите обновить информацию об авторегах после покупки
                    const updatedFarmUa30D = await getAvailableProxyKyivstar(userId);
                } else {
                    // Обработка ошибки, если не удалось получить информацию об автореге
                    console.error('Ошибка при получении информации об автореге.');
                }
            } catch (error) {
                console.error('Произошла ошибка при подтверждении покупки:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
            }
            break;


        default:
            // Обработка других действий
            break;
    }
});

