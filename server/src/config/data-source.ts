import { DataSource } from "typeorm"
import { Message } from "../entities/Message"
import { Interaction } from "../entities/Interaction"
import { User } from "../entities/User"
import { Room } from "../entities/Room"
import { GhostProfile } from "../entities/GhostProfile"
import { UserMemory } from "../entities/UserMemory"
import { GhostRelationship } from "../entities/GhostRelationship"
import { SentimentAnalysis } from "../entities/SentimentAnalysis"
// Environment variables are loaded centrally via `src/config/env.ts`.
// Do not call dotenv.config() here to avoid ordering issues.

// Log the actual environment variables being used
console.log('Environment variables loaded:', {
    DB_HOST: process.env.DB_HOST ? '***' : 'Not set',
    DB_PORT: process.env.DB_PORT ? '***' : 'Not set',
    DB_USERNAME: process.env.DB_USERNAME ? '***' : 'Not set',
    DB_NAME: process.env.DB_NAME ? '***' : 'Not set',
    DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'Not set'
});

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in the environment variables.");
}
const parsedUrl = new URL(databaseUrl);

export const AppDataSource = new DataSource({
    type: "postgres",
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port || "5432"),
    username: parsedUrl.username,
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.slice(1),
    synchronize: false,
    logging: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [
        Message,
        Interaction,
        User,
        Room,
        GhostProfile,
        UserMemory,
        GhostRelationship,
        SentimentAnalysis
    ],
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
