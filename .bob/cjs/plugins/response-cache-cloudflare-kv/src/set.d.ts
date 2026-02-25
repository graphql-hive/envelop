import type { ExecutionResult } from 'graphql';
import { KVNamespace } from '@cloudflare/workers-types';
import type { CacheEntityRecord } from '@envelop/response-cache';
export declare function set(
/** id/hash of the operation */
id: string, 
/** the result that should be cached */
data: ExecutionResult, 
/** array of entity records that were collected during execution */
entities: Iterable<CacheEntityRecord>, 
/** how long the operation should be cached (in milliseconds) */
ttl: number, KV: KVNamespace, keyPrefix?: string): Promise<void>;
