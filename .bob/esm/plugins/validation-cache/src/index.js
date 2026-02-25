import { introspectionFromSchema, print } from 'graphql';
import { LRUCache } from 'lru-cache';
import objectHash from 'object-hash';
import { getDocumentString } from '@envelop/core';
const DEFAULT_MAX = 1000;
const DEFAULT_TTL = 3600000;
const schemaHashCache = new WeakMap();
function getSchemaHash(schema) {
    let hash = schemaHashCache.get(schema);
    if (hash) {
        return hash;
    }
    const introspection = introspectionFromSchema(schema);
    hash = String(objectHash(introspection.__schema));
    schemaHashCache.set(schema, hash);
    return hash;
}
export const useValidationCache = (pluginOptions = {}) => {
    const resultCache = typeof pluginOptions.cache !== 'undefined'
        ? pluginOptions.cache
        : new LRUCache({
            max: DEFAULT_MAX,
            ttl: DEFAULT_TTL,
        });
    return {
        onValidate({ params, setValidationFn, validateFn }) {
            // We use setValidateFn over accessing params.rules directly, as other plugins in the chain might add more rules.
            // This would cause an issue if we are constructing the cache key here already.
            setValidationFn((...args) => {
                const schemaHashKey = getSchemaHash(args[0]);
                let ruleKey = '';
                if (Array.isArray(args[2])) {
                    // Note: We could also order them... but that might be too much
                    for (const rule of args[2]) {
                        ruleKey = ruleKey + rule.name;
                    }
                }
                const key = schemaHashKey + `|` + ruleKey + `|` + getDocumentString(params.documentAST, print);
                const cachedResult = resultCache.get(key);
                if (cachedResult !== undefined) {
                    return cachedResult;
                }
                const result = validateFn(...args);
                resultCache.set(key, result);
                return result;
            });
        },
    };
};
