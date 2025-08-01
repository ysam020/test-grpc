import { elasticConfig } from './config';

const createSingleTonElasticClient = () => {
    return elasticConfig;
};

declare const globalThis: {
    elasticClient: ReturnType<typeof createSingleTonElasticClient>;
} & typeof global;

if (process.env.NODE_ENV !== 'production') {
    globalThis.elasticClient = createSingleTonElasticClient();
}

const elasticClient =
    globalThis.elasticClient ?? createSingleTonElasticClient();

export { elasticClient };
