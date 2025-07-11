const express = require('express');
const { healthCheck } = require('./app');
const { syncDB } = require('./sync');
const { dump } = require('./dump');

const rootRouter = express.Router();

rootRouter.get('/health', healthCheck);

rootRouter.get('/sync', syncDB);

rootRouter.get('/dump', dump);

module.exports = rootRouter;
