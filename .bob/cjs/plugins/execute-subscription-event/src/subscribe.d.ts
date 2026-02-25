import { ExecuteFunction, SubscribeFunction } from '@envelop/core';
/**
 * This is a almost identical port from graphql-js subscribe.
 * The only difference is that a custom `execute` function can be injected for customizing the behavior.
 */
export declare const subscribe: (execute: ExecuteFunction) => SubscribeFunction;
