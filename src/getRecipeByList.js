import { query } from "../config.js";

export async function getRecipeById(listType, identifier, index = 1) {
  // 1) Получаем ID списка и JSON-массив рецептов
  const listRows = await query(
    `SELECT 
       id       AS listId,
       recipes
     FROM recipes_list
     WHERE type = ?
       AND ${listType === 'category' ? 'list_name = ?' : 'user_id = ?'}`,
    [listType, identifier]
  );

  if (listRows.length === 0) {
    throw new Error(`List ${listType} ${identifier} not found`);
  }

  const { listId, recipes: recipesJson } = listRows[0];
  const recipesArray = JSON.parse(recipesJson);
  const totalRecipes = recipesArray.length;
  const recipeId = recipesArray[index - 1];

  if (!recipeId) {
    throw new Error(`List does not have recipe at index ${index}`);
  }

  // 2) Запрос за данными рецепта, включая его ID
  const recipeRows = await query(
    `SELECT
       r.id               AS id,
       r.name,
       r.description,
       r.base_link        AS link,
       COUNT(rt.id)       AS reviews_count,
       ROUND(AVG(rt.rating), 2) AS average_rating
     FROM recipe r
     LEFT JOIN rating rt
       ON rt.recipe_id = r.id
      AND rt.hidden = 0
     WHERE r.id = ?
     GROUP BY r.id`,
    [recipeId]
  );

  if (recipeRows.length === 0) {
    throw new Error(`Recipe with id=${recipeId} not found`);
  }

  // 3) Формируем и возвращаем объект с listId, recipeId и остальными полями
  return {
    listId,              // ID списка (recipes_list.id)
    recipeId,            // ID рецепта из массива
    ...recipeRows[0],    // здесь уже есть поле `id` (alias из SELECT), name, description и т. д.
    totalRecipes         // общее количество рецептов в списке
  };
}
