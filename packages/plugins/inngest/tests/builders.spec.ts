import { makeExecutableSchema } from '@graphql-tools/schema';
import { parse } from 'graphql';

import { buildLogger } from '../src/logger';

import { buildDataPayload } from '../src/builders';

describe('builders', () => {
  const schema = makeExecutableSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        test: String!
      }
    `,
    resolvers: {
      Query: {
        test: () => 'hello',
      },
    },
  });

  describe('buildDataPayload', () => {
    it('builds named query', async () => {
      const payload = await buildDataPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query TestQuery { test }`),
            contextValue: {},
          },
        },
        result: { errors: [], data: { test: 'hello' } },
        logger: buildLogger({ logging: false }),
      });

      expect(payload).toEqual({
        __graphql: { operation: 'query', operationId: 'test-query', operationName: 'TestQuery', variables: {} },
        test: 'hello',
      });
    });

    it('builds anonymous query', async () => {
      const payload = await buildDataPayload({
        params: {
          executeFn: () => {},
          setExecuteFn: () => {},
          setResultAndStopExecution: () => {},
          extendContext: () => {},
          args: {
            schema,
            document: parse(`query { test }`),
            contextValue: {},
          },
        },
        result: { errors: [], data: { test: 'hello' } },
        logger: buildLogger({ logging: false }),
      });

      expect(payload).toEqual({
        __graphql: {
          operation: 'query',
          operationId: 'anonymous-d32327f2ad0fef67462baf2b8410a2b4b2cc8db57e67bb5b3c95efa595b39f30',
          operationName: '',
          variables: {},
        },
        test: 'hello',
      });
    });
  });
});
