import { KVNamespace } from '@cloudflare/workers-types';
import type { CacheEntityRecord } from '@envelop/response-cache';
export declare function invalidate(entities: Iterable<CacheEntityRecord>, KV: KVNamespace, keyPrefix?: string): Promise<void>;
export declare function invalidateCacheEntityRecord(entity: CacheEntityRecord, 
/** Collect all inner promises to batch await all async operations outside the function */
kvPromiseCollection: Promise<unknown>[], KV: KVNamespace, keyPrefix?: string): Promise<void>;
export declare function getAllKvKeysForPrefix(prefix: string, KV: KVNamespace): AsyncGenerator<import("@cloudflare/workers-types").KVNamespaceListKey<{
    operationKey: string;
}, string>, void, unknown>;
