import 'dotenv/config';
import mysql from 'mysql';
import { promisify } from 'util';

export const config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'sommelier',
    },
    api: {
        telegram_token: process.env.TELEGRAM_TOKEN || null,
    },
    admins: [
        1913008131,
        1863964682
    ],
    onlyAdmin: true
}

export const connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
});

export const query = promisify(connection.query).bind(connection);

export default config;