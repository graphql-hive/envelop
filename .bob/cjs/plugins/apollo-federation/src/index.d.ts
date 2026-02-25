import { DocumentNode, ExecutionResult, GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { type KeyValueCache } from '@apollo/utils.keyvaluecache';
import { Plugin } from '@envelop/core';
import { CachePolicy } from './new-cache-policy.js';
interface GatewayLogger {
    warn(message: unknown): void;
    debug(message: unknown): void;
    info(message: unknown): void;
    error(message: unknown): void;
}
type GatewayExecutor = (args: {
    document: DocumentNode;
    request: {
        query: string;
        operationName?: string;
        variables?: Record<string, any>;
    };
    overallCachePolicy: CachePolicy;
    operationName: string | null;
    cache: KeyValueCache;
    context: Record<string, any>;
    queryHash: string;
    logger: GatewayLogger;
    metrics: any;
    source: string;
    operation: OperationDefinitionNode;
    schema: GraphQLSchema;
    schemaHash: any;
}) => Promise<ExecutionResult>;
interface ApolloFederationGateway {
    schema?: GraphQLSchema;
    executor: GatewayExecutor;
    load(): Promise<{
        schema: GraphQLSchema;
        executor: GatewayExecutor;
    }>;
    onSchemaLoadOrUpdate(callback: (args: {
        apiSchema: GraphQLSchema;
        coreSupergraphSdl?: string;
    }) => void): void;
}
export interface ApolloFederationPluginConfig<TFederationGateway extends ApolloFederationGateway> {
    gateway: TFederationGateway;
    metrics?: unknown;
    cache?: KeyValueCache;
    logger?: GatewayLogger;
    overallCachePolicy?: CachePolicy;
}
export declare const useApolloFederation: <TFederationGateway extends ApolloFederationGateway, TContext extends Record<string, any>>(options: ApolloFederationPluginConfig<TFederationGateway>) => Plugin<TContext>;
export {};
