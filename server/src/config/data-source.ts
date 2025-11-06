import { DataSource } from "typeorm"
import { Message } from "../entities/Message"
import { Interaction } from "../entities/Interaction"
import { User } from "../entities/User"
import { Room } from "../entities/Room"
import { GhostProfile } from "../entities/GhostProfile"
// Environment variables are loaded centrally via `src/config/env.ts`.
// Do not call dotenv.config() here to avoid ordering issues.

// Log the database configuration (without sensitive data)
console.log('Database configuration:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    username: process.env.DB_USERNAME || 'postgres',
    database: process.env.DB_NAME || 'haunted_ai'
});

// Log the actual environment variables being used
console.log('Environment variables loaded:', {
    DB_HOST: process.env.DB_HOST ? '***' : 'Not set',
    DB_PORT: process.env.DB_PORT ? '***' : 'Not set',
    DB_USERNAME: process.env.DB_USERNAME ? '***' : 'Not set',
    DB_NAME: process.env.DB_NAME ? '***' : 'Not set',
    DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'Not set'
});

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    // Ensure password is a string; coerce if necessary. pg requires password to be a string.
    // Do not hard-code secrets here; rely on process.env (fall back to empty string).
    password: String(process.env.DB_PASSWORD || ""),
    database: process.env.DB_NAME || "haunted_ai",
    synchronize: false,
    logging: true,
    entities: [Message, Interaction, User, Room, GhostProfile],
    subscribers: [],
    migrations: [],
});

// Test the database connection when this module is imported
// Note: don't auto-initialize here. Initialization should be performed by the
// application startup code (for example, via `connectDB()` in `config/db.ts`).
// This keeps initialization idempotent and avoids multiple initialize() calls
// when the module is imported from multiple places.

// Exported `AppDataSource` is configured and ready; callers should call
// `AppDataSource.initialize()` once during app startup.
