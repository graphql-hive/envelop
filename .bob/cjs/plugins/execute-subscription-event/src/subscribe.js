"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribe = void 0;
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
/**
 * This is a almost identical port from graphql-js subscribe.
 * The only difference is that a custom `execute` function can be injected for customizing the behavior.
 */
const subscribe = (execute) => (0, core_1.makeSubscribe)(({ schema, document, rootValue, contextValue, variableValues, operationName, fieldResolver, subscribeFieldResolver, }) => {
    return (0, promise_helpers_1.handleMaybePromise)(() => (0, graphql_1.createSourceEventStream)(schema, document, rootValue, contextValue, variableValues ?? undefined, operationName, subscribeFieldResolver), resultOrStream => {
        if (!(0, core_1.isAsyncIterable)(resultOrStream)) {
            return resultOrStream;
        }
        // Map every source value to a ExecutionResult value as described above.
        return (0, core_1.mapAsyncIterator)(resultOrStream, 
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
exports.subscribe = subscribe;
