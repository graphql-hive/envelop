"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useValidationCache = void 0;
const tslib_1 = require("tslib");
const graphql_1 = require("graphql");
const lru_cache_1 = require("lru-cache");
const object_hash_1 = tslib_1.__importDefault(require("object-hash"));
const core_1 = require("@envelop/core");
const DEFAULT_MAX = 1000;
const DEFAULT_TTL = 3600000;
const schemaHashCache = new WeakMap();
function getSchemaHash(schema) {
    let hash = schemaHashCache.get(schema);
    if (hash) {
        return hash;
    }
    const introspection = (0, graphql_1.introspectionFromSchema)(schema);
    hash = String((0, object_hash_1.default)(introspection.__schema));
    schemaHashCache.set(schema, hash);
    return hash;
}
const useValidationCache = (pluginOptions = {}) => {
    const resultCache = typeof pluginOptions.cache !== 'undefined'
        ? pluginOptions.cache
        : new lru_cache_1.LRUCache({
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
                const key = schemaHashKey + `|` + ruleKey + `|` + (0, core_1.getDocumentString)(params.documentAST, graphql_1.print);
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
exports.useValidationCache = useValidationCache;
