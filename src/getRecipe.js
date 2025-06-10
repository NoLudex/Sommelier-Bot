import { connection } from "../config";

export async function getRecipe(category, id) {
    const query = `SELECT * FROM recipe_${category}`;

    return new Promise((resolve, reject) => {
        connection.query(query, (err, sqlResult) => {
            if (err) {
                reject(err);
            } else {
                const result = sqlResult.map(item => ({
                    name: item.name,
                    desc: item.desc,
                    link: item.link
                }));
                
                resolve(result[id]);
            }
        })
    })
}