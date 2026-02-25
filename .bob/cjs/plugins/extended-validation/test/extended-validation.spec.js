"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
describe('useExtendedValidation', () => {
    it('supports usage of multiple useExtendedValidation in different plugins', async () => {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Query {
        foo: String!
      }
    `);
        const operation = /* GraphQL */ `
      {
        foo
      }
    `;
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useExtendedValidation)({
                rules: [
                    ctx => {
                        return {
                            OperationDefinition() {
                                ctx.reportError(new graphql_1.GraphQLError('No 1'));
                            },
                        };
                    },
                ],
            }),
            (0, index_js_1.useExtendedValidation)({
                rules: [
                    ctx => {
                        return {
                            OperationDefinition() {
                                ctx.reportError(new graphql_1.GraphQLError('No 2'));
                            },
                        };
                    },
                ],
            }),
        ], schema);
        const result = await testInstance.execute(operation);
        expect(result).toMatchInlineSnapshot(`
          {
            "data": null,
            "errors": [
              [GraphQLError: No 1],
              [GraphQLError: No 2],
            ],
          }
        `);
    });
    it('run extended validation phase exactly once if no validation error occurs', async () => {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Query {
        foo: String!
      }
    `);
        const operation = /* GraphQL */ `
      {
        foo
      }
    `;
        let extendedValidationRunCount = 0;
        const testInstance = (0, testing_1.createTestkit)([
            (0, index_js_1.useExtendedValidation)({
                rules: [
                    () => {
                        return {
                            OperationDefinition() {
                                extendedValidationRunCount = extendedValidationRunCount + 1;
                            },
                        };
                    },
                ],
            }),
            (0, index_js_1.useExtendedValidation)({
                rules: [
                    () => {
                        return {
                            OperationDefinition() { },
                        };
                    },
                ],
            }),
        ], schema);
        await testInstance.execute(operation);
        expect(extendedValidationRunCount).toEqual(1);
    });
    it('execute throws an error if "contextFactory" has not been invoked', async () => {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Query {
        foo: String!
      }
    `);
        const operation = /* GraphQL */ `
      {
        foo
      }
    `;
        const { execute } = (0, core_1.envelop)({
            plugins: [
                (0, core_1.useSchema)(schema),
                (0, index_js_1.useExtendedValidation)({
                    rules: [() => ({})],
                }),
            ],
        })();
        await expect(Promise.resolve().then(() => execute({
            document: (0, graphql_1.parse)(operation),
            contextValue: {},
            schema,
        }))).rejects.toThrowErrorMatchingInlineSnapshot(`"Plugin has not been properly set up. The 'contextFactory' function is not invoked and the result has not been passed to 'execute'."`);
    });
    it('subscribe does run the extended validation phase', async () => {
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          foo: String!
        }
        type Subscription {
          foo: String!
        }
      `,
            resolvers: {
                Subscription: {
                    foo: {
                        subscribe: async function* () {
                            return;
                        },
                    },
                },
            },
        });
        const operation = /* GraphQL */ `
      subscription {
        foo
      }
    `;
        let calledExtendedValidationRule = false;
        const testkit = (0, testing_1.createTestkit)([
            (0, index_js_1.useExtendedValidation)({
                rules: [
                    () => {
                        calledExtendedValidationRule = true;
                        return {};
                    },
                ],
            }),
        ], schema);
        const result = await testkit.execute(operation);
        expect(calledExtendedValidationRule).toEqual(true);
    });
    it('subscribe does result in extended validation phase errors', async () => {
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          foo: String!
        }
        type Subscription {
          foo: String!
        }
      `,
            resolvers: {
                Subscription: {
                    foo: {
                        subscribe: async function* () {
                            return;
                        },
                    },
                },
            },
        });
        const operation = /* GraphQL */ `
      subscription {
        foo
      }
    `;
        const testkit = (0, testing_1.createTestkit)([
            (0, index_js_1.useExtendedValidation)({
                rules: [
                    context => {
                        context.reportError(new graphql_1.GraphQLError('Not today.'));
                        return {};
                    },
                ],
            }),
        ], schema);
        const result = await testkit.execute(operation);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          [GraphQLError: Not today.],
        ],
      }
    `);
    });
});
