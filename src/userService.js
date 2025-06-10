import { query } from "../config.js";
import crypto from "crypto";

/**
 * Получить пользователя по социальному ID и типу
 * @param {string|number} socialId 
 * @param {'vk'|'tg'} socialType 
 * @returns {Promise<null|Object>}
 */
export async function getUserBySocial(socialId, socialType) {
  const rows = await query(
    `SELECT * 
       FROM user 
      WHERE social_id = ? 
        AND social_type = ?`,
    [socialId, socialType]
  );
  return rows[0] || null;
}

/**
 * Создать нового пользователя
 * @param {{socialId: string|number, username: string, socialType: 'vk'|'tg', language: string}} data 
 * @returns {Promise<Object>} — вставленная запись (с полем insertId)
 */
export async function createUser({ userId, username, socialType, language, age }) {
  // Токен
  const salt = crypto.randomBytes(16).toString("hex");
  const payload = Date.now().toString() + salt;
  const token = crypto.createHash("sha256").update(payload).digest("hex");

  const result = await query(
    `INSERT INTO user
       (social_id, username, social_type, language, age_confirmed, token)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, username, socialType, language, age, token]
  );
  return { id: result.insertId, socialId: userId, username, socialType, language, age };
}

/**
 * Установить подписку на рецепты
 * @param {number} userId — внутренний ID пользователя (поле id)
 * @param {0|1} flag — 1 = подписан(а), 0 = отписан(а)
 * @returns {Promise<boolean>} — true, если затронута хотя бы одна запись
 */
export async function setSubscribedRecipe(userId, flag) {
  const result = await query(
    `UPDATE user
        SET subscribed_recipe = ?
      WHERE social_id = ?`,
    [flag, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Добавить 30 дней к дате подписки
 * @param {number} userId — внутренний ID пользователя (поле id)
 * @returns {Promise<boolean>} — true, если затронута хотя бы одна запись
 */
export async function extendSubscriptionBy30Days(userId) {
  const result = await query(
    `UPDATE user
        SET subscription_date = DATE_ADD(subscription_date, INTERVAL 30 DAY)
      WHERE social_id = ?`,
    [userId]
  );
  return result.affectedRows > 0;
}

/**
 * Создать новую транзакцию (статус по умолчанию — pending)
 * @param {Object} data
 * @param {number} data.userId            — внутренний ID пользователя (поле user.id)
 * @param {'telegram_star'|'admin_subscribed'} data.type
 * @param {string|number} data.amount     — сумма операции (decimal(14,2))
 * @param {string} [data.description]     — описание
 * @returns {Promise<Object>}             — вставленная запись с полем insertId
 */
export async function createTransaction({ userId, type, amount, description = null }) {
  const result = await query(
    `INSERT INTO \`transactions\`
       (user_id, transaction_type, amount, description, status)
     VALUES (?, ?, ?, ?, "completed")`,
    [userId, type, amount, description]
  );
  return {
    id: result.insertId,
    userId,
    transaction_type: type,
    amount,
    description,
    transaction_date: new Date(), // ориентировочно
    status: 'completed'
  };
}

/**
 * Вспомогательная: получить или создать запись списка избранного пользователя
 */
async function ensureUserRecipeList(userId, listName = 'UserList') {
  let rows = await query(
    `SELECT id, recipes
       FROM recipes_list
      WHERE type = 'user'
        AND user_id = ?`,
    [userId]
  );
  if (rows.length === 0) {
    await query(
      `INSERT INTO recipes_list
         (type, user_id, list_name, recipes)
       VALUES ('user', ?, ?, '[]')`,
      [userId, listName]
    );
    rows = await query(
      `SELECT id, recipes
         FROM recipes_list
        WHERE type = 'user'
          AND user_id = ?`,
      [userId]
    );
  }
  return rows[0];
}

/**
 * Получить список избранных рецептов пользователя
 */
export async function getUserFavoriteRecipes(userId) {
  const record = await ensureUserRecipeList(userId);
  try {
    const favs = JSON.parse(record.recipes);
    // Приводим все элементы к числам
    return favs.map(id => Number(id));
  } catch {
    return [];
  }
}

/**
 * Проверить, является ли рецепт избранным
 */
export async function isRecipeFavorite(userId, recipeId) {
  const idNum = Number(recipeId);
  const favs = await getUserFavoriteRecipes(userId);
  return favs.includes(idNum);
}

/**
 * Добавить рецепт в избранное
 */
export async function addRecipeToFavorites(userId, recipeId) {
  const recId = Number(recipeId);
  const record = await ensureUserRecipeList(userId);
  let favs;
  try {
    favs = JSON.parse(record.recipes);
  } catch {
    favs = [];
  }
  // Приводим старые значения к числам и удаляем дубликаты
  const favsNum = Array.from(new Set(favs.map(id => Number(id))));

  if (!favsNum.includes(recId)) {
    favsNum.push(recId);
    await query(
      `UPDATE recipes_list
          SET recipes = ?, last_update_date = CURRENT_TIMESTAMP()
        WHERE id = ?`,
      [JSON.stringify(favsNum), record.id]
    );
  }
  return favsNum;
}

/**
 * Удалить рецепт из избранного
 */
export async function removeRecipeFromFavorites(userId, recipeId) {
  const recId = Number(recipeId);
  const record = await ensureUserRecipeList(userId);
  let favs;
  try {
    favs = JSON.parse(record.recipes);
  } catch {
    favs = [];
  }
  const filtered = favs
    .map(id => Number(id))
    .filter(id => id !== recId);

  await query(
    `UPDATE recipes_list
        SET recipes = ?, last_update_date = CURRENT_TIMESTAMP()
      WHERE id = ?`,
    [JSON.stringify(filtered), record.id]
  );
  return filtered;
}

