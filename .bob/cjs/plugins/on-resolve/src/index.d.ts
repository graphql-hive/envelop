import { GraphQLResolveInfo } from 'graphql';
import type { Plugin } from '@envelop/core';
import { MaybePromise } from '@whatwg-node/promise-helpers';
export type Resolver<Context = unknown> = (root: unknown, args: Record<string, unknown>, context: Context, info: GraphQLResolveInfo) => MaybePromise<unknown>;
export type AfterResolver = (options: {
    result: unknown;
    setResult: (newResult: unknown) => void;
}) => MaybePromise<void>;
export interface OnResolveOptions<PluginContext extends Record<string, any> = {}> {
    context: PluginContext;
    root: unknown;
    args: Record<string, unknown>;
    info: GraphQLResolveInfo;
    resolver: Resolver<PluginContext>;
    replaceResolver: (newResolver: Resolver<PluginContext>) => void;
}
export type OnResolve<PluginContext extends Record<string, any> = {}> = (options: OnResolveOptions<PluginContext>) => MaybePromise<AfterResolver | void>;
export type UseOnResolveOptions = {
    /**
     * Skip executing the `onResolve` hook on introspection queries.
     *
     * @default true
     */
    skipIntrospection?: boolean;
    /**
     * Skip executing the `onResolve` hook on fields with default resolvers.
     *
     * @default false
     */
    skipDefaultResolvers?: boolean;
};
/**
 * Wraps the provided schema by hooking into the resolvers of every field.
 *
 * Use the `onResolve` argument to manipulate the resolver and its results/errors.
 */
export declare function useOnResolve<PluginContext extends Record<string, any> = {}>(onResolve: OnResolve<PluginContext>, opts?: UseOnResolveOptions): Plugin<PluginContext>;
