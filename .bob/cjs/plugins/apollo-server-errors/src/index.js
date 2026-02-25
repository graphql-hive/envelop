"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApolloServerErrors = void 0;
const apollo_server_errors_1 = require("apollo-server-errors");
const core_1 = require("@envelop/core");
const makeHandleResult = (options = {}) => ({ result, setResult, }) => {
    if (result.errors && result.errors.length > 0) {
        setResult({
            ...result,
            // Upstream issue in apollo with GraphQL.js 16
            // Type 'ApolloError[]' is not assignable to type 'readonly GraphQLError[]'. Property '[Symbol.toStringTag]' is missing in type 'ApolloError' but required in type 'GraphQLError'.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            errors: (0, apollo_server_errors_1.formatApolloErrors)(result.errors, {
                debug: options.debug,
                formatter: options.formatter,
            }),
        });
    }
};
const useApolloServerErrors = (options = {}) => {
    return {
        onExecute() {
            const handleResult = makeHandleResult(options);
            return {
                onExecuteDone(payload) {
                    return (0, core_1.handleStreamOrSingleExecutionResult)(payload, handleResult);
                },
            };
        },
    };
};
exports.useApolloServerErrors = useApolloServerErrors;
