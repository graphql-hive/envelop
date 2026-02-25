"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLiveQuery = exports.GraphQLLiveDirectiveSDL = exports.GraphQLLiveDirectiveAST = exports.GraphQLLiveDirective = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("@graphql-tools/utils");
const graphql_live_query_1 = require("@n1ru4l/graphql-live-query");
Object.defineProperty(exports, "GraphQLLiveDirective", { enumerable: true, get: function () { return graphql_live_query_1.GraphQLLiveDirective; } });
exports.GraphQLLiveDirectiveAST = (0, utils_1.astFromDirective)(graphql_live_query_1.GraphQLLiveDirective);
exports.GraphQLLiveDirectiveSDL = (0, graphql_1.print)(exports.GraphQLLiveDirectiveAST);
const useLiveQuery = (opts) => {
    return {
        onExecute: ({ executeFn, setExecuteFn }) => {
            const execute = opts.liveQueryStore.makeExecute(executeFn);
            if (opts.applyLiveQueryPatchGenerator) {
                const { applyLiveQueryPatchGenerator } = opts;
                setExecuteFn((...args) => applyLiveQueryPatchGenerator(execute(...args)));
            }
            else {
                setExecuteFn(execute);
            }
        },
        onValidate: ({ addValidationRule }) => {
            addValidationRule(graphql_live_query_1.NoLiveMixedWithDeferStreamRule);
        },
        onContextBuilding: ({ extendContext }) => {
            extendContext({
                liveQueryStore: opts.liveQueryStore,
            });
        },
    };
};
exports.useLiveQuery = useLiveQuery;
