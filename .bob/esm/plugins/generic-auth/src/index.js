import { getNamedType, getOperationAST, isAbstractType, isInterfaceType, isIntrospectionType, isListType, isObjectType, isUnionType, } from 'graphql';
import { useExtendedValidation } from '@envelop/extended-validation';
import { getVariableValues } from '@graphql-tools/executor';
import { createGraphQLError, getDefinedRootType, getDirectiveExtensions, shouldIncludeNode, } from '@graphql-tools/utils';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
import { removeEmptyOrUnusedNodes } from './utils.js';
export const DIRECTIVE_SDL = /* GraphQL */ `
  directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE
`;
export const SKIP_AUTH_DIRECTIVE_SDL = /* GraphQL */ `
  directive @skipAuth on FIELD_DEFINITION | OBJECT | INTERFACE
`;
export const REQUIRES_SCOPES_DIRECTIVE_SDL = /* GraphQL */ `
  directive @requiresScopes(scopes: [[String!]!]!) on FIELD_DEFINITION | OBJECT | INTERFACE
`;
export const POLICY_DIRECTIVE_SDL = /* GraphQL */ `
  directive @policy(policies: [String!]!) on FIELD_DEFINITION | OBJECT | INTERFACE
`;
export function createUnauthenticatedError(params) {
    return createGraphQLError(params?.message ?? 'Unauthorized field or type', {
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
export function defaultProtectAllValidateFn(params) {
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
export function defaultProtectSingleValidateFn(params) {
    if (params.user == null && (params.fieldAuthArgs || params.typeAuthArgs)) {
        return createUnauthenticatedError({
            fieldNode: params.fieldNode,
            path: params.path,
        });
    }
    return validateScopesAndPolicies(params);
}
export function defaultExtractScopes(user) {
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
export const useGenericAuth = (options) => {
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
                addPlugin(useExtendedValidation({
                    rejectOnErrors: rejectUnauthenticated,
                    onDocument: removeEmptyOrUnusedNodes,
                    rules: [
                        function AuthorizationExtendedValidationRule(context, args) {
                            const user = args.contextValue[contextFieldName];
                            const schema = context.getSchema();
                            const operationAST = getOperationAST(args.document, args.operationName);
                            const variableDefinitions = operationAST?.variableDefinitions;
                            let variableValues;
                            if (variableDefinitions?.length) {
                                const { coerced } = getVariableValues(schema, variableDefinitions, args.variableValues || {});
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
                                const typeDirectives = parentType && getDirectiveExtensions(parentType, schema);
                                const typeAuthArgs = typeDirectives[authDirectiveName]?.[0];
                                const typeScopes = typeDirectives[requiresScopesDirectiveName]?.[0]?.scopes;
                                const typePolicies = typeDirectives[policyDirectiveName]?.[0]?.policies;
                                const fieldDirectives = getDirectiveExtensions(field, schema);
                                const fieldAuthArgs = fieldDirectives[authDirectiveName]?.[0];
                                const fieldScopes = fieldDirectives[requiresScopesDirectiveName]?.[0]?.scopes;
                                const fieldPolicies = fieldDirectives[policyDirectiveName]?.[0]?.policies;
                                const userScopes = extractScopes(user);
                                const userPolicies = policiesByContext.get(args.contextValue) ?? [];
                                const resolvePath = getResolvePath(path, getDefinedRootType(schema, operationType));
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
                                    if (variableValues && !shouldIncludeNode(variableValues, node)) {
                                        return;
                                    }
                                    const fieldType = getNamedType(context.getParentType());
                                    if (isIntrospectionType(fieldType)) {
                                        return node;
                                    }
                                    if (isUnionType(fieldType)) {
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
                                    else if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
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
                return handleMaybePromise(() => options.resolveUserFn(context), user => {
                    // @ts-expect-error - Fix this
                    if (context[contextFieldName] !== user) {
                        // @ts-expect-error - Fix this
                        extendContext({
                            [contextFieldName]: user,
                        });
                    }
                    if (options.extractPolicies) {
                        return handleMaybePromise(() => user && options.extractPolicies?.(user, context), policies => {
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
                return handleMaybePromise(() => options.resolveUserFn(context), user => {
                    extendContext({
                        [contextFieldName]: user,
                    });
                });
            },
        };
    }
    return {};
};
