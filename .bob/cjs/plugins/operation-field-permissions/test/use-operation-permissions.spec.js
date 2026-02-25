"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
const schema = (0, schema_1.makeExecutableSchema)({
    typeDefs: [
        /* GraphQL */ `
      type Query {
        greetings: [String!]
        foo: String
        user: User
        postOrUser: PostOrUser
        node: Node
      }

      type User implements Node {
        id: ID!
      }

      type Post implements Node {
        id: ID!
      }

      union PostOrUser = Post | User
      interface Node {
        id: ID!
      }
    `,
    ],
    resolvers: {},
});
const query = /* GraphQL */ `
  {
    greetings
    foo
    user {
      id
    }
  }
`;
describe('useOperationPermissions', () => {
    it('should skip for introspection query', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => 'boop',
            }),
        ], schema);
        const result = await kit.execute((0, graphql_1.getIntrospectionQuery)());
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
    });
    it('should not skip for extended introspection query', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => 'boop',
            }),
        ], schema);
        const result = await kit.execute(/* GraphQL */ `
      query {
        __schema {
          __typename
        }
        greetings
      }
    `);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toMatchInlineSnapshot(`
      [
        [GraphQLError: Insufficient permissions for selecting 'Query.greetings'.],
      ]
    `);
    });
    it('allow everything', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => '*',
            }),
        ], schema);
        const result = await kit.execute(query);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
    });
    it('allow only one field', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => 'Query.greetings',
            }),
        ], schema);
        const result = await kit.execute(query);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toMatchInlineSnapshot(`
      [
        [GraphQLError: Insufficient permissions for selecting 'Query.foo'.],
        [GraphQLError: Insufficient permissions for selecting 'Query.user'.],
        [GraphQLError: Insufficient permissions for selecting 'User.id'.],
      ]
    `);
    });
    it('allow wildcard for types', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => 'Query.*',
            }),
        ], schema);
        const result = await kit.execute(query);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toMatchInlineSnapshot(`
      [
        [GraphQLError: Insufficient permissions for selecting 'User.id'.],
      ]
    `);
    });
    it('allow selecting specific fields', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => new Set(['Query.greetings', 'Query.foo', 'Query.user', 'User.id']),
            }),
        ], schema);
        const result = await kit.execute(query);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
    });
    it('union errors', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => new Set([]),
            }),
        ], schema);
        const result = await kit.execute(/* GraphQL */ `
      query {
        postOrUser {
          __typename
        }
      }
    `);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toMatchInlineSnapshot(`
      [
        [GraphQLError: Insufficient permissions for selecting 'Query.postOrUser'.],
        [GraphQLError: Insufficient permissions for selecting 'Post.__typename'.],
        [GraphQLError: Insufficient permissions for selecting 'User.__typename'.],
      ]
    `);
    });
    it('interface errors', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => new Set([]),
            }),
        ], schema);
        const result = await kit.execute(/* GraphQL */ `
      query {
        node {
          __typename
        }
      }
    `);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toMatchInlineSnapshot(`
      [
        [GraphQLError: Insufficient permissions for selecting 'Query.node'.],
        [GraphQLError: Insufficient permissions for selecting 'User.__typename'.],
        [GraphQLError: Insufficient permissions for selecting 'Post.__typename'.],
      ]
    `);
    });
    it('includes the node location', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => new Set([]),
            }),
        ], schema);
        const result = await kit.execute(/* GraphQL */ `
      query {
        __typename
      }
    `);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeDefined();
        const [error] = result.errors;
        expect(error.nodes).toBeDefined();
    });
    it('allows introspection with permissions', async () => {
        const kit = (0, testing_1.createTestkit)([
            (0, index_js_1.useOperationFieldPermissions)({
                getPermissions: () => new Set(['Query.__schema', 'Query.__type', 'Query.__typename']),
            }),
        ], schema);
        const result = await kit.execute((0, graphql_1.getIntrospectionQuery)({
            specifiedByUrl: true,
            directiveIsRepeatable: true,
            schemaDescription: true,
            inputValueDeprecation: true,
        }));
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
    });
});
