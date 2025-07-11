import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { join } from 'node:path';

import { logger } from '@atc/logger';

const { DATABASE_URL } = process.env;

const pgClient = new Client({
    connectionString: DATABASE_URL,
    ...(!DATABASE_URL?.includes('localhost') && {
        ssl: {
            rejectUnauthorized: false,
        },
    }),
});

async function seed() {
    try {
        const seedDataSql = await readFile(
            join(__dirname, '../sql/seed-data.sql'),
            'utf-8',
        );

        await pgClient.connect();
        logger.info('Connected to database');

        await pgClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        logger.info('Extension added');

        await pgClient.query(seedDataSql);
        logger.info('Seed data inserted');

        await db_trigger_functions();
        logger.info('Database trigger and function created');

        await pgClient.end();
        logger.info('Disconnected from database');
    } catch (error: Error | any) {
        logger.error(error.message);
    }
}

async function db_trigger_functions() {
    try {
        // First drop the existing trigger if it exists
        await pgClient.query(`
            DROP TRIGGER IF EXISTS categoryname_before_insert_or_update ON public."Category";
        `);

        // Then drop the existing function if it exists
        await pgClient.query(`
            DROP FUNCTION IF EXISTS public.capitalize_and_trim_categoryname();
        `);

        await pgClient.query(`
            CREATE OR REPLACE FUNCTION public.capitalize_and_trim_categoryname()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $function$
            BEGIN
                NEW."category_name" := INITCAP(TRIM(NEW."category_name"));
                RETURN NEW;
            END;
            $function$;
        `);

        await pgClient.query(`
            CREATE TRIGGER categoryname_before_insert_or_update 
            BEFORE INSERT OR UPDATE ON public."Category"
            FOR EACH ROW EXECUTE FUNCTION capitalize_and_trim_categoryname();
        `);
    } catch (error) {
        console.error('Error setting up the database trigger:', error);
    }
}

seed();
