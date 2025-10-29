// Ensure environment variables are loaded (same loader used by app)
import '../config/env'
import { AppDataSource } from '../config/data-source'

async function run() {
  try {
    console.log('Initializing DataSource...')
    await AppDataSource.initialize()
    console.log('DataSource initialized')

    // If migrations are defined, run them. Otherwise fall back to synchronize().
    if (AppDataSource.migrations && AppDataSource.migrations.length > 0) {
      console.log('Running pending migrations...')
      await AppDataSource.runMigrations()
      console.log('Migrations applied')
    } else {
      console.log('No migrations found — running synchronize() to update schema (development only)')
      await AppDataSource.synchronize()
      console.log('Database schema synchronized')
    }

    await AppDataSource.destroy()
    console.log('Done')
    process.exit(0)
  } catch (err) {
    console.error('Migration error:', err)
    try { await AppDataSource.destroy() } catch {}
    process.exit(1)
  }
}

run()
