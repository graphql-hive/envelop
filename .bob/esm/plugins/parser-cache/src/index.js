import { Source } from 'graphql';
import { LRUCache } from 'lru-cache';
const DEFAULT_MAX = 1000;
const DEFAULT_TTL = 3600000;
export const useParserCache = (pluginOptions = {}) => {
    const documentCache = typeof pluginOptions.documentCache !== 'undefined'
        ? pluginOptions.documentCache
        : new LRUCache({ max: DEFAULT_MAX, ttl: DEFAULT_TTL });
    const errorCache = typeof pluginOptions.errorCache !== 'undefined'
        ? pluginOptions.errorCache
        : new LRUCache({ max: DEFAULT_MAX, ttl: DEFAULT_TTL });
    return {
        onParse({ params, setParsedDocument }) {
            const { source } = params;
            const key = source instanceof Source ? source.body : source;
            const cachedError = errorCache.get(key);
            if (cachedError !== undefined) {
                throw cachedError;
            }
            const cachedDocument = documentCache.get(key);
            if (cachedDocument !== undefined) {
                setParsedDocument(cachedDocument);
            }
            return ({ result }) => {
                if (result instanceof Error) {
                    errorCache.set(key, result);
                }
                else if (result !== null) {
                    documentCache.set(key, result);
                }
            };
        },
    };
};
