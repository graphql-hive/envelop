import { compileQuery, isCompiledQuery } from 'graphql-jit';
import { getDocumentString, makeExecute, makeSubscribe } from '@envelop/core';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
export const useGraphQlJit = (compilerOptions = {}, pluginOptions = {}) => {
    const jitCacheByDocumentString = pluginOptions.cache;
    const jitCacheByDocument = new WeakMap();
    function getCacheEntry(args) {
        let cacheEntry;
        cacheEntry = jitCacheByDocument.get(args.document);
        if (!cacheEntry && jitCacheByDocumentString) {
            const documentSource = getDocumentString(args.document);
            if (documentSource) {
                cacheEntry = jitCacheByDocumentString.get(documentSource);
            }
        }
        if (!cacheEntry) {
            const compilationResult = compileQuery(args.schema, args.document, args.operationName ?? undefined, compilerOptions);
            if (!isCompiledQuery(compilationResult)) {
                if (pluginOptions?.onError) {
                    pluginOptions.onError(compilationResult);
                }
                else {
                    console.error(compilationResult);
                }
                cacheEntry = {
                    query: () => compilationResult,
                    stringify: r => JSON.stringify(r),
                };
            }
            else {
                cacheEntry = compilationResult;
            }
            jitCacheByDocument.set(args.document, cacheEntry);
            if (jitCacheByDocumentString) {
                const documentSource = getDocumentString(args.document);
                if (documentSource) {
                    jitCacheByDocumentString.set(documentSource, cacheEntry);
                }
            }
        }
        return cacheEntry;
    }
    function jitExecutor(args) {
        const cacheEntry = getCacheEntry(args);
        const executeFn = cacheEntry.subscribe ? cacheEntry.subscribe : cacheEntry.query;
        return handleMaybePromise(() => executeFn(args.rootValue, args.contextValue, args.variableValues), result => {
            result.stringify = cacheEntry.stringify;
            return result;
        });
    }
    const executeFn = makeExecute(jitExecutor);
    const subscribeFn = makeSubscribe(jitExecutor);
    const enableIfFn = pluginOptions.enableIf;
    return {
        onExecute({ args, setExecuteFn }) {
            if (enableIfFn) {
                return handleMaybePromise(() => enableIfFn(args), enableIfRes => {
                    if (enableIfRes) {
                        setExecuteFn(executeFn);
                    }
                });
            }
            setExecuteFn(executeFn);
        },
        onSubscribe({ args, setSubscribeFn }) {
            if (enableIfFn) {
                return handleMaybePromise(() => enableIfFn(args), enableIfRes => {
                    if (enableIfRes) {
                        setSubscribeFn(subscribeFn);
                    }
                });
            }
            setSubscribeFn(subscribeFn);
        },
    };
};
