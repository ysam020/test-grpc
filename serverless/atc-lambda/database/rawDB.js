const { Pool } = require('pg');

let pool;

exports.getRawDBConnection = async () => {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.RAW_DATABASE_URL,
            ssl: {
                require: true,
                rejectUnauthorized: false,
            }
        });
        pool.on('error', (err) => {
            console.error('Raw DB connection error', err);
        });
    }
    return pool;
};
