"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
describe('usePreloadAssets', () => {
    const imageUrl = 'https://localhost/some-asset.png';
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: `type Query { imageUrl: String! noAsset: String! }`,
        resolvers: {
            Query: {
                imageUrl: (_, __, context) => {
                    context.registerPreloadAsset(imageUrl);
                    return Promise.resolve(imageUrl);
                },
                noAsset: () => Promise.resolve('hi'),
            },
        },
    });
    it('Should include assets to preload', async () => {
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.usePreloadAssets)()], schema);
        const result = await testInstance.execute(`query { imageUrl }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(result.extensions).toEqual({
            preloadAssets: ['https://localhost/some-asset.png'],
        });
    });
    it('Should not include the preload extension if no asset should be preloaded', async () => {
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.usePreloadAssets)()], schema);
        const result = await testInstance.execute(`query { noAsset }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(result.extensions).toBeUndefined();
    });
    it('Should not include preload extension if asset preloading is disabled via shouldPreloadAssets', async () => {
        const testInstance = (0, testing_1.createTestkit)([
            (0, core_1.useExtendContext)(() => ({ shouldPreloadAssets: false })),
            (0, index_js_1.usePreloadAssets)({ shouldPreloadAssets: context => context.shouldPreloadAssets }),
        ], schema);
        const result = await testInstance.execute(`query { imageUrl }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(result.extensions).toBeUndefined();
    });
});
