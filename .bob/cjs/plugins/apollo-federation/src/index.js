"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApolloFederation = void 0;
const graphql_1 = require("graphql");
const utils_keyvaluecache_1 = require("@apollo/utils.keyvaluecache");
const core_1 = require("@envelop/core");
const new_cache_policy_js_1 = require("./new-cache-policy.js");
const useApolloFederation = (options) => {
    const { gateway, cache = new utils_keyvaluecache_1.InMemoryLRUCache(), logger = console, metrics = Object.create(null), overallCachePolicy = (0, new_cache_policy_js_1.newCachePolicy)(), } = options;
    let schemaHash;
    return {
        onPluginInit({ setSchema }) {
            if (gateway.schema) {
                setSchema(gateway.schema);
            }
            else {
                logger.warn(`ApolloGateway doesn't have the schema loaded. Please make sure ApolloGateway is loaded with .load() method. Otherwise this plugin might not work consistently, especially if you are using ApolloServer.`);
                gateway.load();
            }
            gateway.onSchemaLoadOrUpdate(({ apiSchema, coreSupergraphSdl = (0, graphql_1.printSchema)(apiSchema) }) => {
                setSchema(apiSchema);
                schemaHash = coreSupergraphSdl || (0, graphql_1.printSchema)(apiSchema);
            });
        },
        onExecute({ args, setExecuteFn }) {
            const documentStr = (0, core_1.getDocumentString)(args.document, graphql_1.print);
            const operation = (0, graphql_1.getOperationAST)(args.document, args.operationName ?? undefined);
            if (!operation) {
                throw new Error(`Operation ${args.operationName || ''} cannot be found in ${documentStr}`);
            }
            setExecuteFn(function federationExecutor() {
                return gateway.executor({
                    document: args.document,
                    request: {
                        query: documentStr,
                        operationName: args.operationName ?? undefined,
                        variables: args.variableValues ?? undefined,
                    },
                    overallCachePolicy,
                    operationName: args.operationName ?? null,
                    cache,
                    context: args.contextValue,
                    queryHash: documentStr,
                    logger,
                    metrics,
                    source: documentStr,
                    operation,
                    schema: args.schema,
                    schemaHash,
                });
            });
        },
    };
};
exports.useApolloFederation = useApolloFederation;
