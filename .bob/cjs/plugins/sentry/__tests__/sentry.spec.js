"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const graphql_1 = require("graphql");
const sentry_testkit_1 = tslib_1.__importDefault(require("sentry-testkit"));
const core_1 = require("@envelop/core");
const sentry_1 = require("@envelop/sentry");
const testing_1 = require("@envelop/testing");
const schema_1 = require("@graphql-tools/schema");
const Sentry = tslib_1.__importStar(require("@sentry/node"));
describe('sentry', () => {
    test('report unexpected error', async () => {
        const { testkit: sentryTestkit, sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
      `,
            resolvers: {
                Query: {
                    hello: async () => {
                        throw new Error('Unexpected Error, ok?');
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "hello": null,
        },
        "errors": [
          [GraphQLError: Unexpected Error, ok?],
        ],
      }
    `);
        await Sentry.flush(100);
        const reports = sentryTestkit.reports();
        expect(reports).toHaveLength(1);
        expect(reports[0].error).toMatchObject({
            message: 'Unexpected Error, ok?',
            name: 'Error',
        });
    });
    test('skip reporting expected error', async () => {
        const { testkit: sentryTestkit, sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
      `,
            resolvers: {
                Query: {
                    hello: () => {
                        throw new graphql_1.GraphQLError('Expected Error, ok?');
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "hello": null,
        },
        "errors": [
          [GraphQLError: Expected Error, ok?],
        ],
      }
    `);
        await Sentry.flush(100);
        expect(sentryTestkit.reports()).toHaveLength(0);
    });
    test('report unexpected error with masking', async () => {
        const { testkit: sentryTestkit, sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
      `,
            resolvers: {
                Query: {
                    hello: async () => {
                        throw new Error('Unexpected Error, ok?');
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)(), (0, core_1.useMaskedErrors)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "hello": null,
        },
        "errors": [
          [GraphQLError: Unexpected error.],
        ],
      }
    `);
        await Sentry.flush(100);
        const reports = sentryTestkit.reports();
        console.log(sentryTestkit.transactions());
        expect(reports).toHaveLength(1);
        expect(reports[0].error).toMatchObject({
            message: 'Unexpected Error, ok?',
            name: 'Error',
        });
    });
    test('skip reporting expected error with error masking', async () => {
        const { testkit: sentryTestkit, sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
      `,
            resolvers: {
                Query: {
                    hello: () => {
                        throw new graphql_1.GraphQLError('Expected Error, ok?');
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)(), (0, core_1.useMaskedErrors)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "hello": null,
        },
        "errors": [
          [GraphQLError: Expected Error, ok?],
        ],
      }
    `);
        await Sentry.flush(100);
        expect(sentryTestkit.reports()).toHaveLength(0);
    });
    test('attaches event id to error', async () => {
        const { sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
      `,
            resolvers: {
                Query: {
                    hello: () => {
                        throw new Error('Unexpected Error, ok?');
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(result.errors?.[0].extensions).toEqual({
            sentryEventId: expect.any(String),
        });
    });
    test('reports runtime error', async () => {
        const { testkit: sentryTestkit, sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
      `,
            resolvers: {
                Query: {
                    hello: async () => {
                        return null;
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        expect(result).toMatchInlineSnapshot(`
      {
        "data": null,
        "errors": [
          [GraphQLError: Cannot return null for non-nullable field Query.hello.],
        ],
      }
    `);
        await Sentry.flush(100);
        const reports = sentryTestkit.reports();
        expect(reports).toHaveLength(1);
        expect(reports[0].error).toMatchObject({
            message: 'Cannot return null for non-nullable field Query.hello.',
            name: 'Error',
        });
    });
    test('get the active span', async () => {
        const { testkit: sentryTestkit, sentryTransport } = (0, sentry_testkit_1.default)();
        Sentry.init({
            dsn: 'https://public@sentry.example.com/1',
            transport: sentryTransport,
        });
        let activeSpan;
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
      `,
            resolvers: {
                Query: {
                    hello: async () => {
                        activeSpan = Sentry.getActiveSpan();
                        return 'Hello!';
                    },
                },
            },
        });
        const envelopTestkit = (0, testing_1.createTestkit)([(0, sentry_1.useSentry)()], schema);
        const result = await envelopTestkit.execute('{ hello }');
        expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "hello": "Hello!",
        },
      }
    `);
        expect(activeSpan).not.toBeUndefined();
        // run sentry flush
        await new Promise(res => setTimeout(res, 10));
        const reports = sentryTestkit.reports();
        expect(reports).toHaveLength(0);
    });
});
