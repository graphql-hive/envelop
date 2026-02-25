"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const lru_cache_1 = require("lru-cache");
const parser_cache_1 = require("@envelop/parser-cache");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
describe('useGraphQlJit', () => {
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: /* GraphQL */ `
      type Query {
        test: String!
      }
      type Subscription {
        count: Int!
      }
    `,
        resolvers: {
            Query: {
                test: async () => 'boop',
            },
            Subscription: {
                count: {
                    async *subscribe() {
                        for (let i = 0; i < 10; i++) {
                            yield { count: i };
                        }
                    },
                },
            },
        },
    });
    it('Should override execute function', async () => {
        const onExecuteSpy = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useGraphQlJit)(),
            {
                onExecute: onExecuteSpy,
            },
        ], schema);
        await testInstance.execute(`query { test }`);
        expect(onExecuteSpy).toHaveBeenCalledTimes(1);
        expect(onExecuteSpy.mock.calls[0][0].executeFn).not.toBe(graphql_1.execute);
    });
    it('Should override subscribe function', async () => {
        const onSubscribeSpy = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useGraphQlJit)(),
            {
                onSubscribe: onSubscribeSpy,
            },
        ], schema);
        await testInstance.execute(`subscription { count }`);
        expect(onSubscribeSpy).toHaveBeenCalledTimes(1);
        expect(onSubscribeSpy.mock.calls[0][0].subscribeFn).not.toBe(graphql_1.subscribe);
    });
    it('Should not override execute function when enableIf returns false', async () => {
        const onExecuteSpy = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useGraphQlJit)({}, {
                enableIf: () => false,
            }),
            {
                onExecute: onExecuteSpy,
            },
        ], schema);
        await testInstance.execute(`query { test }`);
        expect(onExecuteSpy).toHaveBeenCalledTimes(1);
        expect(onExecuteSpy.mock.calls[0][0].executeFn).toBe(graphql_1.execute);
        expect(onExecuteSpy.mock.calls[0][0].executeFn.name).not.toBe('jitExecutor');
    });
    it('Should not override subscribe function when enableIf returns false', async () => {
        const onSubscribeSpy = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useGraphQlJit)({}, {
                enableIf: () => false,
            }),
            {
                onSubscribe: onSubscribeSpy,
            },
        ], schema);
        await testInstance.execute(`subscription { count }`);
        expect(onSubscribeSpy).toHaveBeenCalledTimes(1);
        expect(onSubscribeSpy.mock.calls[0][0].subscribeFn).toBe(graphql_1.subscribe);
        expect(onSubscribeSpy.mock.calls[0][0].subscribeFn.name).not.toBe('jitSubscriber');
    });
    it('Should execute correctly', async () => {
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.useGraphQlJit)()], schema);
        const result = await testInstance.execute(`query { test }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data?.test).toBe('boop');
    });
    it('Should subscribe correctly', async () => {
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.useGraphQlJit)()], schema);
        const result = await testInstance.execute(`subscription { count }`);
        (0, testing_1.assertStreamExecutionValue)(result);
        const values = await (0, testing_1.collectAsyncIteratorValues)(result);
        for (let i = 0; i < 10; i++) {
            expect(values[i].data?.count).toBe(i);
        }
    });
    it('Should use the provided cache instance', async () => {
        const cache = new lru_cache_1.LRUCache({
            max: 100,
        });
        jest.spyOn(cache, 'set');
        jest.spyOn(cache, 'get');
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useGraphQlJit)({}, {
                cache,
            }),
        ], schema);
        await testInstance.execute(`query { test }`);
        expect(cache.get).toHaveBeenCalled();
        expect(cache.set).toHaveBeenCalled();
    });
    it('never hits LRU cache when parsed document is cached', async () => {
        const cache = new lru_cache_1.LRUCache({
            max: 100,
        });
        jest.spyOn(cache, 'set');
        jest.spyOn(cache, 'get');
        const testInstance = (0, testing_1.createTestkit)([
            (0, parser_cache_1.useParserCache)(),
            (0, index_js_1.useGraphQlJit)({}, {
                cache,
            }),
        ], schema);
        await testInstance.execute(`query { test }`);
        await testInstance.execute(`query { test }`);
        await testInstance.execute(`query { test }`);
        expect(cache.get).toHaveBeenCalledTimes(1);
        expect(cache.set).toHaveBeenCalledTimes(1);
    });
    it('provides a custom serializer', async () => {
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.useGraphQlJit)()], schema);
        const result = (await testInstance.execute(`query { test }`));
        expect(result.stringify?.(result)).toMatch(JSON.stringify({
            data: {
                test: 'boop',
            },
        }));
    });
});
