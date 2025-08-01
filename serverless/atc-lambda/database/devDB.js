const { Pool } = require('pg');

let pool;

exports.getDevDBConnection = async () => {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DEV_DATABASE_URL,
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        });
        pool.on('error', (err) => {
            console.error('Dev DB connection error', err);
        });
    }
    return pool;
};
