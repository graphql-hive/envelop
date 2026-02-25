"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const graphql_live_query_patch_jsondiffpatch_1 = require("@n1ru4l/graphql-live-query-patch-jsondiffpatch");
const in_memory_live_query_store_1 = require("@n1ru4l/in-memory-live-query-store");
const index_js_1 = require("../src/index.js");
const schema = (0, schema_1.makeExecutableSchema)({
    typeDefs: [
        /* GraphQL */ `
      type Query {
        greetings: [String!]
      }
    `,
        index_js_1.GraphQLLiveDirectiveSDL,
    ],
    resolvers: {
        Query: {
            greetings: (_, __, context) => context.greetings,
        },
    },
});
describe('useLiveQuery', () => {
    it('works with simple schema', async () => {
        const liveQueryStore = new in_memory_live_query_store_1.InMemoryLiveQueryStore();
        const testKit = (0, testing_1.createTestkit)([(0, index_js_1.useLiveQuery)({ liveQueryStore })], schema);
        const contextValue = {
            greetings: ['Hi', 'Sup', 'Ola'],
        };
        const result = await testKit.execute(
        /* GraphQL */ `
        query @live {
          greetings
        }
      `, undefined, contextValue);
        (0, testing_1.assertStreamExecutionValue)(result);
        let current = await result.next();
        expect(current.value).toMatchInlineSnapshot(`
      {
        "data": {
          "greetings": [
            "Hi",
            "Sup",
            "Ola",
          ],
        },
        "isLive": true,
      }
    `);
        contextValue.greetings.reverse();
        liveQueryStore.invalidate('Query.greetings');
        current = await result.next();
        expect(current.value).toMatchInlineSnapshot(`
      {
        "data": {
          "greetings": [
            "Ola",
            "Sup",
            "Hi",
          ],
        },
        "isLive": true,
      }
    `);
        result.return?.();
    });
    it('apply patch middleware', async () => {
        const liveQueryStore = new in_memory_live_query_store_1.InMemoryLiveQueryStore();
        const testKit = (0, testing_1.createTestkit)([
            (0, index_js_1.useLiveQuery)({
                liveQueryStore,
                applyLiveQueryPatchGenerator: graphql_live_query_patch_jsondiffpatch_1.applyLiveQueryJSONDiffPatchGenerator,
            }),
        ], schema);
        const contextValue = {
            greetings: ['Hi', 'Sup', 'Ola'],
        };
        const result = await testKit.execute(
        /* GraphQL */ `
        query @live {
          greetings
        }
      `, undefined, contextValue);
        (0, testing_1.assertStreamExecutionValue)(result);
        let current = await result.next();
        contextValue.greetings.reverse();
        liveQueryStore.invalidate('Query.greetings');
        current = await result.next();
        expect(current.value).toMatchInlineSnapshot(`
      {
        "patch": {
          "greetings": {
            "_1": [
              null,
              1,
              3,
            ],
            "_2": [
              null,
              0,
              3,
            ],
            "_t": "a",
          },
        },
        "revision": 2,
      }
    `);
        result.return?.();
    });
});
