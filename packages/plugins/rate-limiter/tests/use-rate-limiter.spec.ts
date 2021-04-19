import { createTestkit } from '@envelop/testing';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { DIRECTIVE_SDL, useRateLimiter } from '../src';

describe('useRateLimiter', () => {
  const delay = (ms: number) => {
      return new Promise( resolve => setTimeout(resolve, ms) );
    }
  const identifyFn = ({}) => '0.0.0.0'

  const schemaWithDirective = makeExecutableSchema({
    typeDefs: `
    ${DIRECTIVE_SDL}
    
    type Query {
      limited: String @rateLimit(
        max: 1,
        window: "100m",
        message: "too many calls"
      ),
      unlimited: String
    }
    `,
    resolvers: {
      Query: {
        limited: (root, args, context) => 'limited',
        unlimited: (root, args, context) => 'unlimited',
      },
    },
  });

  it('Should allow unlimited calls', async () => {
    const testInstance = createTestkit(
      [
        useRateLimiter({
          identifyFn: identifyFn,
        }),
      ],
      schemaWithDirective
    );

    testInstance.execute(`query { unlimited }`);
    testInstance.execute(`query { unlimited }`);
    testInstance.execute(`query { unlimited }`);
    const result = await testInstance.execute(`query { unlimited }`);
    expect(result.errors).toBeUndefined();
    expect(result.data.unlimited).toBe('unlimited');
  });

  it('Should allow calls with enough delay', async () => {
    const testInstance = createTestkit(
      [
        useRateLimiter({
          identifyFn: identifyFn,
        }),
      ],
      schemaWithDirective
    );

    testInstance.execute(`query { limited }`);
    await delay(500);
    const result = await testInstance.execute(`query { limited }`);
    expect(result.errors).toBeUndefined();
    expect(result.data.limited).toBe('limited');
  });

  it('Should limit calls', async () => {
    const testInstance = createTestkit(
      [
        useRateLimiter({
          identifyFn: identifyFn,
        }),
      ],
      schemaWithDirective
    );
    testInstance.execute(`query { limited }`);
    const result = await testInstance.execute(`query { limited }`);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe('too many calls');
    expect(result.errors[0].path).toEqual(['limited']);
  });
});