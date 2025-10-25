import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server directory (explicit path so tools/IDE runs work)
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  console.warn('Warning: failed to load .env file at', envPath, result.error);
} else {
  console.log('Loaded environment from', envPath);
}

// Export nothing; importing this module ensures env vars are loaded early.
export default result;
