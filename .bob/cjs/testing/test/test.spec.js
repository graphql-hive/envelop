"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
describe('Test the testkit', () => {
    const createSchema = () => (0, schema_1.makeExecutableSchema)({
        typeDefs: /* GraphQL */ `
        type Query {
          foo: String
          bar: String
          fromContext: String
        }
      `,
        resolvers: {
            Query: {
                foo: () => '1',
                bar: () => '2',
                fromContext: (root, args, context) => context.replaced,
            },
        },
    });
    it('Should replace parse function', async () => {
        const neverCalled = {
            onParse: jest.fn(),
        };
        const testkit = (0, testing_1.createTestkit)([neverCalled], createSchema());
        testkit.mockPhase({ phase: 'parse', fn: () => (0, graphql_1.parse)('query test { foo }') });
        const result = await testkit.execute('query test { bar }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data.foo).toBeDefined();
        expect(result.data.bar).not.toBeDefined();
        expect(neverCalled.onParse).not.toHaveBeenCalled();
    });
    it('Should replace validate function', async () => {
        const neverCalled = {
            onValidate: jest.fn(),
        };
        const testkit = (0, testing_1.createTestkit)([neverCalled], createSchema());
        testkit.mockPhase({ phase: 'validate', fn: () => [new graphql_1.GraphQLError('test')] });
        const result = await testkit.execute('query test { bar }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data).not.toBeDefined();
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].message).toBe('test');
        expect(neverCalled.onValidate).not.toHaveBeenCalled();
    });
    it('Should replace execute function', async () => {
        const neverCalled = {
            onExecute: jest.fn(),
        };
        const testkit = (0, testing_1.createTestkit)([neverCalled], createSchema());
        testkit.mockPhase({ phase: 'execute', fn: () => ({ data: { boop: true }, errros: [] }) });
        const result = await testkit.execute('query test { bar }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data.boop).toBeDefined();
        expect(result.data.bar).not.toBeDefined();
        expect(result.data.foo).not.toBeDefined();
        expect(neverCalled.onExecute).not.toHaveBeenCalled();
    });
    it('Should replace contextFactory function', async () => {
        const neverCalled = {
            onContextBuilding: jest.fn().mockReturnValue({ v: 1 }),
        };
        const testkit = (0, testing_1.createTestkit)([neverCalled], createSchema());
        testkit.mockPhase({ phase: 'contextFactory', fn: async () => ({ replaced: 'mockedValue' }) });
        const result = await testkit.execute('query test { fromContext }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.data.fromContext).toBe('mockedValue');
        expect(neverCalled.onContextBuilding).not.toHaveBeenCalled();
    });
    it('Should allow to override plugins', async () => {
        const addedPlugin = {
            onParse: jest.fn().mockReturnValue(undefined),
            onValidate: jest.fn().mockReturnValue(undefined),
        };
        const testkit = (0, testing_1.createTestkit)([], createSchema());
        testkit.modifyPlugins(plugins => [addedPlugin]);
        const result = await testkit.execute('query test { foo }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(addedPlugin.onParse).toHaveBeenCalled();
        expect(addedPlugin.onValidate).toHaveBeenCalled();
        expect(result.data).toBeDefined();
    });
    it('Should use only 1 plugin', async () => {
        const plugin1 = {
            onParse: jest.fn().mockReturnValue(undefined),
        };
        const plugin2 = {
            onValidate: jest.fn().mockReturnValue(undefined),
        };
        const testkit = (0, testing_1.createTestkit)([plugin1, false && plugin2], createSchema());
        const result = await testkit.execute('query test { foo }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(plugin1.onParse).toHaveBeenCalled();
        expect(plugin2.onValidate).not.toHaveBeenCalled();
        expect(result.data).toBeDefined();
    });
});
