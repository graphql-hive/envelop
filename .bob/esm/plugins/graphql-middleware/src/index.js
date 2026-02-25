import { applyMiddleware } from 'graphql-middleware';
const graphqlMiddlewareAppliedTransformSymbol = Symbol('graphqlMiddleware.appliedTransform');
export const useGraphQLMiddleware = (middlewares) => {
    return {
        onSchemaChange({ schema, replaceSchema }) {
            if (schema.extensions?.[graphqlMiddlewareAppliedTransformSymbol]) {
                return;
            }
            if (middlewares.length > 0) {
                const wrappedSchema = applyMiddleware(schema, ...middlewares);
                wrappedSchema.extensions = {
                    ...schema.extensions,
                    [graphqlMiddlewareAppliedTransformSymbol]: true,
                };
                replaceSchema(wrappedSchema);
            }
        },
    };
};
