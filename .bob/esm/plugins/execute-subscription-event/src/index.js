import { execute } from 'graphql';
import { makeExecute } from '@envelop/core';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
import { subscribe } from './subscribe.js';
export const useExtendContextValuePerExecuteSubscriptionEvent = (createContext) => {
    return {
        onSubscribe({ args, setSubscribeFn }) {
            const executeNew = makeExecute(executionArgs => {
                return handleMaybePromise(() => createContext({ args }), context => handleMaybePromise(() => execute({
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
            setSubscribeFn(subscribe(executeNew));
        },
    };
};
