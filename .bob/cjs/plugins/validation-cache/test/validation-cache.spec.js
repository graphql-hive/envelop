"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const lru_cache_1 = require("lru-cache");
const testing_1 = require("@envelop/testing");
const index_js_1 = require("../src/index.js");
describe('useValidationCache', () => {
    const testSchema = (0, graphql_1.buildSchema)(/* GraphQL */ `
    type Query {
      foo: String
    }
  `);
    let testValidator;
    let useTestPlugin;
    beforeEach(() => {
        testValidator = jest.fn().mockImplementation((source, options) => (0, graphql_1.validate)(source, options));
        useTestPlugin = {
            onValidate({ setValidationFn }) {
                setValidationFn(testValidator);
            },
        };
    });
    afterEach(() => {
        testValidator.mockReset();
    });
    it('Should call original validate when cache is empty', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useValidationCache)()], testSchema);
        await testInstance.execute(`query { foo }`);
        expect(testValidator).toHaveBeenCalledTimes(1);
    });
    it('Should call validate once once when operation is cached', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useValidationCache)()], testSchema);
        await testInstance.execute(`query { foo }`);
        await testInstance.execute(`query { foo }`);
        await testInstance.execute(`query { foo }`);
        expect(testValidator).toHaveBeenCalledTimes(1);
    });
    it('Should call validate once once when operation is cached and errored', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useValidationCache)()], testSchema);
        const r1 = await testInstance.execute(`query { foo2 }`);
        const r2 = await testInstance.execute(`query { foo2 }`);
        expect(testValidator).toHaveBeenCalledTimes(1);
        expect(r1).toEqual(r2);
    });
    it('Should call validate multiple times on different operations', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useValidationCache)()], testSchema);
        await testInstance.execute(`query t { foo }`);
        await testInstance.execute(`query t2 { foo }`);
        expect(testValidator).toHaveBeenCalledTimes(2);
    });
    it('should call validate multiple times when operation is invalidated', async () => {
        const cache = new lru_cache_1.LRUCache({
            max: 100,
            ttl: 1,
        });
        const testInstance = (0, testing_1.createTestkit)([
            useTestPlugin,
            (0, index_js_1.useValidationCache)({
                cache,
            }),
        ], testSchema);
        await testInstance.execute(`query t { foo }`);
        await testInstance.wait(10);
        await testInstance.execute(`query t { foo }`);
        expect(testValidator).toHaveBeenCalledTimes(2);
    });
    it('should use provided cache instance', async () => {
        const cache = new lru_cache_1.LRUCache({ max: 100 });
        jest.spyOn(cache, 'set');
        jest.spyOn(cache, 'get');
        const testInstance = (0, testing_1.createTestkit)([
            useTestPlugin,
            (0, index_js_1.useValidationCache)({
                cache,
            }),
        ], testSchema);
        await testInstance.execute(`query { foo2 }`);
        await testInstance.execute(`query { foo2 }`);
        expect(cache.get).toHaveBeenCalled();
        expect(cache.set).toHaveBeenCalled();
    });
    it('does not share cache across different validation rules', async () => {
        let counter = 0;
        const plugin = {
            onValidate(ctx) {
                counter = counter + 1;
                if (counter > 1) {
                    ctx.addValidationRule(graphql_1.NoSchemaIntrospectionCustomRule);
                }
            },
        };
        const testInstance = (0, testing_1.createTestkit)([plugin, (0, index_js_1.useValidationCache)()], testSchema);
        let result = await testInstance.execute(`{ __schema { types { name } } }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        result = await testInstance.execute(`{ __schema { types { name } } }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeDefined();
    });
    it('includes schema in the cache key', async () => {
        const schema1 = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Query {
        foo: String
      }
    `);
        const schema2 = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Query {
        foo1: String
      }
    `);
        let currentSchema = schema1;
        const dynamicSchema = {
            onEnveloped({ setSchema }) {
                setSchema(currentSchema);
            },
        };
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, dynamicSchema, (0, index_js_1.useValidationCache)()], testSchema);
        await testInstance.execute(`{ __schema { types { name } } }`);
        expect(testValidator).toHaveBeenCalledTimes(1);
        currentSchema = schema2;
        await testInstance.execute(`{ __schema { types { name } } }`);
        expect(testValidator).toHaveBeenCalledTimes(2);
        currentSchema = schema1;
        await testInstance.execute(`{ __schema { types { name } } }`);
        // should still be two, because the cache key includes the schema
        expect(testValidator).toHaveBeenCalledTimes(2);
    });
});
