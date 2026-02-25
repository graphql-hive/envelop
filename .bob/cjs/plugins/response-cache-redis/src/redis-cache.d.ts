import Redis from 'ioredis';
import type { Cache } from '@envelop/response-cache';
export type BuildRedisEntityId = (typename: string, id: number | string) => string;
export type BuildRedisOperationResultCacheKey = (responseId: string) => string;
export type RedisCacheParameter = {
    /**
     * Redis instance
     * @see Redis https://github.com/luin/ioredis
     */
    redis: Redis;
    /**
     * Customize how the cache entity id is built.
     * By default the typename is concatenated with the id e.g. `User:1`
     */
    buildRedisEntityId?: BuildRedisEntityId;
    /**
     * Customize how the cache key that stores the operations associated with the response is built.
     * By default `operations` is concatenated with the responseId e.g. `operations:arZm3tCKgGmpu+a5slrpSH9vjSQ=`
     */
    buildRedisOperationResultCacheKey?: BuildRedisOperationResultCacheKey;
};
export declare const createRedisCache: (params: RedisCacheParameter) => Cache;
export declare const defaultBuildRedisEntityId: BuildRedisEntityId;
export declare const defaultBuildRedisOperationResultCacheKey: BuildRedisOperationResultCacheKey;
