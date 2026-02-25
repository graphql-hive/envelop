"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const index_js_1 = require("../src/index.js");
function createMetricName(key, prefix = 'graphql') {
    return `${prefix}.${index_js_1.metricNames[key]}`;
}
describe('StatsD plugin', () => {
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: /* GraphQL */ `
      type Query {
        regularField: String!
        errorField: String
      }
    `,
        resolvers: {
            Query: {
                regularField() {
                    return 'regular';
                },
                errorField() {
                    throw new Error('error');
                },
            },
        },
    });
    function prepare(config) {
        const client = {
            increment: jest.fn(),
            histogram: jest.fn(),
        };
        const plugin = (0, index_js_1.useStatsD)({
            ...config,
            client,
        });
        const teskit = (0, testing_1.createTestkit)([plugin, (0, core_1.useExtendContext)(() => new Promise(resolve => setTimeout(resolve, 250)))], schema);
        return {
            execute: teskit.execute,
            plugin,
            client,
        };
    }
    test('increase error_count and count on parse error', async () => {
        const { execute, client } = prepare({});
        const result = await execute('query {');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors?.length).toBe(1);
        expect(client.histogram).not.toHaveBeenCalled();
        expect(client.increment).toHaveBeenCalledTimes(2);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('errorCount'), undefined);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('operationCount'), undefined);
    });
    test('increase error_count and count on validate error', async () => {
        const { execute, client } = prepare({});
        const result = await execute('query test($v: String!) { regularField }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors?.length).toBe(1);
        expect(client.histogram).not.toHaveBeenCalled();
        expect(client.increment).toHaveBeenCalledTimes(2);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('errorCount'), {
            operation: 'test',
        });
        expect(client.increment).toHaveBeenCalledWith(createMetricName('operationCount'), {
            operation: 'test',
        });
    });
    test('increase error_count and count on graphql error', async () => {
        const { execute, client } = prepare({});
        const result = await execute('query test { errorField }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors?.length).toBe(1);
        expect(client.histogram).not.toHaveBeenCalled();
        expect(client.increment).toHaveBeenCalledTimes(2);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('errorCount'), {
            operation: 'test',
        });
        expect(client.increment).toHaveBeenCalledWith(createMetricName('operationCount'), {
            operation: 'test',
        });
    });
    test('increase count and update histogram on successful operation', async () => {
        const { execute, client } = prepare({});
        const result = await execute('query test { regularField }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(client.increment).toHaveBeenCalledTimes(1);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('operationCount'), {
            operation: 'test',
        });
        expect(client.histogram).toHaveBeenCalledTimes(1);
        expect(client.histogram).toHaveBeenCalledWith(createMetricName('latency'), expect.any(Number), {
            operation: 'test',
        });
    });
    test('support custom prefix', async () => {
        const prefix = 'gql';
        const { execute, client } = prepare({ prefix });
        const result = await execute('query test { regularField }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(client.increment).toHaveBeenCalledTimes(1);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('operationCount', prefix), {
            operation: 'test',
        });
        expect(client.histogram).toHaveBeenCalledTimes(1);
        expect(client.histogram).toHaveBeenCalledWith(createMetricName('latency', prefix), expect.any(Number), {
            operation: 'test',
        });
    });
    test('do not skip on introspection by default', async () => {
        const { execute, client } = prepare({});
        const result = await execute((0, graphql_1.getIntrospectionQuery)());
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(client.increment).toHaveBeenCalledTimes(1);
        expect(client.increment).toHaveBeenCalledWith(createMetricName('operationCount'), {
            operation: 'IntrospectionQuery',
        });
        expect(client.histogram).toHaveBeenCalledTimes(1);
        expect(client.histogram).toHaveBeenCalledWith(createMetricName('latency'), expect.any(Number), {
            operation: 'IntrospectionQuery',
        });
    });
    test('skip on introspection on demand', async () => {
        const { execute, client } = prepare({ skipIntrospection: true });
        const result = await execute((0, graphql_1.getIntrospectionQuery)());
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors).toBeUndefined();
        expect(client.increment).not.toHaveBeenCalled();
        expect(client.histogram).not.toHaveBeenCalled();
    });
});
