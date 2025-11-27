import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });


async function addEnhancedUrlColumn() {
    const { db } = await import('../src/lib/db');
    const { sql } = await import('drizzle-orm');

    console.log('🔄 Adding enhanced_url column to photos table...');

    try {
        // Add the enhanced_url column
        await db.execute(sql`
      ALTER TABLE photos 
      ADD COLUMN IF NOT EXISTS enhanced_url TEXT
    `);

        console.log('✅ Column enhanced_url added successfully!');
        console.log('');
        console.log('✨ Database migration complete!');
        console.log('You can now refresh your profile page to see enhancements.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding column:', error);
        process.exit(1);
    }
}

addEnhancedUrlColumn();
