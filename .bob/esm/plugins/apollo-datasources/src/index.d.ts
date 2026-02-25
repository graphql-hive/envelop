import { type KeyValueCache } from '@apollo/utils.keyvaluecache';
import { Plugin } from '@envelop/core';
interface DataSource {
    initialize?(config: {
        context?: Record<string, any>;
        cache?: KeyValueCache;
    }): void | Promise<void>;
}
export interface ApolloDataSourcesConfig {
    dataSources(): {
        [name: string]: DataSource;
    };
    cache?: KeyValueCache;
}
export declare function useApolloDataSources(config: ApolloDataSourcesConfig): Plugin;
export {};
