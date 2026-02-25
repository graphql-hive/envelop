import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import { isPromise } from '@envelop/core';
export function useApolloDataSources(config) {
    const cache = config.cache || new InMemoryLRUCache();
    return {
        onExecute({ extendContext, args }) {
            const dataSources = config.dataSources();
            const initializers = [];
            for (const dataSource of Object.values(dataSources)) {
                if (dataSource.initialize) {
                    const init$ = dataSource.initialize({
                        context: args.contextValue,
                        cache,
                    });
                    if (isPromise(init$)) {
                        initializers.push(init$);
                    }
                }
            }
            let init$;
            if (initializers.length) {
                init$ = Promise.all(initializers);
            }
            if ('dataSources' in args.contextValue) {
                throw new Error('Please use the dataSources config option instead of putting dataSources on the context yourself.');
            }
            extendContext({
                dataSources,
            });
            return init$;
        },
    };
}
