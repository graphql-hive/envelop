"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFilterOperationTypeRule = void 0;
const graphql_1 = require("graphql");
const createFilterOperationTypeRule = (allowedOperations) => context => {
    const ops = new Set(allowedOperations);
    return {
        OperationDefinition(node) {
            if (!ops.has(node.operation)) {
                context.reportError(new graphql_1.GraphQLError(`GraphQL operation type "${node.operation}" is not allowed.`, [node]));
            }
        },
    };
};
exports.createFilterOperationTypeRule = createFilterOperationTypeRule;
