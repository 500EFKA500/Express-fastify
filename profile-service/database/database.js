import pg from "pg";

const { Pool } = pg;

let pool;

function normalizeEnvValue(value) {
    return value?.trim().replace(/^['"]|['"]$/g, "");
}

export async function initDb() {
    if (pool) {
        return pool;
    }

    const connectionString = normalizeEnvValue(process.env.DATABASE_URL);

    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    const useSsl = !/localhost|127\.0\.0\.1/.test(connectionString);

    pool = new Pool({
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
    });

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            login TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS profiles(
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL DEFAULT '',
            bio TEXT NOT NULL DEFAULT '',
            birth_date DATE
        )
    `);

    return pool;
}

export function getDb() {
    if (!pool) {
        throw new Error("Database pool is not initialized");
    }

    return pool;
}
