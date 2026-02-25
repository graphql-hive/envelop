"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const lru_cache_1 = require("lru-cache");
const testing_1 = require("@envelop/testing");
const index_js_1 = require("../src/index.js");
describe('useParserCache', () => {
    const testSchema = (0, graphql_1.buildSchema)(/* GraphQL */ `
    type Query {
      foo: String
    }
  `);
    let testParser;
    let useTestPlugin;
    beforeEach(() => {
        testParser = jest.fn().mockImplementation((source, options) => (0, graphql_1.parse)(source, options));
        useTestPlugin = {
            onParse({ setParseFn }) {
                setParseFn(testParser);
            },
        };
    });
    afterEach(() => {
        testParser.mockReset();
    });
    it('Should call original parse when cache is empty', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useParserCache)()], testSchema);
        await testInstance.execute(`query { foo }`);
        expect(testParser).toHaveBeenCalledTimes(1);
    });
    it('Should call parse once once when operation is cached', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useParserCache)()], testSchema);
        await testInstance.execute(`query { foo }`);
        await testInstance.execute(`query { foo }`);
        await testInstance.execute(`query { foo }`);
        expect(testParser).toHaveBeenCalledTimes(1);
    });
    it('Should call parse once once when operation is cached and errored', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useParserCache)()], testSchema);
        const r1 = await testInstance.execute(`FAILED\ { foo }`);
        (0, testing_1.assertSingleExecutionValue)(r1);
        const r2 = await testInstance.execute(`FAILED\ { foo }`);
        (0, testing_1.assertSingleExecutionValue)(r2);
        expect(testParser).toHaveBeenCalledTimes(1);
        expect(r1.errors[0].message).toBe(`Syntax Error: Unexpected Name "FAILED".`);
        expect(r2.errors[0].message).toBe(`Syntax Error: Unexpected Name "FAILED".`);
        expect(r1).toEqual(r2);
    });
    it('Should call parse multiple times on different operations', async () => {
        const testInstance = (0, testing_1.createTestkit)([useTestPlugin, (0, index_js_1.useParserCache)()], testSchema);
        await testInstance.execute(`query t { foo }`);
        await testInstance.execute(`query t2 { foo }`);
        expect(testParser).toHaveBeenCalledTimes(2);
    });
    it('should call parse multiple times when operation is invalidated', async () => {
        const cache = new lru_cache_1.LRUCache({
            max: 100,
            ttl: 1,
        });
        const testInstance = (0, testing_1.createTestkit)([
            useTestPlugin,
            (0, index_js_1.useParserCache)({
                documentCache: cache,
            }),
        ], testSchema);
        await testInstance.execute(`query t { foo }`);
        await testInstance.wait(10);
        await testInstance.execute(`query t { foo }`);
        expect(testParser).toHaveBeenCalledTimes(2);
    });
    it('should use provided documentCache instance', async () => {
        const documentCache = new lru_cache_1.LRUCache({
            max: 100,
        });
        jest.spyOn(documentCache, 'set');
        jest.spyOn(documentCache, 'get');
        const testInstance = (0, testing_1.createTestkit)([
            useTestPlugin,
            (0, index_js_1.useParserCache)({
                documentCache,
            }),
        ], testSchema);
        await testInstance.execute(`query t { foo }`);
        expect(documentCache.get).toHaveBeenCalled();
        expect(documentCache.set).toHaveBeenCalled();
    });
    it('should use provided documentCache instance', async () => {
        const errorCache = new lru_cache_1.LRUCache({
            max: 100,
        });
        jest.spyOn(errorCache, 'set');
        jest.spyOn(errorCache, 'get');
        const testInstance = (0, testing_1.createTestkit)([
            useTestPlugin,
            (0, index_js_1.useParserCache)({
                errorCache,
            }),
        ], testSchema);
        await testInstance.execute(`FAILED\ { foo }`);
        expect(errorCache.get).toHaveBeenCalled();
        expect(errorCache.set).toHaveBeenCalled();
    });
});
