import { isPromise } from 'util/types';
import { getNamedType, isAbstractType, isListType, isObjectType, TypeInfo, visit, visitWithTypeInfo, } from 'graphql';
import picomatch from 'picomatch';
import { createGraphQLError, getArgumentValues, getDefinedRootType, getDirectiveExtensions, getOperationASTFromDocument, memoize1, memoize4, } from '@graphql-tools/utils';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
import { getGraphQLRateLimiter } from './get-graphql-rate-limiter.js';
import { InMemoryStore } from './in-memory-store.js';
import { RedisStore } from './redis-store.js';
import { Store } from './store.js';
export { InMemoryStore, RedisStore, Store, };
export const DIRECTIVE_SDL = /* GraphQL */ `
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
export const defaultInterpolateMessageFn = (message, identifier) => interpolateByArgs(message, { id: identifier });
const getTypeInfo = memoize1(function getTypeInfo(schema) {
    return new TypeInfo(schema);
});
export const useRateLimiter = (options) => {
    const rateLimiterFn = getGraphQLRateLimiter({
        ...options,
        identifyContext: options.identifyFn,
    });
    const interpolateMessage = options.interpolateMessage || defaultInterpolateMessageFn;
    const configByField = options.configByField?.map(config => ({
        ...config,
        isMatch: {
            type: picomatch(config.type),
            field: picomatch(config.field),
        },
    })) || [];
    const directiveName = options.rateLimitDirectiveName ?? 'rateLimit';
    const getRateLimitConfig = memoize4(function getFieldConfigs(configByField, schema, type, field) {
        const fieldConfigs = configByField?.filter(({ isMatch }) => isMatch.type(type.name) && isMatch.field(field.name));
        if (fieldConfigs && fieldConfigs.length > 1) {
            throw new Error(`Config error: field '${type.name}.${field.name}' has multiple matching configuration`);
        }
        const fieldConfig = fieldConfigs?.[0];
        const rateLimitDirective = getDirectiveExtensions(field, schema)[directiveName]?.[0];
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
            args.document = visit(document, visitWithTypeInfo(typeInfo, {
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
                                    args = getArgumentValues(field, node, variableValues);
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
                        const rateLimitResult = handleMaybePromise(() => rateLimiterFn(field.name, executionArgs, resolverRateLimitConfig), rateLimitError => {
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
                            const operationAST = getOperationASTFromDocument(document);
                            let currType = getDefinedRootType(schema, operationAST.operation);
                            for (const pathItem of path) {
                                curr = curr[pathItem];
                                if (curr?.kind === 'Field') {
                                    const fieldName = curr.name.value;
                                    const responseKey = curr.alias?.value ?? fieldName;
                                    let field;
                                    if (isObjectType(currType)) {
                                        field = currType.getFields()[fieldName];
                                    }
                                    else if (isAbstractType(currType)) {
                                        for (const possibleType of schema.getPossibleTypes(currType)) {
                                            field = possibleType.getFields()[fieldName];
                                            if (field) {
                                                break;
                                            }
                                        }
                                    }
                                    if (isListType(field?.type)) {
                                        resolvePath.push('@');
                                    }
                                    resolvePath.push(responseKey);
                                    if (field?.type) {
                                        currType = getNamedType(field.type);
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
                            errors.push(createGraphQLError(rateLimitError, errorOptions));
                            return false;
                        });
                        if (isPromise(rateLimitResult)) {
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
            return handleMaybePromise(() => (rateLimitCalls.size ? Promise.all(rateLimitCalls) : undefined), () => {
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
function interpolateByArgs(message, args) {
    return message.replace(/\{{([^)]*)\}}/g, (_, key) => args[key.trim()]);
}
