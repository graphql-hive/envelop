"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_shield_1 = require("graphql-shield");
const response_cache_1 = require("@envelop/response-cache");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
const schema = (0, schema_1.makeExecutableSchema)({
    typeDefs: /* GraphQL */ `
    type Query {
      foo: String
    }
  `,
});
const permissions = (0, graphql_shield_1.shield)({});
describe('useGraphQlJit', () => {
    it('does not cause infinite loops', async () => {
        const testkit = (0, testing_1.createTestkit)([
            (0, response_cache_1.useResponseCache)({
                session: () => null,
                ttl: 2000,
                includeExtensionMetadata: true,
            }),
            (0, index_js_1.useGraphQLMiddleware)([permissions]),
        ], schema);
        await testkit.execute(`{ __typename}`);
    });
});
