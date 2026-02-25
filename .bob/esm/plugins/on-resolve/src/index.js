import { defaultFieldResolver, isIntrospectionType, isObjectType, } from 'graphql';
import { handleMaybePromise, mapMaybePromise } from '@whatwg-node/promise-helpers';
/**
 * Wraps the provided schema by hooking into the resolvers of every field.
 *
 * Use the `onResolve` argument to manipulate the resolver and its results/errors.
 */
export function useOnResolve(onResolve, opts = { skipIntrospection: true, skipDefaultResolvers: false }) {
    const hasWrappedResolveSymbol = Symbol('hasWrappedResolve');
    return {
        onSchemaChange({ schema: _schema }) {
            const schema = _schema;
            if (!schema)
                return; // nothing to do if schema is missing
            for (const type of Object.values(schema.getTypeMap())) {
                if ((!opts.skipIntrospection || !isIntrospectionType(type)) && isObjectType(type)) {
                    for (const field of Object.values(type.getFields())) {
                        if (field[hasWrappedResolveSymbol])
                            continue;
                        if (opts.skipDefaultResolvers &&
                            (!field.resolve ||
                                field.resolve?.name === 'defaultFieldResolver' ||
                                field.resolve?.name === 'defaultMergedResolver')) {
                            continue;
                        }
                        let resolver = (field.resolve || defaultFieldResolver);
                        field.resolve = (root, args, context, info) => handleMaybePromise(() => onResolve({
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
                                return handleMaybePromise(() => resolver(root, args, context, info), result => mapMaybePromise(afterResolve({
                                    result,
                                    setResult: newResult => {
                                        result = newResult;
                                    },
                                }), () => result), errorResult => handleMaybePromise(() => afterResolve({
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
