"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const testing_1 = require("@envelop/testing");
const index_js_1 = require("../src/index.js");
const describeIf = (condition) => (condition ? describe : describe.skip);
describeIf(graphql_1.versionInfo.major >= 16)('useApolloFederation', () => {
    const query = /* GraphQL */ `
    # A query that the gateway resolves by calling all three services
    query GetCurrentUserReviews {
      me {
        username
        reviews {
          body
          product {
            name
            upc
          }
        }
      }
    }
  `;
    let gateway;
    beforeAll(() => {
        const { ApolloGateway, LocalGraphQLDataSource, } = require('@apollo/gateway');
        const accounts = require('./fixtures/accounts');
        const products = require('./fixtures/products');
        const reviews = require('./fixtures/reviews');
        gateway = new ApolloGateway({
            localServiceList: [
                { name: 'accounts', typeDefs: accounts.typeDefs },
                { name: 'products', typeDefs: products.typeDefs },
                { name: 'reviews', typeDefs: reviews.typeDefs },
            ],
            buildService: definition => {
                switch (definition.name) {
                    case 'accounts':
                        return new LocalGraphQLDataSource(accounts.schema);
                    case 'products':
                        return new LocalGraphQLDataSource(products.schema);
                    case 'reviews':
                        return new LocalGraphQLDataSource(reviews.schema);
                }
                throw new Error(`Unknown service ${definition.name}`);
            },
        });
        return gateway.load();
    });
    afterAll(() => gateway.stop());
    const useTestFederation = () => (0, index_js_1.useApolloFederation)({
        gateway,
    });
    it('Should override execute function', async () => {
        const onExecuteSpy = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            useTestFederation(),
            {
                onExecute: onExecuteSpy,
            },
        ]);
        await testInstance.execute(query);
        expect(onExecuteSpy).toHaveBeenCalledTimes(1);
        expect(onExecuteSpy.mock.calls[0][0].executeFn).not.toBe(graphql_1.execute);
        expect(onExecuteSpy.mock.calls[0][0].executeFn.name).toBe('federationExecutor');
    });
    it('Should execute document string correctly', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestFederation()]);
        const result = await testInstance.execute(query);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeFalsy();
        expect(result.data).toMatchInlineSnapshot(`
{
  "me": {
    "reviews": [
      {
        "body": "Love it!",
        "product": {
          "name": "Table",
          "upc": "1",
        },
      },
      {
        "body": "Too expensive.",
        "product": {
          "name": "Couch",
          "upc": "2",
        },
      },
    ],
    "username": "@ada",
  },
}
`);
    });
    it('Should execute parsed document correctly', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestFederation()]);
        const result = await testInstance.execute((0, graphql_1.parse)(query));
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeFalsy();
        expect(result.data).toMatchInlineSnapshot(`
{
  "me": {
    "reviews": [
      {
        "body": "Love it!",
        "product": {
          "name": "Table",
          "upc": "1",
        },
      },
      {
        "body": "Too expensive.",
        "product": {
          "name": "Couch",
          "upc": "2",
        },
      },
    ],
    "username": "@ada",
  },
}
`);
    });
    afterAll(async () => {
        await gateway.stop();
    });
});
