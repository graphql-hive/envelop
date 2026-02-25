import { createSourceEventStream } from 'graphql';
import { isAsyncIterable, makeSubscribe, mapAsyncIterator, } from '@envelop/core';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
/**
 * This is a almost identical port from graphql-js subscribe.
 * The only difference is that a custom `execute` function can be injected for customizing the behavior.
 */
export const subscribe = (execute) => makeSubscribe(({ schema, document, rootValue, contextValue, variableValues, operationName, fieldResolver, subscribeFieldResolver, }) => {
    return handleMaybePromise(() => createSourceEventStream(schema, document, rootValue, contextValue, variableValues ?? undefined, operationName, subscribeFieldResolver), resultOrStream => {
        if (!isAsyncIterable(resultOrStream)) {
            return resultOrStream;
        }
        // Map every source value to a ExecutionResult value as described above.
        return mapAsyncIterator(resultOrStream, 
        // For each payload yielded from a subscription, map it over the normal
        // GraphQL `execute` function, with `payload` as the rootValue.
        // This implements the "MapSourceToResponseEvent" algorithm described in
        // the GraphQL specification. The `execute` function provides the
        // "ExecuteSubscriptionEvent" algorithm, as it is nearly identical to the
        // "ExecuteQuery" algorithm, for which `execute` is also used.
        (payload) => execute({
            schema,
            document,
            rootValue: payload,
            contextValue,
            variableValues,
            operationName,
            fieldResolver,
        }));
    });
});
