import { DatabaseManager } from './database';
import { PostgresDatabaseManager } from './postgres-database';

// Export the same interface types
export * from './database';

// Database factory to switch between implementations
export function createDatabaseManager(config?: {
  type: 'memory' | 'postgres';
  databaseUrl?: string;
}): DatabaseManager | PostgresDatabaseManager {
  
  // If no config provided or type is memory, use in-memory database
  if (!config || config.type === 'memory') {
    console.log('🧠 Using in-memory database');
    return new DatabaseManager();
  }
  
  // If PostgreSQL is requested
  if (config.type === 'postgres' && config.databaseUrl) {
    console.log('🐘 Using PostgreSQL database:', config.databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown');
    return new PostgresDatabaseManager(config.databaseUrl);
  }
  
  // Fallback to in-memory
  console.warn('⚠️  Invalid database config, falling back to in-memory database');
  return new DatabaseManager();
}
