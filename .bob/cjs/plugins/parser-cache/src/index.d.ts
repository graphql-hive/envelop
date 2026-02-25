import { DocumentNode } from 'graphql';
import type { Plugin } from '@envelop/core';
interface Cache<T> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
}
export type DocumentCache = Cache<DocumentNode>;
export type ErrorCache = Cache<Error>;
export type ParserCacheOptions = {
    documentCache?: DocumentCache;
    errorCache?: ErrorCache;
};
export declare const useParserCache: (pluginOptions?: ParserCacheOptions) => Plugin;
export {};
