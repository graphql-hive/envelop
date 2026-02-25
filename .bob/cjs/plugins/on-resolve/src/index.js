"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOnResolve = useOnResolve;
const graphql_1 = require("graphql");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
/**
 * Wraps the provided schema by hooking into the resolvers of every field.
 *
 * Use the `onResolve` argument to manipulate the resolver and its results/errors.
 */
function useOnResolve(onResolve, opts = { skipIntrospection: true, skipDefaultResolvers: false }) {
    const hasWrappedResolveSymbol = Symbol('hasWrappedResolve');
    return {
        onSchemaChange({ schema: _schema }) {
            const schema = _schema;
            if (!schema)
                return; // nothing to do if schema is missing
            for (const type of Object.values(schema.getTypeMap())) {
                if ((!opts.skipIntrospection || !(0, graphql_1.isIntrospectionType)(type)) && (0, graphql_1.isObjectType)(type)) {
                    for (const field of Object.values(type.getFields())) {
                        if (field[hasWrappedResolveSymbol])
                            continue;
                        if (opts.skipDefaultResolvers &&
                            (!field.resolve ||
                                field.resolve?.name === 'defaultFieldResolver' ||
                                field.resolve?.name === 'defaultMergedResolver')) {
                            continue;
                        }
                        let resolver = (field.resolve || graphql_1.defaultFieldResolver);
                        field.resolve = (root, args, context, info) => (0, promise_helpers_1.handleMaybePromise)(() => onResolve({
                            root,
                            args,
                            context,
                            info,
                            resolver,
                            replaceResolver: newResolver => {
                                resolver = newResolver;
                            },
                        }), afterResolve => {
                            if (typeof afterResolve === 'function') {
                                return (0, promise_helpers_1.handleMaybePromise)(() => resolver(root, args, context, info), result => (0, promise_helpers_1.mapMaybePromise)(afterResolve({
                                    result,
                                    setResult: newResult => {
                                        result = newResult;
                                    },
                                }), () => result), errorResult => (0, promise_helpers_1.handleMaybePromise)(() => afterResolve({
                                    result: errorResult,
                                    setResult: newResult => {
                                        errorResult = newResult;
                                    },
                                }), () => {
                                    throw errorResult;
                                }));
                            }
                            return resolver(root, args, context, info);
                        });
                        field[hasWrappedResolveSymbol] = true;
                    }
                }
            }
        },
    };
}
