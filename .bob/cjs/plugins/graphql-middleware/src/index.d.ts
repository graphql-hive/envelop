import { IMiddleware, IMiddlewareGenerator } from 'graphql-middleware';
import type { Plugin } from '@envelop/core';
export declare const useGraphQLMiddleware: <TSource = any, TContext = any, TArgs = any>(middlewares: (IMiddleware<TSource, TContext, TArgs> | IMiddlewareGenerator<TSource, TContext, TArgs>)[]) => Plugin;
