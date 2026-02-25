"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGraphQLMiddleware = void 0;
const graphql_middleware_1 = require("graphql-middleware");
const graphqlMiddlewareAppliedTransformSymbol = Symbol('graphqlMiddleware.appliedTransform');
const useGraphQLMiddleware = (middlewares) => {
    return {
        onSchemaChange({ schema, replaceSchema }) {
            if (schema.extensions?.[graphqlMiddlewareAppliedTransformSymbol]) {
                return;
            }
            if (middlewares.length > 0) {
                const wrappedSchema = (0, graphql_middleware_1.applyMiddleware)(schema, ...middlewares);
                wrappedSchema.extensions = {
                    ...schema.extensions,
                    [graphqlMiddlewareAppliedTransformSymbol]: true,
                };
                replaceSchema(wrappedSchema);
            }
        },
    };
};
exports.useGraphQLMiddleware = useGraphQLMiddleware;
