import { ExecutionArgs, ExecutionResult } from 'graphql';
import { CompiledQuery, CompilerOptions } from 'graphql-jit';
import { Plugin } from '@envelop/core';
type JSONStringifier = (result: any) => string;
type JITCacheEntry = {
    query: CompiledQuery['query'];
    subscribe?: CompiledQuery['subscribe'];
    stringify: JSONStringifier;
};
export type ExecutionResultWithSerializer = ExecutionResult & {
    stringify?: JSONStringifier;
};
export interface JITCache {
    get(key: string): JITCacheEntry | undefined;
    set(key: string, value: JITCacheEntry): void;
}
export declare const useGraphQlJit: (compilerOptions?: Partial<CompilerOptions>, pluginOptions?: {
    /**
     * A helper function that helps to conditionally enable JIT based on incoming request
     */
    enableIf?: (executionArgs: ExecutionArgs) => boolean | Promise<boolean>;
    /**
     * Callback triggered in case of GraphQL Jit compilation error.
     */
    onError?: (r: ExecutionResultWithSerializer) => void;
    /**
     * Custom cache instance
     */
    cache?: JITCache;
}) => Plugin;
export {};
