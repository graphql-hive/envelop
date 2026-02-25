"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRateLimiter = exports.defaultInterpolateMessageFn = exports.DIRECTIVE_SDL = exports.Store = exports.RedisStore = exports.InMemoryStore = void 0;
const tslib_1 = require("tslib");
const types_1 = require("util/types");
const graphql_1 = require("graphql");
const picomatch_1 = tslib_1.__importDefault(require("picomatch"));
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const get_graphql_rate_limiter_js_1 = require("./get-graphql-rate-limiter.js");
const in_memory_store_js_1 = require("./in-memory-store.js");
Object.defineProperty(exports, "InMemoryStore", { enumerable: true, get: function () { return in_memory_store_js_1.InMemoryStore; } });
const redis_store_js_1 = require("./redis-store.js");
Object.defineProperty(exports, "RedisStore", { enumerable: true, get: function () { return redis_store_js_1.RedisStore; } });
const store_js_1 = require("./store.js");
Object.defineProperty(exports, "Store", { enumerable: true, get: function () { return store_js_1.Store; } });
exports.DIRECTIVE_SDL = `
  directive @rateLimit(
    max: Int
    window: String
    message: String
    identityArgs: [String]
    arrayLengthField: String
    readOnly: Boolean
    uncountRejected: Boolean
  ) on FIELD_DEFINITION
`;
const defaultInterpolateMessageFn = (message, identifier) => interpolateByArgs(message, { id: identifier });
exports.defaultInterpolateMessageFn = defaultInterpolateMessageFn;
const getTypeInfo = (0, utils_1.memoize1)(function getTypeInfo(schema) {
    return new graphql_1.TypeInfo(schema);
});
const useRateLimiter = (options) => {
    const rateLimiterFn = (0, get_graphql_rate_limiter_js_1.getGraphQLRateLimiter)({
        ...options,
        identifyContext: options.identifyFn,
    });
    const interpolateMessage = options.interpolateMessage || exports.defaultInterpolateMessageFn;
    const configByField = options.configByField?.map(config => ({
        ...config,
        isMatch: {
            type: (0, picomatch_1.default)(config.type),
            field: (0, picomatch_1.default)(config.field),
        },
    })) || [];
    const directiveName = options.rateLimitDirectiveName ?? 'rateLimit';
    const getRateLimitConfig = (0, utils_1.memoize4)(function getFieldConfigs(configByField, schema, type, field) {
        const fieldConfigs = configByField?.filter(({ isMatch }) => isMatch.type(type.name) && isMatch.field(field.name));
        if (fieldConfigs && fieldConfigs.length > 1) {
            throw new Error(`Config error: field '${type.name}.${field.name}' has multiple matching configuration`);
        }
        const fieldConfig = fieldConfigs?.[0];
        const rateLimitDirective = (0, utils_1.getDirectiveExtensions)(field, schema)[directiveName]?.[0];
        if (rateLimitDirective && fieldConfig) {
            throw new Error(`Config error: field '${type.name}.${field.name}' has both a configuration and a directive`);
        }
        const rateLimitConfig = rateLimitDirective || fieldConfig;
        if (!rateLimitConfig) {
            return undefined;
        }
        rateLimitConfig.max = Number(rateLimitConfig.max);
        if (rateLimitConfig?.identifyFn) {
            rateLimitConfig.identityArgs = ['identifier', ...(rateLimitConfig.identityArgs ?? [])];
        }
        return rateLimitConfig;
    });
    return {
        onExecute({ args, setResultAndStopExecution }) {
            const { document, schema, contextValue: context, variableValues, rootValue: root } = args;
            const typeInfo = getTypeInfo(schema);
            const rateLimitCalls = new Set();
            const errors = [];
            args.document = (0, graphql_1.visit)(document, (0, graphql_1.visitWithTypeInfo)(typeInfo, {
                Field(node, _key, _parent, path, _ancestors) {
                    const type = typeInfo.getParentType();
                    const field = typeInfo.getFieldDef();
                    if (type != null && field != null) {
                        const rateLimitConfig = getRateLimitConfig(configByField, schema, type, field);
                        if (!rateLimitConfig) {
                            return;
                        }
                        const resolverRateLimitConfig = { ...rateLimitConfig };
                        const identifier = (rateLimitConfig?.identifyFn ?? options.identifyFn)(context);
                        let args = null;
                        function getArgValues() {
                            if (!args) {
                                if (field) {
                                    args = (0, utils_1.getArgumentValues)(field, node, variableValues);
                                }
                            }
                            return args;
                        }
                        const executionArgs = {
                            identifier,
                            root,
                            get args() {
                                return {
                                    ...(getArgValues() || {}),
                                    identifier,
                                };
                            },
                            context,
                            type,
                            field,
                        };
                        if (resolverRateLimitConfig.message && identifier) {
                            resolverRateLimitConfig.message = interpolateMessage(resolverRateLimitConfig.message, identifier, executionArgs);
                        }
                        const rateLimitResult = (0, promise_helpers_1.handleMaybePromise)(() => rateLimiterFn(field.name, executionArgs, resolverRateLimitConfig), rateLimitError => {
                            if (!rateLimitError) {
                                return true;
                            }
                            if (options.onRateLimitError) {
                                options.onRateLimitError({
                                    error: rateLimitError,
                                    ...executionArgs,
                                });
                            }
                            if (options.transformError) {
                                throw options.transformError(rateLimitError);
                            }
                            const resolvePath = [];
                            let curr = document;
                            const operationAST = (0, utils_1.getOperationASTFromDocument)(document);
                            let currType = (0, utils_1.getDefinedRootType)(schema, operationAST.operation);
                            for (const pathItem of path) {
                                curr = curr[pathItem];
                                if (curr?.kind === 'Field') {
                                    const fieldName = curr.name.value;
                                    const responseKey = curr.alias?.value ?? fieldName;
                                    let field;
                                    if ((0, graphql_1.isObjectType)(currType)) {
                                        field = currType.getFields()[fieldName];
                                    }
                                    else if ((0, graphql_1.isAbstractType)(currType)) {
                                        for (const possibleType of schema.getPossibleTypes(currType)) {
                                            field = possibleType.getFields()[fieldName];
                                            if (field) {
                                                break;
                                            }
                                        }
                                    }
                                    if ((0, graphql_1.isListType)(field?.type)) {
                                        resolvePath.push('@');
                                    }
                                    resolvePath.push(responseKey);
                                    if (field?.type) {
                                        currType = (0, graphql_1.getNamedType)(field.type);
                                    }
                                }
                            }
                            const errorOptions = {
                                extensions: { http: { statusCode: 429 } },
                                path: resolvePath,
                                nodes: [node],
                            };
                            if (resolverRateLimitConfig.window) {
                                errorOptions.extensions.http.headers = {
                                    'Retry-After': resolverRateLimitConfig.window,
                                };
                            }
                            errors.push((0, utils_1.createGraphQLError)(rateLimitError, errorOptions));
                            return false;
                        });
                        if ((0, types_1.isPromise)(rateLimitResult)) {
                            rateLimitCalls.add(rateLimitResult);
                            return node;
                        }
                        else if (rateLimitResult === false) {
                            return null;
                        }
                    }
                    return node;
                },
            }));
            return (0, promise_helpers_1.handleMaybePromise)(() => (rateLimitCalls.size ? Promise.all(rateLimitCalls) : undefined), () => {
                if (errors.length) {
                    setResultAndStopExecution({
                        errors,
                    });
                }
            });
        },
        onContextBuilding({ extendContext }) {
            extendContext({
                rateLimiterFn,
            });
        },
    };
};
exports.useRateLimiter = useRateLimiter;
function interpolateByArgs(message, args) {
    return message.replace(/\{{([^)]*)\}}/g, (_, key) => args[key.trim()]);
}
