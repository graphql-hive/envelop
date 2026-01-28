import type { Application } from 'graphql-modules';
import type { Plugin } from '@envelop/core';

export const useGraphQLModules = (app: Application): Plugin => {
  let executeSet = false;
  let subscribeSet = false;
  return {
    onPluginInit({ setSchema }) {
      setSchema(app.schema);
    },
    onExecute({ setExecuteFn, executeFn }) {
      if (!executeSet) {
        executeSet = true;
        setExecuteFn(
          app.createExecution({
            execute: executeFn,
          }),
        );
      }
    },
    onSubscribe({ setSubscribeFn, subscribeFn }) {
      if (!subscribeSet) {
        subscribeSet = true;
        setSubscribeFn(
          app.createSubscription({
            subscribe: subscribeFn,
          }),
        );
      }
    },
  };
};
