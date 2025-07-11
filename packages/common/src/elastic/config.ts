import { Client } from '@elastic/elasticsearch';
export type SearchResponse = Awaited<ReturnType<Client['search']>>;

const elasticConfig = new Client({
    node: process.env.ELASTIC_SEARCH_HOST,
});

export { elasticConfig };
