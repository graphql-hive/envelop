"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_keyvaluecache_1 = require("@apollo/utils.keyvaluecache");
require("reflect-metadata");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
describe('useApolloDataSources', () => {
    it('should use InMemoryLRUCache by default', async () => {
        const initialize = jest.fn();
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: `type Query { foo: String }`,
            resolvers: {
                Query: {
                    foo: () => 'foo',
                },
            },
        });
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useApolloDataSources)({
                dataSources() {
                    return {
                        foo: {
                            initialize,
                        },
                    };
                },
            }),
        ], schema);
        const result = await testInstance.execute(`query { foo }`, {}, {
            initialContextValue: true,
        });
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(result.data).toBeDefined();
        expect(initialize).toHaveBeenCalledTimes(1);
        const dataSourceConfig = initialize.mock.calls[0][0];
        expect(dataSourceConfig.cache).toBeInstanceOf(utils_keyvaluecache_1.InMemoryLRUCache);
        expect(dataSourceConfig.context).toEqual(expect.objectContaining({
            initialContextValue: true,
        }));
    });
    it('should allow to use custom cache', async () => {
        const initialize = jest.fn();
        const cache = new utils_keyvaluecache_1.InMemoryLRUCache();
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: `type Query { foo: String }`,
            resolvers: {
                Query: {
                    foo: () => 'foo',
                },
            },
        });
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useApolloDataSources)({
                cache,
                dataSources() {
                    return {
                        foo: {
                            initialize,
                        },
                    };
                },
            }),
        ], schema);
        const result = await testInstance.execute(`query { foo }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(result.data).toBeDefined();
        expect(initialize).toHaveBeenCalledTimes(1);
        const dataSourceConfig = initialize.mock.calls[0][0];
        expect(dataSourceConfig.cache).toBe(cache);
    });
});
