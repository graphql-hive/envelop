"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
// Fix compat by mocking broken function
// we can remove this once apollo fixed legacy usages of execute(schema, ...args)
// aka when https://github.com/apollographql/apollo-server/pull/5662 or rather https://github.com/apollographql/apollo-server/pull/5664 has been released
jest.mock('../node_modules/apollo-server-core/dist/utils/schemaHash', () => ({
    generateSchemaHash: () => 'noop',
}));
describe('useApolloServerErrors', () => {
    const executeBoth = async (schema, query, debug) => {
        const apolloServer = new apollo_server_core_1.ApolloServerBase({ schema, debug });
        const envelopRuntime = (0, core_1.envelop)({
            plugins: [(0, testing_1.useGraphQLJSEngine)(), (0, core_1.useSchema)(schema), (0, index_js_1.useApolloServerErrors)({ debug })],
        })({});
        return {
            apollo: await apolloServer.executeOperation({ query }),
            envelop: await envelopRuntime.execute({
                document: envelopRuntime.parse(query),
                schema: envelopRuntime.schema,
            }),
        };
    };
    it('should return the same output when Error is thrown from a resolver (debug=false)', async () => {
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: `type Query { test: String }`,
            resolvers: {
                Query: {
                    test: () => {
                        throw new Error('Test');
                    },
                },
            },
        });
        const query = `query test { test }`;
        const results = await executeBoth(schema, query, false);
        (0, testing_1.assertSingleExecutionValue)(results.envelop);
        expect(results.apollo.data.test).toBeNull();
        expect(results.envelop.data.test).toBeNull();
        expect(results.envelop.errors[0].locations).toEqual(results.apollo.errors[0].locations);
        expect(results.envelop.errors[0].path).toEqual(results.apollo.errors[0].path);
        expect(results.envelop.errors[0].message).toEqual(results.apollo.errors[0].message);
        expect(Object.keys(results.envelop.errors[0].extensions)).toEqual(Object.keys(results.apollo.errors[0].extensions));
        expect(results.envelop.errors[0].extensions.code).toEqual(results.apollo.errors[0].extensions.code);
    });
    it('should return the same output when Error is thrown from a resolver (debug=true)', async () => {
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: `type Query { test: String }`,
            resolvers: {
                Query: {
                    test: () => {
                        throw new Error('Test');
                    },
                },
            },
        });
        const query = `query test { test }`;
        const results = await executeBoth(schema, query, true);
        (0, testing_1.assertSingleExecutionValue)(results.envelop);
        expect(results.apollo.data.test).toBeNull();
        expect(results.envelop.data.test).toBeNull();
        expect(results.envelop.errors[0].locations).toEqual(results.apollo.errors[0].locations);
        expect(results.envelop.errors[0].path).toEqual(results.apollo.errors[0].path);
        expect(results.envelop.errors[0].message).toEqual(results.apollo.errors[0].message);
        expect(Object.keys(results.envelop.errors[0].extensions)).toEqual(Object.keys(results.apollo.errors[0].extensions));
        expect(results.envelop.errors[0].extensions.code).toEqual(results.apollo.errors[0].extensions.code);
    });
});
