"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const GraphQLJS = tslib_1.__importStar(require("graphql"));
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const executor_1 = require("@graphql-tools/executor");
const schema_1 = require("@graphql-tools/schema");
const utils_1 = require("@graphql-tools/utils");
const repeater_1 = require("@repeaterjs/repeater");
const use_error_handler_js_1 = require("../../src/plugins/use-error-handler.js");
const common_js_1 = require("../common.js");
describe('useErrorHandler', () => {
    it('should invoke error handler when error happens during execution', async () => {
        const testError = new Error('Foobar');
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          foo: String
        }
      `,
            resolvers: {
                Query: {
                    foo: () => {
                        throw testError;
                    },
                },
            },
        });
        const mockHandler = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([(0, use_error_handler_js_1.useErrorHandler)(mockHandler)], schema);
        await testInstance.execute(`query { foo }`, {}, { foo: 'bar' });
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({ phase: 'execution' }));
    });
    it('should invoke error handler when error happens during parse', async () => {
        expect.assertions(2);
        const mockHandler = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([(0, use_error_handler_js_1.useErrorHandler)(mockHandler)], common_js_1.schema);
        await testInstance.execute(`query { me `, {});
        expect(mockHandler).toHaveBeenCalledTimes(1);
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
            phase: 'parse',
        }));
    });
    it('should invoke error handler on validation error', async () => {
        expect.assertions(2);
        const useMyFailingValidator = {
            onValidate(payload) {
                payload.setValidationFn(() => {
                    return [(0, utils_1.createGraphQLError)('Failure!')];
                });
            },
        };
        const mockHandler = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([useMyFailingValidator, (0, use_error_handler_js_1.useErrorHandler)(mockHandler)], common_js_1.schema);
        await testInstance.execute(`query { iDoNotExistsMyGuy }`, {});
        expect(mockHandler).toHaveBeenCalledTimes(1);
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
            phase: 'validate',
        }));
    });
    it('should invoke error handle for context errors', async () => {
        expect.assertions(2);
        const mockHandler = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, core_1.useExtendContext)(() => {
                throw new Error('No context for you!');
            }),
            (0, use_error_handler_js_1.useErrorHandler)(mockHandler),
        ], common_js_1.schema);
        try {
            await testInstance.execute(`query { me { name } }`);
        }
        catch {
            expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
                phase: 'context',
            }));
            expect(mockHandler).toHaveBeenCalledTimes(1);
        }
    });
    it('should invoke error handler when error happens during subscription resolver call', async () => {
        const testError = new Error('Foobar');
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          _: String
        }
        type Subscription {
          foo: String
        }
      `,
            resolvers: {
                Subscription: {
                    foo: {
                        subscribe: () => new repeater_1.Repeater(async (push, end) => {
                            await push(1);
                            end();
                        }),
                        resolve: () => {
                            throw new Error('Foobar');
                        },
                    },
                },
            },
        });
        const mockHandler = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([(0, use_error_handler_js_1.useErrorHandler)(mockHandler)], schema);
        const result = await testInstance.execute(`subscription { foo }`, {}, { foo: 'bar' });
        (0, testing_1.assertStreamExecutionValue)(result);
        await (0, testing_1.collectAsyncIteratorValues)(result);
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
            errors: expect.arrayContaining([testError]),
            phase: 'execution',
        }));
    });
    it('should invoke error handler when error happens during incremental execution', async () => {
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        directive @defer on FRAGMENT_SPREAD | INLINE_FRAGMENT

        type Query {
          foo: String
        }
      `,
            resolvers: {
                Query: {
                    foo: () => {
                        throw new Error('kaboom');
                    },
                },
            },
        });
        const mockHandler = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, core_1.useEngine)({ ...GraphQLJS, execute: executor_1.normalizedExecutor, subscribe: executor_1.normalizedExecutor }),
            (0, use_error_handler_js_1.useErrorHandler)(mockHandler),
        ], schema);
        const result = await testInstance.execute(`query { ... @defer { foo } }`);
        (0, testing_1.assertStreamExecutionValue)(result);
        await (0, testing_1.collectAsyncIteratorValues)(result);
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({ phase: 'execution' }));
    });
});
