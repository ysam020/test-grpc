import express from 'express';
import cors from 'cors';
import { apiRequestLogger, logger } from '@atc/logger';
import { rootRouter } from './routes';

const app = express();

const PORT = Number(process.env.API_GATEWAY_SERVICE_PORT) || 50051;

app.use(cors());
app.use(express.json());

app.use(apiRequestLogger);

app.use('/api/v1', rootRouter);

app.get('/health', (req: any, res: any) => {
    return res.send('healthy');
});

app.use((error: any, req: any, res: any, next: any) => {
    logger.error(error);
    const message = error.message || 'Internal Server Error';

    return res.status(500).json({ message });
});

process.on('uncaughtException', (error: any) => {
    logger.error(error);
});

process.on('unhandledRejection', (error: any) => {
    logger.error(error);
});

app.listen(PORT, () => {
    logger.info('Listening on port ' + PORT);
});
