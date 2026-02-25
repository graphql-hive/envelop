"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dataloader_1 = tslib_1.__importDefault(require("dataloader"));
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
describe('useDataLoader', () => {
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: `type Query { test: String! }`,
        resolvers: {
            Query: {
                test: (root, args, context) => context.test.load('1'),
            },
        },
    });
    it('Should inject dataloader correctly to context, based on name', async () => {
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useDataLoader)('test', () => new dataloader_1.default(async () => {
                return ['myValue'];
            })),
        ], schema);
        const result = await testInstance.execute(`query { test }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data?.test).toBe('myValue');
    });
});
