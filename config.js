import 'dotenv/config';

const config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'sommelier_bot',
    },
    api: {
        telegram_token: process.env.TELEGRAM_TOKEN || null,
    }
}

export default config;