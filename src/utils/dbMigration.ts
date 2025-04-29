import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

/**
 * Utility to run SQL migrations using Supabase service key
 */
export const runMigration = async (migrationFileName: string): Promise<void> => {
  try {
    const migrationPath = path.join(__dirname, '../migrations', migrationFileName);
    
    if (!fs.existsSync(migrationPath)) {
      logger.error(`Migration file not found: ${migrationPath}`);
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    logger.info(`Running migration: ${migrationFileName}`);

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement separately
    for (const statement of statements) {
      logger.info(`Executing SQL statement: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabaseAdmin.from('_dummy_query')
        .select()
        .limit(0)
        .execute(`/* ${statement} */`);
      
      if (error) {
        logger.error(`SQL execution error: ${error.message}`, error);
        throw error;
      }
    }
    
    logger.info(`Migration completed successfully: ${migrationFileName}`);
  } catch (error) {
    logger.error(`Failed to run migration ${migrationFileName}:`, error);
    throw error;
  }
};

// Command line script to run a specific migration
if (require.main === module) {
  const migrationFileName = process.argv[2];
  
  if (!migrationFileName) {
    console.error('Please specify a migration file name');
    process.exit(1);
  }
  
  runMigration(migrationFileName)
    .then(() => {
      console.log(`Migration ${migrationFileName} completed successfully`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 