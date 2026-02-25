import { ExecutionArgs } from 'graphql';
import { ExecutionResult, Maybe, ObjMap, Plugin } from '@envelop/core';
import { MaybePromise } from '@whatwg-node/promise-helpers';
import type { Cache, CacheEntityRecord } from './cache.js';
/**
 * Function for building the response cache key based on the input parameters
 */
export type BuildResponseCacheKeyFunction = (params: {
    /** Raw document string as sent from the client. */
    documentString: string;
    /** Variable values as sent form the client. */
    variableValues: ExecutionArgs['variableValues'];
    /** The name of the GraphQL operation that should be executed from within the document. */
    operationName?: Maybe<string>;
    /** optional sessionId for make unique cache keys based on the session.  */
    sessionId: Maybe<string>;
    /** GraphQL Context */
    context: ExecutionArgs['contextValue'];
}) => MaybePromise<string>;
export type GetDocumentStringFunction = (executionArgs: ExecutionArgs) => string;
export type ShouldCacheResultFunction = (params: {
    cacheKey: string;
    result: ExecutionResult;
}) => boolean;
export type UseResponseCacheParameter<PluginContext extends Record<string, any> = {}> = {
    cache?: Cache | ((ctx: Record<string, any>) => Cache);
    /**
     * Maximum age in ms. Defaults to `Infinity`. Set it to 0 for disabling the global TTL.
     */
    ttl?: number;
    /**
     * @deprecated Use `ttlPerSchemaCoordinate` instead.
     */
    ttlPerType?: Record<string, number>;
    /**
     * Overwrite the ttl for query operations whose selection contains a specific schema coordinate (e.g. Query.users).
     * Useful if the selection of a specific field should reduce the TTL of the query operation.
     *
     * The default value is `{}` and it will be merged with a `{ 'Query.__schema': 0 }` object.
     * In the unusual case where you actually want to cache introspection query operations,
     * you need to provide the value `{ 'Query.__schema': undefined }`.
     */
    ttlPerSchemaCoordinate?: Record<string, number | undefined>;
    scopePerSchemaCoordinate?: Record<string, 'PRIVATE' | 'PUBLIC' | undefined>;
    /**
     * Allows to cache responses based on the resolved session id.
     * Return a unique value for each session.
     * Return `null` or `undefined` to mark the session as public/global.
     * Creates a global session by default.
     * @param context GraphQL Context
     *
     * **Global Example:**
     * ```ts
     * useResponseCache({
     *   session: () => null,
     * });
     * ```
     *
     * **User Specific with global fallback example:**
     * ```ts
     * useResponseCache({
     *   session: (context) => context.user?.id ?? null,
     * });
     * ```
     */
    session(context: PluginContext): string | undefined | null;
    /**
     * Specify whether the cache should be used based on the context.
     * By default any request uses the cache.
     */
    enabled?(context: PluginContext): boolean;
    /**
     * Skip caching of following the types.
     */
    ignoredTypes?: string[];
    /**
     * List of fields that are used to identify a entity.
     * Defaults to `["id"]`
     */
    idFields?: Array<string>;
    /**
     * Whether the mutation execution result should be used for invalidating resources.
     * Defaults to `true`
     */
    invalidateViaMutation?: boolean;
    /**
     * Customize the behavior how the response cache key is computed from the document, variable values and sessionId.
     * Defaults to `defaultBuildResponseCacheKey`
     */
    buildResponseCacheKey?: BuildResponseCacheKeyFunction;
    /**
     * Function used for reading the document string that is used for building the response cache key from the execution arguments.
     * By default, the useResponseCache plugin hooks into onParse and caches the original operation string in a WeakMap.
     * If you are hard overriding parse you need to set this function, otherwise responses will not be cached or served from the cache.
     * Defaults to `defaultGetDocumentString`
     *
     */
    getDocumentString?: GetDocumentStringFunction;
    /**
     * Include extension values that provide useful information, such as whether the cache was hit or which resources a mutation invalidated.
     * Defaults to `true` if `process.env["NODE_ENV"]` is set to `"development"`, otherwise `false`.
     */
    includeExtensionMetadata?: boolean;
    /**
     * Checks if the execution result should be cached or ignored. By default, any execution that
     * raises any error is ignored.
     * Use this function to customize the behavior, such as caching results that have an EnvelopError.
     */
    shouldCacheResult?: ShouldCacheResultFunction;
    /**
     * Hook that when TTL is calculated, allows to modify the TTL value.
     */
    onTtl?: ResponseCacheOnTtlFunction<PluginContext>;
};
export type ResponseCacheOnTtlFunction<PluginContext> = (payload: {
    ttl: number;
    context: PluginContext;
}) => number;
/**
 * Default function used for building the response cache key.
 * It is exported here for advanced use-cases. E.g. if you want to short circuit and serve responses from the cache on a global level in order to completely by-pass the GraphQL flow.
 */
export declare const defaultBuildResponseCacheKey: (params: {
    documentString: string;
    variableValues: ExecutionArgs["variableValues"];
    operationName?: Maybe<string>;
    sessionId: Maybe<string>;
}) => MaybePromise<string>;
/**
 * Default function used to check if the result should be cached.
 *
 * It is exported here for advanced use-cases. E.g. if you want to choose if
 * results with certain error types should be cached.
 *
 * By default, results with errors (unexpected, EnvelopError, or GraphQLError) are not cached.
 */
export declare const defaultShouldCacheResult: ShouldCacheResultFunction;
export declare function defaultGetDocumentString(executionArgs: ExecutionArgs): string;
export type ResponseCacheExtensions = {
    hit: true;
} | {
    hit: false;
    didCache: false;
} | {
    hit: false;
    didCache: true;
    ttl: number;
} | {
    invalidatedEntities: CacheEntityRecord[];
};
export type ResponseCacheExecutionResult = ExecutionResult<ObjMap<unknown>, {
    responseCache?: ResponseCacheExtensions;
}>;
export declare function useResponseCache<PluginContext extends Record<string, any> = {}>({ cache, ttl: globalTtl, session, enabled, ignoredTypes, ttlPerType, ttlPerSchemaCoordinate, scopePerSchemaCoordinate, idFields, invalidateViaMutation, buildResponseCacheKey, getDocumentString, shouldCacheResult, onTtl, includeExtensionMetadata, }: UseResponseCacheParameter<PluginContext>): Plugin<PluginContext>;
export declare function resultWithMetadata(result: ExecutionResult, metadata: ResponseCacheExtensions): ResponseCacheExecutionResult;
export declare const cacheControlDirective = "\n  enum CacheControlScope {\n    PUBLIC\n    PRIVATE\n  }\n\n  directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT\n";
