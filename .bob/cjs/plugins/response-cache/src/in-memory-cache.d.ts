import type { Cache } from './cache.js';
export type BuildEntityId = (typename: string, id: number | string) => string;
export type InMemoryCacheParameter = {
    /**
     * Maximum amount of items in the cache. Defaults to `Infinity`.
     */
    max?: number;
    /**
     * Customize how the cache entity id is built.
     * By default the typename is concatenated with the id e.g. `User:1`
     */
    buildEntityId?: BuildEntityId;
};
export declare const createInMemoryCache: (params?: InMemoryCacheParameter) => Cache;
export declare const defaultBuildEntityId: BuildEntityId;
