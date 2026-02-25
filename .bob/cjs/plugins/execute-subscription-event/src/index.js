"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExtendContextValuePerExecuteSubscriptionEvent = void 0;
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const subscribe_js_1 = require("./subscribe.js");
const useExtendContextValuePerExecuteSubscriptionEvent = (createContext) => {
    return {
        onSubscribe({ args, setSubscribeFn }) {
            const executeNew = (0, core_1.makeExecute)(executionArgs => {
                return (0, promise_helpers_1.handleMaybePromise)(() => createContext({ args }), context => (0, promise_helpers_1.handleMaybePromise)(() => (0, graphql_1.execute)({
                    ...executionArgs,
                    // GraphQL.js 16 changed the type of contextValue to unknown
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    contextValue: { ...executionArgs.contextValue, ...context?.contextPartial },
                }), result => {
                    context?.onEnd?.();
                    return result;
                }, error => {
                    context?.onEnd?.();
                    throw error;
                }));
            });
            setSubscribeFn((0, subscribe_js_1.subscribe)(executeNew));
        },
    };
};
exports.useExtendContextValuePerExecuteSubscriptionEvent = useExtendContextValuePerExecuteSubscriptionEvent;
