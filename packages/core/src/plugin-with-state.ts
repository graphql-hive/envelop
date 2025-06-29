import { MaybePromise } from '@whatwg-node/promise-helpers';

export function withState<P extends { instrumentation?: GenericInstrumentation }, State = object>(
  pluginFactory: (
    getState: <SP extends {}>(payload: SP) => PayloadWithState<SP, State, State, State>['state'],
  ) => PluginWithState<P, State, State, State>,
): P;
export function withState<
  P extends { instrumentation?: GenericInstrumentation },
  HttpState = object,
  GraphqlState = object,
  SubExecState = object,
>(
  pluginFactory: (
    getState: <SP extends {}>(
      payload: SP,
    ) => PayloadWithState<SP, HttpState, GraphqlState, SubExecState>['state'],
  ) => PluginWithState<P, HttpState, GraphqlState, SubExecState>,
): P {
  const states: {
    forRequest?: WeakMap<Request, Partial<HttpState>>;
    forOperation?: WeakMap<object, Partial<GraphqlState>>;
    forSubgraphExecution?: WeakMap<{ context: any }, Partial<SubExecState>>;
  } = {};

  function getProp(scope: keyof typeof states, key: any): PropertyDescriptor {
    return {
      get() {
        if (!states[scope]) states[scope] = new WeakMap<any, any>();
        let value = states[scope].get(key as any);
        if (!value) states[scope].set(key, (value = {}));
        return value;
      },
      enumerable: true,
    };
  }

  function getState(payload: Payload) {
    if (!payload) {
      return undefined;
    }
    let { executionRequest, context, request } = payload;
    const state = {};
    const defineState = (scope: keyof typeof states, key: any) =>
      Object.defineProperty(state, scope, getProp(scope, key));

    if (executionRequest) {
      defineState('forSubgraphExecution', executionRequest);
      // ExecutionRequest can happen outside of any Graphql Operation for Gateway internal usage like Introspection queries.
      // We check for `params` to be present, which means it's actually a GraphQL context.
      if (executionRequest.context?.params) context = executionRequest.context;
    }
    if (context) {
      defineState('forOperation', context);
      if (context.request) request = context.request;
    }
    if (request) {
      defineState('forRequest', request);
    }
    return state;
  }

  function addStateGetters(src: any) {
    const result: any = {};
    for (const [hookName, hook] of Object.entries(src) as any) {
      if (typeof hook !== 'function') {
        result[hookName] = hook;
      } else {
        result[hookName] = {
          [hook.name](payload: any, ...args: any[]) {
            if (payload && (payload.request || payload.context || payload.executionRequest)) {
              return hook(
                {
                  ...payload,
                  get state() {
                    return getState(payload);
                  },
                },
                ...args,
              );
            } else {
              return hook(payload, ...args);
            }
          },
        }[hook.name];
      }
    }
    return result;
  }

  const { instrumentation, ...hooks } = pluginFactory(getState as any);

  const pluginWithState = addStateGetters(hooks);
  if (instrumentation) {
    pluginWithState.instrumentation = addStateGetters(instrumentation);
  }

  return pluginWithState as P;
}

export type HttpState<T> = {
  forRequest: Partial<T>;
};

export type GraphQLState<T> = {
  forOperation: Partial<T>;
};

export type GatewayState<T> = {
  forSubgraphExecution: Partial<T>;
};

export function getMostSpecificState<T>(
  state: Partial<HttpState<T> & GraphQLState<T> & GatewayState<T>> = {},
): Partial<T> | undefined {
  const { forOperation, forRequest, forSubgraphExecution } = state;
  return forSubgraphExecution ?? forOperation ?? forRequest;
}

type Payload = {
  request?: Request;
  context?: any;
  executionRequest?: { context: any };
};

type GenericInstrumentation = Record<
  string,
  (payload: any, wrapped: () => MaybePromise<void>) => MaybePromise<void>
>;

// Brace yourself! TS Wizardry is coming!

type PayloadWithState<T, Http, GraphQL, Gateway> = T extends {
  executionRequest: any;
}
  ? T & {
      state: Partial<HttpState<Http> & GraphQLState<GraphQL>> & GatewayState<Gateway>;
    }
  : T extends {
        executionRequest?: any;
      }
    ? T & {
        state: Partial<HttpState<Http> & GraphQLState<GraphQL> & GatewayState<Gateway>>;
      }
    : T extends { context: any }
      ? T & { state: HttpState<Http> & GraphQLState<GraphQL> }
      : T extends { request: any }
        ? T & { state: HttpState<Http> }
        : T extends { request?: any }
          ? T & { state: Partial<HttpState<Http>> }
          : T;

export type PluginWithState<P, Http = object, GraphQL = object, Gateway = object> = {
  [K in keyof P]: K extends 'instrumentation'
    ? P[K] extends infer Instrumentation | undefined
      ? {
          [I in keyof Instrumentation]: Instrumentation[I] extends
            | ((payload: infer IP, ...args: infer Args) => infer IR)
            | undefined
            ?
                | ((payload: PayloadWithState<IP, Http, GraphQL, Gateway>, ...args: Args) => IR)
                | undefined
            : Instrumentation[I];
        }
      : P[K]
    : P[K] extends ((payload: infer T) => infer R) | undefined
      ? ((payload: PayloadWithState<T, Http, GraphQL, Gateway>) => R) | undefined
      : P[K];
};
