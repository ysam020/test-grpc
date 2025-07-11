const serverless = require('serverless-http');
const express = require('express');
require('dotenv').config();

const rootRouter = require('./src/routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
    return res.status(200).json({
        message: 'Hello from root!',
    });
});

app.use('/api', rootRouter);

app.use((error, req, res, next) => {
    return res.status(500).json({
        error: error.message,
    });
});

module.exports.handler = serverless(app);
