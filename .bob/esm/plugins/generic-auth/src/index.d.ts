import { ExecutionArgs, FieldNode, GraphQLError, GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import { DefaultContext, Maybe, Plugin, PromiseOrValue } from '@envelop/core';
import { getDirectiveExtensions } from '@graphql-tools/utils';
export type ResolveUserFn<UserType, ContextType = DefaultContext> = (context: ContextType) => PromiseOrValue<Maybe<UserType>>;
export type ValidateUserFnParams<UserType> = {
    /** The user object. */
    user: UserType;
    /** The field node from the operation that is being validated. */
    fieldNode: FieldNode;
    /** The parent type which has the field that is being validated. */
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    /** The auth directive arguments for the type */
    typeAuthArgs?: Record<string, any>;
    /** The directives for the type */
    typeDirectives?: ReturnType<typeof getDirectiveExtensions>;
    /** Scopes that type requires */
    typeScopes?: string[][];
    /** Policies that type requires */
    typePolicies?: string[][];
    /** The object field */
    field: GraphQLField<any, any>;
    /** The auth directive arguments for the field */
    fieldAuthArgs?: Record<string, any>;
    /** The directives for the field */
    fieldDirectives?: ReturnType<typeof getDirectiveExtensions>;
    /** Scopes that field requires */
    fieldScopes?: string[][];
    /** Policies that field requires */
    fieldPolicies?: string[][];
    /** Extracted scopes from the user object */
    userScopes: string[];
    /** Policies for the user */
    userPolicies: string[];
    /** The args passed to the execution function (including operation context and variables) **/
    executionArgs: ExecutionArgs;
    /** Resolve path */
    path: ReadonlyArray<string | number>;
};
export type ValidateUserFn<UserType> = (params: ValidateUserFnParams<UserType>) => void | GraphQLError;
export declare const DIRECTIVE_SDL = "\n  directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE\n";
export declare const SKIP_AUTH_DIRECTIVE_SDL = "\n  directive @skipAuth on FIELD_DEFINITION | OBJECT | INTERFACE\n";
export declare const REQUIRES_SCOPES_DIRECTIVE_SDL = "\n  directive @requiresScopes(scopes: [[String!]!]!) on FIELD_DEFINITION | OBJECT | INTERFACE\n";
export declare const POLICY_DIRECTIVE_SDL = "\n  directive @policy(policies: [String!]!) on FIELD_DEFINITION | OBJECT | INTERFACE\n";
export type GenericAuthPluginOptions<UserType extends {} = {}, ContextType = DefaultContext, CurrentUserKey extends string = 'currentUser'> = {
    /**
     * Here you can implement any custom sync/async code, and use the context built so far in Envelop and the HTTP request
     * to find the current user.
     * Common practice is to use a JWT token here, validate it, and use the payload as-is, or fetch the user from an external services.
     * Make sure to either return `null` or the user object.
     */
    resolveUserFn: ResolveUserFn<UserType, ContextType>;
    /**
     * Overrides the default field name for injecting the user into the execution `context`.
     * @default currentUser
     */
    contextFieldName?: CurrentUserKey;
    /**
     * Overrides the default directive name for marking a field that requires specific scopes.
     *
     * @default requiresScopes
     */
    scopesDirectiveName?: 'requiresScopes';
    /**
     * Extracts the scopes from the user object.
     *
     * @default defaultExtractScopes
     */
    extractScopes?(user: UserType): string[];
    /**
     * Overrides the default directive name for @policy directive
     *
     * @default policy
     */
    policyDirectiveName?: string;
    /**
     * Extracts the policies for the user object.
     */
    extractPolicies?(user: UserType, context: ContextType): PromiseOrValue<string[]>;
} & ({
    /**
     * This mode offers complete protection for the entire API.
     * It protects your entire GraphQL schema, by validating the user before executing the request.
     * You can skip the validation using `@skipAuth` directive on a specific field.
     */
    mode: 'protect-all';
    /**
     * Overrides the default directive name or extension field for marking a field available for unauthorized users.
     * @default skipAuth
     */
    authDirectiveName?: 'skipAuth' | string;
    /**
     * Customize how the user is validated. E.g. apply authorization role based validation.
     * The validation is applied during the extended validation phase.
     * @default `defaultProtectAllValidateFn`
     */
    validateUser?: ValidateUserFn<UserType>;
} | {
    /**
     * Just resolves the user and inject to authenticated user into the `context`.
     * User validation needs to be implemented by you, in your resolvers.
     */
    mode: 'resolve-only';
} | {
    /**
     * resolves the user and inject to authenticated user into the `context`.
     * And checks for `@auth` directives usages to run validation automatically.
     */
    mode: 'protect-granular';
    /**
     * Overrides the default directive name or extension field for marking a field available only for authorized users.
     * @default authenticated
     */
    authDirectiveName?: 'authenticated' | string;
    /**
     * Customize how the user is validated. E.g. apply authorization role based validation.
     * The validation is applied during the extended validation phase.
     * @default `defaultProtectSingleValidateFn`
     */
    validateUser?: ValidateUserFn<UserType>;
    /**
     * Reject on unauthenticated requests.
     * @default true
     */
    rejectUnauthenticated?: boolean;
});
export declare function createUnauthenticatedError(params?: {
    fieldNode?: FieldNode;
    path?: ReadonlyArray<string | number>;
    message?: string;
    statusCode?: number;
}): GraphQLError;
export declare function defaultProtectAllValidateFn<UserType>(params: ValidateUserFnParams<UserType>): void | GraphQLError;
export declare function defaultProtectSingleValidateFn<UserType>(params: ValidateUserFnParams<UserType>): void | GraphQLError;
export declare function defaultExtractScopes<UserType>(user: UserType): string[];
export declare const useGenericAuth: <UserType extends {} = {}, ContextType extends Record<any, any> = DefaultContext, CurrentUserKey extends string = "currentUser">(options: GenericAuthPluginOptions<UserType, ContextType, CurrentUserKey>) => Plugin<{
    validateUser: ValidateUserFn<UserType>;
} & Record<CurrentUserKey, UserType>>;
