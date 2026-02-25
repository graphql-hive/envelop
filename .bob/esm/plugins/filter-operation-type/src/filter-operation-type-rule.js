import { GraphQLError } from 'graphql';
export const createFilterOperationTypeRule = (allowedOperations) => context => {
    const ops = new Set(allowedOperations);
    return {
        OperationDefinition(node) {
            if (!ops.has(node.operation)) {
                context.reportError(new GraphQLError(`GraphQL operation type "${node.operation}" is not allowed.`, [node]));
            }
        },
    };
};
