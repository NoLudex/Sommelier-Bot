import OpenAI from "openai";
import { query } from "../config.js";
import { getRecipeById as getFromList } from "./getRecipeByList.js";
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import print from "./logger.js";

// Создаем SOCKS5 прокси агент с вашими учетными данными
// const proxyUrl = 'socks5://jJ2rtdYM:W6CPyHCs@213.139.195.56:63928';
// const proxyAgent = new HttpsProxyAgent('http://');

const proxyUrl   = 'http://jJ2rtdYM:W6CPyHCs@213.139.195.56:63928';
const proxyAgent = new HttpsProxyAgent(proxyUrl);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  fetch: (url, init = {}) => fetch(url, { 
    ...init, 
    agent: proxyAgent 
  })
});

export async function recommendCocktails(userId) {
  // 1) забираем JSON из recipes_list
  const rows = await query(
    `SELECT recipes
       FROM recipes_list
      WHERE type = 'user'
        AND user_id = ?`,
    [userId]
  );
  const recipeIds = rows[0] ? JSON.parse(rows[0].recipes) : [];
  print('Recipe ID: ' + recipeIds);

  // 2) для каждого id вызываем getFromList
  const namePromises = recipeIds.map((_, i) =>
    getFromList("user", userId, i + 1)
      .then(r => r.name)
      .catch(() => null)
  );
  const favoriteNames = (await Promise.all(namePromises)).filter(Boolean);
  print('Favorite Names: ' + favoriteNames);

  if (!favoriteNames.length) {
    return "У вас пока нет избранных рецептов — добавьте пару коктейлей в избранное, и я предложу похожие!";
  }

  const prompt = `
Here are the user's favorite cocktails: ${favoriteNames.join(", ")}.
Please recommend 3 new cocktails that would suit their taste. For each cocktail, provide:
- Name
- 4–5 main ingredients
- A one-sentence flavor description
Do not request any personal data, do not include preparation instructions or alcohol strength—only brief recommendations.
Write answer in Russian. Use default text without style.
`.trim();

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert cocktail sommelier." },
        { role: "user",   content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.8
    });

    const content = resp.choices[0].message.content.trim();
    print('Response: ' + content);
    return content;
  } catch (err) {
    print(`OpenAI error: ${err.message ?? JSON.stringify(err)}`);
    return '💔 Извините, не удалось получить рекомендации — попробуйте чуть позже.';
  }
}
