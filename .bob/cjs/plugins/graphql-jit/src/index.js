"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGraphQlJit = void 0;
const graphql_jit_1 = require("graphql-jit");
const core_1 = require("@envelop/core");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const useGraphQlJit = (compilerOptions = {}, pluginOptions = {}) => {
    const jitCacheByDocumentString = pluginOptions.cache;
    const jitCacheByDocument = new WeakMap();
    function getCacheEntry(args) {
        let cacheEntry;
        cacheEntry = jitCacheByDocument.get(args.document);
        if (!cacheEntry && jitCacheByDocumentString) {
            const documentSource = (0, core_1.getDocumentString)(args.document);
            if (documentSource) {
                cacheEntry = jitCacheByDocumentString.get(documentSource);
            }
        }
        if (!cacheEntry) {
            const compilationResult = (0, graphql_jit_1.compileQuery)(args.schema, args.document, args.operationName ?? undefined, compilerOptions);
            if (!(0, graphql_jit_1.isCompiledQuery)(compilationResult)) {
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
                const documentSource = (0, core_1.getDocumentString)(args.document);
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
        return (0, promise_helpers_1.handleMaybePromise)(() => executeFn(args.rootValue, args.contextValue, args.variableValues), result => {
            result.stringify = cacheEntry.stringify;
            return result;
        });
    }
    const executeFn = (0, core_1.makeExecute)(jitExecutor);
    const subscribeFn = (0, core_1.makeSubscribe)(jitExecutor);
    const enableIfFn = pluginOptions.enableIf;
    return {
        onExecute({ args, setExecuteFn }) {
            if (enableIfFn) {
                return (0, promise_helpers_1.handleMaybePromise)(() => enableIfFn(args), enableIfRes => {
                    if (enableIfRes) {
                        setExecuteFn(executeFn);
                    }
                });
            }
            setExecuteFn(executeFn);
        },
        onSubscribe({ args, setSubscribeFn }) {
            if (enableIfFn) {
                return (0, promise_helpers_1.handleMaybePromise)(() => enableIfFn(args), enableIfRes => {
                    if (enableIfRes) {
                        setSubscribeFn(subscribeFn);
                    }
                });
            }
            setSubscribeFn(subscribeFn);
        },
    };
};
exports.useGraphQlJit = useGraphQlJit;
