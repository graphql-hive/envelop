import { formatApolloErrors } from 'apollo-server-errors';
import { handleStreamOrSingleExecutionResult } from '@envelop/core';
const makeHandleResult = (options = {}) => ({ result, setResult, }) => {
    if (result.errors && result.errors.length > 0) {
        setResult({
            ...result,
            // Upstream issue in apollo with GraphQL.js 16
            // Type 'ApolloError[]' is not assignable to type 'readonly GraphQLError[]'. Property '[Symbol.toStringTag]' is missing in type 'ApolloError' but required in type 'GraphQLError'.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            errors: formatApolloErrors(result.errors, {
                debug: options.debug,
                formatter: options.formatter,
            }),
        });
    }
};
export const useApolloServerErrors = (options = {}) => {
    return {
        onExecute() {
            const handleResult = makeHandleResult(options);
            return {
                onExecuteDone(payload) {
                    return handleStreamOrSingleExecutionResult(payload, handleResult);
                },
            };
        },
    };
};
