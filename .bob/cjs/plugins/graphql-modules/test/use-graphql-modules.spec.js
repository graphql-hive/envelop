"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const graphql_1 = require("graphql");
const graphql_modules_1 = require("graphql-modules");
require("reflect-metadata");
const testing_1 = require("@envelop/testing");
const index_js_1 = require("../src/index.js");
function createApp(onDestroy) {
    let TestProvider = class TestProvider {
        constructor() { }
        getFoo() {
            return 'testFoo';
        }
        getBar() {
            return 'testBar';
        }
        onDestroy() {
            onDestroy();
        }
    };
    TestProvider = tslib_1.__decorate([
        (0, graphql_modules_1.Injectable)({
            scope: graphql_modules_1.Scope.Operation,
        }),
        tslib_1.__metadata("design:paramtypes", [])
    ], TestProvider);
    return (0, graphql_modules_1.createApplication)({
        modules: [
            (0, graphql_modules_1.createModule)({
                id: 'test',
                typeDefs: (0, graphql_1.parse)(/* GraphQL */ `
          type Query {
            foo: String
          }

          type Subscription {
            bar: String
          }
        `),
                providers: [TestProvider],
                resolvers: {
                    Query: {
                        foo: (root, args, { injector }) => injector.get(TestProvider).getFoo(),
                    },
                    Subscription: {
                        bar: {
                            subscribe: async function* (root, args, { injector }) {
                                yield injector.get(TestProvider).getBar();
                            },
                            resolve: (id) => id,
                        },
                    },
                },
            }),
        ],
    });
}
describe('useGraphQLModules', () => {
    test('query operation', async () => {
        let isDestroyed = false;
        const app = createApp(() => {
            isDestroyed = true;
        });
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.useGraphQLModules)(app)]);
        const result = await testInstance.execute(`query { foo }`);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data?.foo).toBe('testFoo');
        expect(isDestroyed).toEqual(true);
    });
    test('subscription operation', async () => {
        let isDestroyed = false;
        const app = createApp(() => {
            isDestroyed = true;
        });
        const testInstance = (0, testing_1.createTestkit)([(0, index_js_1.useGraphQLModules)(app)]);
        const resultStream = await testInstance.execute(`subscription { bar }`);
        (0, testing_1.assertStreamExecutionValue)(resultStream);
        const allResults = await (0, testing_1.collectAsyncIteratorValues)(resultStream);
        expect(allResults).toHaveLength(1);
        expect(allResults[0]?.data?.bar).toEqual('testBar');
        expect(isDestroyed).toEqual(true);
    });
});
