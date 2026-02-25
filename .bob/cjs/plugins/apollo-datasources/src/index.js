"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApolloDataSources = useApolloDataSources;
const utils_keyvaluecache_1 = require("@apollo/utils.keyvaluecache");
const core_1 = require("@envelop/core");
function useApolloDataSources(config) {
    const cache = config.cache || new utils_keyvaluecache_1.InMemoryLRUCache();
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
                    if ((0, core_1.isPromise)(init$)) {
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
