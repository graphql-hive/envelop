import { __decorate, __metadata } from "tslib";
import { parse } from 'graphql';
import { createApplication, createModule, Injectable, Scope } from 'graphql-modules';
import 'reflect-metadata';
import { assertSingleExecutionValue, assertStreamExecutionValue, collectAsyncIteratorValues, createTestkit, } from '@envelop/testing';
import { useGraphQLModules } from '../src/index.js';
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
    TestProvider = __decorate([
        Injectable({
            scope: Scope.Operation,
        }),
        __metadata("design:paramtypes", [])
    ], TestProvider);
    return createApplication({
        modules: [
            createModule({
                id: 'test',
                typeDefs: parse(/* GraphQL */ `
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
        const testInstance = createTestkit([useGraphQLModules(app)]);
        const result = await testInstance.execute(`query { foo }`);
        assertSingleExecutionValue(result);
        expect(result.data?.foo).toBe('testFoo');
        expect(isDestroyed).toEqual(true);
    });
    test('subscription operation', async () => {
        let isDestroyed = false;
        const app = createApp(() => {
            isDestroyed = true;
        });
        const testInstance = createTestkit([useGraphQLModules(app)]);
        const resultStream = await testInstance.execute(`subscription { bar }`);
        assertStreamExecutionValue(resultStream);
        const allResults = await collectAsyncIteratorValues(resultStream);
        expect(allResults).toHaveLength(1);
        expect(allResults[0]?.data?.bar).toEqual('testBar');
        expect(isDestroyed).toEqual(true);
    });
});
