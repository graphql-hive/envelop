import { GraphQLError } from 'graphql';
import { type Plugin } from '@envelop/core';
export interface ValidationCache {
    /**
     * Get a result from the validation cache.
     */
    get(key: string): readonly GraphQLError[] | undefined;
    /**
     * Set a result to the validation cache.
     */
    set(key: string, value: readonly GraphQLError[]): void;
}
export type ValidationCacheOptions = {
    cache?: ValidationCache;
};
export declare const useValidationCache: (pluginOptions?: ValidationCacheOptions) => Plugin;
