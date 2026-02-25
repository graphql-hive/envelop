"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGenericAuth = exports.POLICY_DIRECTIVE_SDL = exports.REQUIRES_SCOPES_DIRECTIVE_SDL = exports.SKIP_AUTH_DIRECTIVE_SDL = exports.DIRECTIVE_SDL = void 0;
exports.createUnauthenticatedError = createUnauthenticatedError;
exports.defaultProtectAllValidateFn = defaultProtectAllValidateFn;
exports.defaultProtectSingleValidateFn = defaultProtectSingleValidateFn;
exports.defaultExtractScopes = defaultExtractScopes;
const graphql_1 = require("graphql");
const extended_validation_1 = require("@envelop/extended-validation");
const executor_1 = require("@graphql-tools/executor");
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const utils_js_1 = require("./utils.js");
exports.DIRECTIVE_SDL = `
  directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE
`;
exports.SKIP_AUTH_DIRECTIVE_SDL = `
  directive @skipAuth on FIELD_DEFINITION | OBJECT | INTERFACE
`;
exports.REQUIRES_SCOPES_DIRECTIVE_SDL = `
  directive @requiresScopes(scopes: [[String!]!]!) on FIELD_DEFINITION | OBJECT | INTERFACE
`;
exports.POLICY_DIRECTIVE_SDL = `
  directive @policy(policies: [String!]!) on FIELD_DEFINITION | OBJECT | INTERFACE
`;
function createUnauthenticatedError(params) {
    return (0, utils_1.createGraphQLError)(params?.message ?? 'Unauthorized field or type', {
        nodes: params?.fieldNode ? [params.fieldNode] : undefined,
        path: params?.path,
        extensions: {
            code: 'UNAUTHORIZED_FIELD_OR_TYPE',
            http: {
                status: params?.statusCode ?? 401,
            },
        },
    });
}
function defaultProtectAllValidateFn(params) {
    if (params.user == null && !params.fieldAuthArgs && !params.typeAuthArgs) {
        return createUnauthenticatedError({
            fieldNode: params.fieldNode,
            path: params.path,
        });
    }
    return validateScopesAndPolicies(params);
}
function areRolesValid(requiredRoles, userRoles) {
    for (const roles of requiredRoles) {
        if (roles.every(role => userRoles.includes(role))) {
            return true;
        }
    }
    return false;
}
function validateRoles(params, requiredRoles, userRoles) {
    if (!areRolesValid(requiredRoles, userRoles)) {
        return createUnauthenticatedError({
            fieldNode: params.fieldNode,
            path: params.path,
        });
    }
}
function validateScopesAndPolicies(params) {
    if (params.typeScopes) {
        const error = validateRoles(params, params.typeScopes, params.userScopes);
        if (error) {
            return error;
        }
    }
    if (params.typePolicies?.length) {
        const error = validateRoles(params, params.typePolicies, params.userPolicies);
        if (error) {
            return error;
        }
    }
    if (params.fieldScopes?.length) {
        const error = validateRoles(params, params.fieldScopes, params.userScopes);
        if (error) {
            return error;
        }
    }
    if (params.fieldPolicies?.length) {
        const error = validateRoles(params, params.fieldPolicies, params.userPolicies);
        if (error) {
            return error;
        }
    }
}
function defaultProtectSingleValidateFn(params) {
    if (params.user == null && (params.fieldAuthArgs || params.typeAuthArgs)) {
        return createUnauthenticatedError({
            fieldNode: params.fieldNode,
            path: params.path,
        });
    }
    return validateScopesAndPolicies(params);
}
function defaultExtractScopes(user) {
    if (user != null && typeof user === 'object' && 'scope' in user) {
        if (typeof user.scope === 'string') {
            return user.scope.split(' ');
        }
        if (Array.isArray(user.scope)) {
            return user.scope;
        }
    }
    return [];
}
const useGenericAuth = (options) => {
    const contextFieldName = options.contextFieldName || 'currentUser';
    if (options.mode === 'protect-all' || options.mode === 'protect-granular') {
        const authDirectiveName = options.authDirectiveName ?? (options.mode === 'protect-all' ? 'skipAuth' : 'authenticated');
        const requiresScopesDirectiveName = options.scopesDirectiveName ?? 'requiresScopes';
        const policyDirectiveName = options.policyDirectiveName ?? 'policy';
        const validateUser = options.validateUser ??
            (options.mode === 'protect-all'
                ? defaultProtectAllValidateFn
                : defaultProtectSingleValidateFn);
        const extractScopes = options.extractScopes ?? defaultExtractScopes;
        const rejectUnauthenticated = 'rejectUnauthenticated' in options ? options.rejectUnauthenticated !== false : true;
        const policiesByContext = new WeakMap();
        return {
            onPluginInit({ addPlugin }) {
                addPlugin((0, extended_validation_1.useExtendedValidation)({
                    rejectOnErrors: rejectUnauthenticated,
                    onDocument: utils_js_1.removeEmptyOrUnusedNodes,
                    rules: [
                        function AuthorizationExtendedValidationRule(context, args) {
                            const user = args.contextValue[contextFieldName];
                            const schema = context.getSchema();
                            const operationAST = (0, graphql_1.getOperationAST)(args.document, args.operationName);
                            const variableDefinitions = operationAST?.variableDefinitions;
                            let variableValues;
                            if (variableDefinitions?.length) {
                                const { coerced } = (0, executor_1.getVariableValues)(schema, variableDefinitions, args.variableValues || {});
                                variableValues = coerced;
                            }
                            else {
                                variableValues = args.variableValues;
                            }
                            const operationType = operationAST?.operation ?? 'query';
                            const fragmentPaths = new Map();
                            function getResolvePath(path, currType) {
                                const resolvePath = [];
                                let curr = args.document;
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
                                    else if (curr?.kind === 'FragmentDefinition') {
                                        currType = schema.getType(curr.typeCondition.name.value);
                                        const fragmentPath = fragmentPaths.get(curr.name.value);
                                        if (fragmentPath) {
                                            resolvePath.push(...fragmentPath);
                                        }
                                    }
                                }
                                return resolvePath;
                            }
                            const handleField = ({ node: fieldNode, path, }, parentType) => {
                                const field = parentType.getFields()[fieldNode.name.value];
                                if (field == null) {
                                    // field is null/undefined if this is an introspection field
                                    return;
                                }
                                const typeDirectives = parentType && (0, utils_1.getDirectiveExtensions)(parentType, schema);
                                const typeAuthArgs = typeDirectives[authDirectiveName]?.[0];
                                const typeScopes = typeDirectives[requiresScopesDirectiveName]?.[0]?.scopes;
                                const typePolicies = typeDirectives[policyDirectiveName]?.[0]?.policies;
                                const fieldDirectives = (0, utils_1.getDirectiveExtensions)(field, schema);
                                const fieldAuthArgs = fieldDirectives[authDirectiveName]?.[0];
                                const fieldScopes = fieldDirectives[requiresScopesDirectiveName]?.[0]?.scopes;
                                const fieldPolicies = fieldDirectives[policyDirectiveName]?.[0]?.policies;
                                const userScopes = extractScopes(user);
                                const userPolicies = policiesByContext.get(args.contextValue) ?? [];
                                const resolvePath = getResolvePath(path, (0, utils_1.getDefinedRootType)(schema, operationType));
                                return validateUser({
                                    user,
                                    fieldNode,
                                    parentType,
                                    typeScopes,
                                    typePolicies,
                                    typeAuthArgs,
                                    typeDirectives,
                                    executionArgs: args,
                                    field,
                                    fieldDirectives,
                                    fieldAuthArgs,
                                    fieldScopes,
                                    fieldPolicies,
                                    userScopes,
                                    path: resolvePath,
                                    userPolicies,
                                });
                            };
                            return {
                                FragmentSpread(node, key, parent, path, ancestors) {
                                    const fragmentName = node.name.value;
                                    const fragment = context.getFragment(fragmentName);
                                    if (fragment) {
                                        const resolvePath = getResolvePath(path, schema.getType(fragment.typeCondition.name.value));
                                        fragmentPaths.set(fragmentName, resolvePath);
                                    }
                                },
                                Field(node, key, parent, path, ancestors) {
                                    if (variableValues && !(0, utils_1.shouldIncludeNode)(variableValues, node)) {
                                        return;
                                    }
                                    const fieldType = (0, graphql_1.getNamedType)(context.getParentType());
                                    if ((0, graphql_1.isIntrospectionType)(fieldType)) {
                                        return node;
                                    }
                                    if ((0, graphql_1.isUnionType)(fieldType)) {
                                        for (const objectType of fieldType.getTypes()) {
                                            const error = handleField({
                                                node,
                                                key,
                                                parent,
                                                path,
                                                ancestors,
                                            }, objectType);
                                            if (error) {
                                                context.reportError(error);
                                                return null;
                                            }
                                        }
                                    }
                                    else if ((0, graphql_1.isObjectType)(fieldType) || (0, graphql_1.isInterfaceType)(fieldType)) {
                                        const error = handleField({
                                            node,
                                            key,
                                            parent,
                                            path,
                                            ancestors,
                                        }, fieldType);
                                        if (error) {
                                            context.reportError(error);
                                            return null;
                                        }
                                    }
                                    return undefined;
                                },
                            };
                        },
                    ],
                }));
            },
            onContextBuilding({ context, extendContext }) {
                return (0, promise_helpers_1.handleMaybePromise)(() => options.resolveUserFn(context), user => {
                    // @ts-expect-error - Fix this
                    if (context[contextFieldName] !== user) {
                        // @ts-expect-error - Fix this
                        extendContext({
                            [contextFieldName]: user,
                        });
                    }
                    if (options.extractPolicies) {
                        return (0, promise_helpers_1.handleMaybePromise)(() => user && options.extractPolicies?.(user, context), policies => {
                            if (policies?.length) {
                                policiesByContext.set(context, policies);
                            }
                        });
                    }
                });
            },
        };
    }
    if (options.mode === 'resolve-only') {
        return {
            onContextBuilding({ context, extendContext }) {
                return (0, promise_helpers_1.handleMaybePromise)(() => options.resolveUserFn(context), user => {
                    extendContext({
                        [contextFieldName]: user,
                    });
                });
            },
        };
    }
    return {};
};
exports.useGenericAuth = useGenericAuth;
