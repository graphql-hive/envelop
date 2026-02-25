"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
describe('useApolloTracing', () => {
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: `type Query { foo: String }`,
        resolvers: {
            Query: {
                foo: () => new Promise(resolve => setTimeout(() => resolve('boop'), 1000)),
            },
        },
    });
    it('should measure execution times and return it as extension', async () => {
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.useApolloTracing)()], schema);
        const result = await testInstance.execute(`query { foo }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(result.data).toBeDefined();
        expect(result.extensions?.tracing).toBeDefined();
        // If you wonder why, we do this all for v16 compat which changed types of extensions to unknown
        const tracing = result.extensions?.tracing;
        expect(tracing.duration).toBeGreaterThan(1000000000);
        expect(tracing.execution.resolvers[0].duration).toBeGreaterThan(990000000);
        expect(tracing.execution.resolvers[0].path).toEqual(['foo']);
        expect(tracing.execution.resolvers[0].parentType).toBe('Query');
        expect(tracing.execution.resolvers[0].fieldName).toBe('foo');
        expect(tracing.execution.resolvers[0].returnType).toBe('String');
    });
});
