import type { StatsD } from 'hot-shots';
import { Plugin } from '@envelop/core';
export interface StatsDPluginOptions {
    client: StatsD;
    /**
     * If you wish to disable introspection logging (default: false)
     */
    skipIntrospection?: boolean;
    /**
     * <prefix>.operations.count (default: graphql)
     */
    prefix?: string;
}
export declare const metricNames: {
    operationCount: string;
    errorCount: string;
    latency: string;
};
declare const statsDPluginTagsSymbol: unique symbol;
declare const statsDPluginExecutionStartTimeSymbol: unique symbol;
interface Tags {
    [key: string]: string;
}
interface PluginInternalContext {
    [statsDPluginTagsSymbol]: Tags;
    [statsDPluginExecutionStartTimeSymbol]: number;
}
export declare const useStatsD: (options: StatsDPluginOptions) => Plugin<PluginInternalContext>;
export {};
