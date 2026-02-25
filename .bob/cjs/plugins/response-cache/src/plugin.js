"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheControlDirective = exports.defaultShouldCacheResult = exports.defaultBuildResponseCacheKey = void 0;
exports.defaultGetDocumentString = defaultGetDocumentString;
exports.useResponseCache = useResponseCache;
exports.resultWithMetadata = resultWithMetadata;
const tslib_1 = require("tslib");
const fast_json_stable_stringify_1 = tslib_1.__importDefault(require("fast-json-stable-stringify"));
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const hash_sha256_js_1 = require("./hash-sha256.js");
const in_memory_cache_js_1 = require("./in-memory-cache.js");
/**
 * Default function used for building the response cache key.
 * It is exported here for advanced use-cases. E.g. if you want to short circuit and serve responses from the cache on a global level in order to completely by-pass the GraphQL flow.
 */
const defaultBuildResponseCacheKey = (params) => (0, hash_sha256_js_1.hashSHA256)([
    params.documentString,
    params.operationName ?? '',
    (0, fast_json_stable_stringify_1.default)(params.variableValues ?? {}),
    params.sessionId ?? '',
].join('|'));
exports.defaultBuildResponseCacheKey = defaultBuildResponseCacheKey;
/**
 * Default function used to check if the result should be cached.
 *
 * It is exported here for advanced use-cases. E.g. if you want to choose if
 * results with certain error types should be cached.
 *
 * By default, results with errors (unexpected, EnvelopError, or GraphQLError) are not cached.
 */
const defaultShouldCacheResult = (params) => {
    if (params.result.errors) {
        // eslint-disable-next-line no-console
        console.warn('[useResponseCache] Failed to cache due to errors');
        return false;
    }
    return true;
};
exports.defaultShouldCacheResult = defaultShouldCacheResult;
function defaultGetDocumentString(executionArgs) {
    return (0, core_1.getDocumentString)(executionArgs.document, graphql_1.print);
}
const getDocumentWithMetadataAndTTL = (0, utils_1.memoize4)(function addTypeNameToDocument(document, { invalidateViaMutation, ttlPerSchemaCoordinate, }, schema, idFieldByTypeName) {
    const typeInfo = new graphql_1.TypeInfo(schema);
    let ttl;
    const visitor = {
        OperationDefinition: {
            enter(node) {
                if (!invalidateViaMutation && node.operation === 'mutation') {
                    return false;
                }
                if (node.operation === 'subscription') {
                    return false;
                }
            },
        },
        ...(ttlPerSchemaCoordinate != null && {
            Field(fieldNode) {
                const parentType = typeInfo.getParentType();
                if (parentType) {
                    const schemaCoordinate = `${parentType.name}.${fieldNode.name.value}`;
                    const maybeTtl = ttlPerSchemaCoordinate[schemaCoordinate];
                    ttl = calculateTtl(maybeTtl, ttl);
                }
            },
        }),
        SelectionSet(node, _key) {
            const parentType = typeInfo.getParentType();
            const idField = parentType && idFieldByTypeName.get(parentType.name);
            const hasTypeNameSelection = node.selections.some(selection => selection.kind === graphql_1.Kind.FIELD &&
                selection.name.value === '__typename' &&
                !selection.alias);
            const selections = [...node.selections];
            if (!hasTypeNameSelection) {
                selections.push({
                    kind: graphql_1.Kind.FIELD,
                    name: { kind: graphql_1.Kind.NAME, value: '__typename' },
                    alias: { kind: graphql_1.Kind.NAME, value: '__responseCacheTypeName' },
                });
            }
            if (idField) {
                const hasIdFieldSelected = node.selections.some(selection => selection.kind === graphql_1.Kind.FIELD && selection.name.value === idField && !selection.alias);
                if (!hasIdFieldSelected) {
                    selections.push({
                        kind: graphql_1.Kind.FIELD,
                        name: { kind: graphql_1.Kind.NAME, value: idField },
                        alias: { kind: graphql_1.Kind.NAME, value: '__responseCacheId' },
                    });
                }
            }
            return { ...node, selections };
        },
    };
    return [(0, graphql_1.visit)(document, (0, graphql_1.visitWithTypeInfo)(typeInfo, visitor)), ttl];
});
function useResponseCache({ cache = (0, in_memory_cache_js_1.createInMemoryCache)(), ttl: globalTtl = Infinity, session, enabled, ignoredTypes = [], ttlPerType, ttlPerSchemaCoordinate = {}, scopePerSchemaCoordinate = {}, idFields = ['id'], invalidateViaMutation = true, buildResponseCacheKey = exports.defaultBuildResponseCacheKey, getDocumentString = defaultGetDocumentString, shouldCacheResult = exports.defaultShouldCacheResult, onTtl, includeExtensionMetadata = typeof process !== 'undefined'
    ? // eslint-disable-next-line dot-notation
        process.env['NODE_ENV'] === 'development' || !!process.env['DEBUG']
    : false, }) {
    const cacheFactory = typeof cache === 'function' ? (0, utils_1.memoize1)(cache) : () => cache;
    const ignoredTypesMap = new Set(ignoredTypes);
    const typePerSchemaCoordinateMap = new Map();
    enabled = enabled ? (0, utils_1.memoize1)(enabled) : enabled;
    // never cache Introspections
    ttlPerSchemaCoordinate = { 'Query.__schema': 0, ...ttlPerSchemaCoordinate };
    if (ttlPerType) {
        // eslint-disable-next-line no-console
        console.warn('[useResponseCache] `ttlForType` is deprecated. To migrate, merge it with `ttlForSchemaCoordinate` option');
        for (const [typeName, ttl] of Object.entries(ttlPerType)) {
            ttlPerSchemaCoordinate[typeName] = ttl;
        }
    }
    const documentMetadataOptions = {
        queries: { invalidateViaMutation, ttlPerSchemaCoordinate },
        mutations: { invalidateViaMutation }, // remove ttlPerSchemaCoordinate for mutations to skip TTL calculation
    };
    const idFieldByTypeName = new Map();
    let schema;
    function isPrivate(typeName, data) {
        if (scopePerSchemaCoordinate[typeName] === 'PRIVATE') {
            return true;
        }
        return Object.keys(data).some(fieldName => scopePerSchemaCoordinate[`${typeName}.${fieldName}`] === 'PRIVATE');
    }
    return {
        onSchemaChange({ schema: newSchema }) {
            if (schema === newSchema) {
                return;
            }
            schema = newSchema;
            const directive = schema.getDirective('cacheControl');
            (0, utils_1.mapSchema)(schema, {
                ...(directive && {
                    [utils_1.MapperKind.COMPOSITE_TYPE]: type => {
                        const cacheControlAnnotations = (0, utils_1.getDirective)(schema, type, 'cacheControl');
                        cacheControlAnnotations?.forEach(cacheControl => {
                            if (cacheControl.maxAge != null) {
                                ttlPerSchemaCoordinate[type.name] = cacheControl.maxAge * 1000;
                            }
                            if (cacheControl.scope) {
                                scopePerSchemaCoordinate[type.name] = cacheControl.scope;
                            }
                        });
                        return type;
                    },
                }),
                [utils_1.MapperKind.FIELD]: (fieldConfig, fieldName, typeName) => {
                    const schemaCoordinates = `${typeName}.${fieldName}`;
                    const resultTypeNames = unwrapTypenames(fieldConfig.type);
                    typePerSchemaCoordinateMap.set(schemaCoordinates, resultTypeNames);
                    if (idFields.includes(fieldName) && !idFieldByTypeName.has(typeName)) {
                        idFieldByTypeName.set(typeName, fieldName);
                    }
                    if (directive) {
                        const cacheControlAnnotations = (0, utils_1.getDirective)(schema, fieldConfig, 'cacheControl');
                        cacheControlAnnotations?.forEach(cacheControl => {
                            if (cacheControl.maxAge != null) {
                                ttlPerSchemaCoordinate[schemaCoordinates] = cacheControl.maxAge * 1000;
                            }
                            if (cacheControl.scope) {
                                scopePerSchemaCoordinate[schemaCoordinates] = cacheControl.scope;
                            }
                        });
                    }
                    return fieldConfig;
                },
            });
        },
        onExecute(onExecuteParams) {
            if (enabled && !enabled(onExecuteParams.args.contextValue)) {
                return;
            }
            const identifier = new Map();
            const types = new Set();
            let currentTtl;
            let skip = false;
            const sessionId = session(onExecuteParams.args.contextValue);
            function setExecutor({ execute, onExecuteDone, }) {
                let executed = false;
                onExecuteParams.setExecuteFn(args => {
                    executed = true;
                    return execute(args);
                });
                return {
                    onExecuteDone(params) {
                        if (!executed) {
                            // eslint-disable-next-line no-console
                            console.warn('[useResponseCache] The cached execute function was not called, another plugin might have overwritten it. Please check your plugin order.');
                        }
                        return onExecuteDone?.(params);
                    },
                };
            }
            function onEntity(entity, data) {
                if (skip) {
                    return;
                }
                if (ignoredTypesMap.has(entity.typename) ||
                    (!sessionId && isPrivate(entity.typename, data))) {
                    skip = true;
                    return;
                }
                // in case the entity has no id, we attempt to extract it from the data
                if (!entity.id) {
                    const idField = idFieldByTypeName.get(entity.typename);
                    if (idField) {
                        entity.id = data[idField];
                    }
                }
                types.add(entity.typename);
                if (entity.typename in ttlPerSchemaCoordinate) {
                    const maybeTtl = ttlPerSchemaCoordinate[entity.typename];
                    currentTtl = calculateTtl(maybeTtl, currentTtl);
                }
                if (entity.id != null) {
                    identifier.set(`${entity.typename}:${entity.id}`, entity);
                }
                for (const fieldName in data) {
                    const fieldData = data[fieldName];
                    if (fieldData == null || (Array.isArray(fieldData) && fieldData.length === 0)) {
                        const inferredTypes = typePerSchemaCoordinateMap.get(`${entity.typename}.${fieldName}`);
                        inferredTypes?.forEach(inferredType => {
                            if (inferredType in ttlPerSchemaCoordinate) {
                                const maybeTtl = ttlPerSchemaCoordinate[inferredType];
                                currentTtl = calculateTtl(maybeTtl, currentTtl);
                            }
                            identifier.set(inferredType, { typename: inferredType });
                        });
                    }
                }
            }
            function invalidateCache(result, setResult) {
                let changed = false;
                if (result.data) {
                    result = { ...result };
                    result.data = removeMetadataFieldsFromResult(result.data, onEntity);
                    changed = true;
                }
                const cacheInstance = cacheFactory(onExecuteParams.args.contextValue);
                if (cacheInstance == null) {
                    // eslint-disable-next-line no-console
                    console.warn('[useResponseCache] Cache instance is not available for the context. Skipping invalidation.');
                    return;
                }
                if (identifier.size > 0) {
                    cacheInstance.invalidate(identifier.values());
                    if (includeExtensionMetadata) {
                        return setResult(resultWithMetadata(result, {
                            invalidatedEntities: Array.from(identifier.values()),
                        }));
                    }
                }
                if (changed) {
                    setResult(result);
                }
            }
            if (invalidateViaMutation !== false) {
                const operationAST = (0, graphql_1.getOperationAST)(onExecuteParams.args.document, onExecuteParams.args.operationName);
                if (operationAST?.operation === 'mutation') {
                    return setExecutor({
                        execute(args) {
                            const [document] = getDocumentWithMetadataAndTTL(args.document, documentMetadataOptions.mutations, args.schema, idFieldByTypeName);
                            return onExecuteParams.executeFn({ ...args, document });
                        },
                        onExecuteDone({ result, setResult }) {
                            if ((0, core_1.isAsyncIterable)(result)) {
                                return handleAsyncIterableResult(invalidateCache);
                            }
                            return invalidateCache(result, setResult);
                        },
                    });
                }
            }
            return (0, promise_helpers_1.handleMaybePromise)(() => buildResponseCacheKey({
                documentString: getDocumentString(onExecuteParams.args),
                variableValues: onExecuteParams.args.variableValues,
                operationName: onExecuteParams.args.operationName,
                sessionId,
                context: onExecuteParams.args.contextValue,
            }), cacheKey => {
                const cacheInstance = cacheFactory(onExecuteParams.args.contextValue);
                if (cacheInstance == null) {
                    // eslint-disable-next-line no-console
                    console.warn('[useResponseCache] Cache instance is not available for the context. Skipping cache lookup.');
                }
                return (0, promise_helpers_1.handleMaybePromise)(() => cacheInstance.get(cacheKey), cachedResponse => {
                    if (cachedResponse != null) {
                        return setExecutor({
                            execute: () => includeExtensionMetadata
                                ? resultWithMetadata(cachedResponse, { hit: true })
                                : cachedResponse,
                        });
                    }
                    function maybeCacheResult(result, setResult) {
                        if (result.data) {
                            result.data = removeMetadataFieldsFromResult(result.data, onEntity);
                        }
                        // we only use the global ttl if no currentTtl has been determined.
                        let finalTtl = currentTtl ?? globalTtl;
                        if (onTtl) {
                            finalTtl = onTtl({
                                ttl: finalTtl,
                                context: onExecuteParams.args.contextValue,
                            });
                        }
                        if (skip || !shouldCacheResult({ cacheKey, result }) || finalTtl === 0) {
                            if (includeExtensionMetadata) {
                                setResult(resultWithMetadata(result, { hit: false, didCache: false }));
                            }
                            return;
                        }
                        cacheInstance.set(cacheKey, result, identifier.values(), finalTtl);
                        if (includeExtensionMetadata) {
                            setResult(resultWithMetadata(result, { hit: false, didCache: true, ttl: finalTtl }));
                        }
                    }
                    return setExecutor({
                        execute(args) {
                            const [document, ttl] = getDocumentWithMetadataAndTTL(args.document, documentMetadataOptions.queries, schema, idFieldByTypeName);
                            currentTtl = ttl;
                            return onExecuteParams.executeFn({ ...args, document });
                        },
                        onExecuteDone({ result, setResult }) {
                            if ((0, core_1.isAsyncIterable)(result)) {
                                return handleAsyncIterableResult(maybeCacheResult);
                            }
                            return maybeCacheResult(result, setResult);
                        },
                    });
                });
            });
        },
    };
}
function handleAsyncIterableResult(handler) {
    // When the result is an AsyncIterable, it means the query is using @defer or @stream.
    // This means we have to build the final result by merging the incremental results.
    // The merged result is then used to know if we should cache it and to calculate the ttl.
    const result = {};
    return {
        onNext(payload) {
            // This is the first result with the initial data payload sent to the client. We use it as the base result
            if (payload.result.data) {
                result.data = payload.result.data;
            }
            if (payload.result.errors) {
                result.errors = payload.result.errors;
            }
            if (payload.result.extensions) {
                result.extensions = payload.result.extensions;
            }
            if ('hasNext' in payload.result) {
                const { incremental, hasNext } = payload.result;
                if (incremental) {
                    for (const patch of incremental) {
                        (0, utils_1.mergeIncrementalResult)({ executionResult: result, incrementalResult: patch });
                    }
                }
                if (!hasNext) {
                    // The query is complete, we can process the final result
                    handler(result, payload.setResult);
                }
            }
            const newResult = { ...payload.result };
            // Handle initial/single result
            if (newResult.data) {
                newResult.data = removeMetadataFieldsFromResult(newResult.data);
            }
            // Handle Incremental results
            if ('hasNext' in newResult && newResult.incremental) {
                newResult.incremental = newResult.incremental.map(value => {
                    if ('items' in value && value.items) {
                        return {
                            ...value,
                            items: removeMetadataFieldsFromResult(value.items),
                        };
                    }
                    if ('data' in value && value.data) {
                        return {
                            ...value,
                            data: removeMetadataFieldsFromResult(value.data),
                        };
                    }
                    return value;
                });
            }
            payload.setResult(newResult);
        },
    };
}
function resultWithMetadata(result, metadata) {
    return {
        ...result,
        extensions: {
            ...result.extensions,
            responseCache: {
                ...result.extensions?.responseCache,
                ...metadata,
            },
        },
    };
}
function calculateTtl(typeTtl, currentTtl) {
    if (typeof typeTtl === 'number' && !Number.isNaN(typeTtl)) {
        if (typeof currentTtl === 'number') {
            return Math.min(currentTtl, typeTtl);
        }
        return typeTtl;
    }
    return currentTtl;
}
function unwrapTypenames(ttype) {
    if ((0, graphql_1.isListType)(ttype) || (0, graphql_1.isNonNullType)(ttype)) {
        return unwrapTypenames(ttype.ofType);
    }
    if ((0, graphql_1.isUnionType)(ttype)) {
        return ttype
            .getTypes()
            .map(ttype => unwrapTypenames(ttype))
            .flat();
    }
    return [ttype.name];
}
exports.cacheControlDirective = `
  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }

  directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT
`;
function removeMetadataFieldsFromResult(data, onEntity) {
    if (Array.isArray(data)) {
        return data.map(record => removeMetadataFieldsFromResult(record, onEntity));
    }
    if (typeof data !== 'object' || data == null) {
        return data;
    }
    const dataPrototype = Object.getPrototypeOf(data);
    if (dataPrototype != null && dataPrototype !== Object.prototype) {
        return data;
    }
    // clone the data to avoid mutation
    data = { ...data };
    const typename = data.__responseCacheTypeName ?? data.__typename;
    if (typeof typename === 'string') {
        const entity = { typename };
        delete data.__responseCacheTypeName;
        if (data.__responseCacheId &&
            (typeof data.__responseCacheId === 'string' || typeof data.__responseCacheId === 'number')) {
            entity.id = data.__responseCacheId;
            delete data.__responseCacheId;
        }
        onEntity?.(entity, data);
    }
    for (const key in data) {
        const value = data[key];
        if (Array.isArray(value)) {
            data[key] = removeMetadataFieldsFromResult(value, onEntity);
        }
        if (value !== null && typeof value === 'object') {
            data[key] = removeMetadataFieldsFromResult(value, onEntity);
        }
    }
    return data;
}
