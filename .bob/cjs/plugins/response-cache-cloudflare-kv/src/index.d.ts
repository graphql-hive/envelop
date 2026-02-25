import type { KVNamespace } from '@cloudflare/workers-types';
import type { Cache } from '@envelop/response-cache';
export type KvCacheConfig<TKVNamespaceName extends string> = {
    /**
     * The name of the  Cloudflare KV namespace that should be used to store the cache
     */
    KVName: TKVNamespaceName;
    /**
     *  Defines the length of time in milliseconds that a KV result is cached in the global network location it is accessed from.
     *
     * The cacheTTL parameter must be an integer greater than or equal to 60000 (60 seconds), which is the default.
     */
    cacheReadTTL?: number;
    /**
     * A prefix that should be added to all cache keys
     */
    keyPrefix?: string;
};
/**
 * Creates a cache object that uses Cloudflare KV to store GraphQL responses.
 * This cache is optimized for Cloudflare workers and uses the `ctx.waitUntil` method to perform non-blocking actions where possible
 *
 * To find out more about how this cache is implemented see https://the-guild.dev/blog/graphql-response-caching-with-envelop
 *
 * @param config Modify the behavior of the cache as it pertains to Cloudflare KV
 * @returns A cache object that can be passed to envelop's `useResponseCache` plugin
 */
export declare function createKvCache<TKVNamespaceName extends string, TServerContext extends {
    [TKey in TKVNamespaceName]: KVNamespace;
} & {
    waitUntil(promise: Promise<unknown>): void;
}>(config: KvCacheConfig<TKVNamespaceName>): (ctx: TServerContext) => Cache;
