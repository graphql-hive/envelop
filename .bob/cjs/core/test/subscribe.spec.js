"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@envelop/testing");
const common_js_1 = require("./common.js");
describe('subscribe', () => {
    it('Should be able to manipulate streams', async () => {
        const streamExecuteFn = async function* () {
            for (const value of ['a', 'b', 'c', 'd']) {
                yield { data: { alphabet: value } };
            }
        };
        const teskit = (0, testing_1.createTestkit)([
            {
                onSubscribe({ setSubscribeFn }) {
                    setSubscribeFn(streamExecuteFn);
                    return {
                        onSubscribeResult: () => {
                            return {
                                onNext: ({ setResult }) => {
                                    setResult({ data: { alphabet: 'x' } });
                                },
                            };
                        },
                    };
                },
            },
        ], common_js_1.schema);
        const result = await teskit.execute(/* GraphQL */ `
      subscription {
        alphabet
      }
    `);
        (0, testing_1.assertStreamExecutionValue)(result);
        const values = await (0, testing_1.collectAsyncIteratorValues)(result);
        expect(values).toEqual([
            { data: { alphabet: 'x' } },
            { data: { alphabet: 'x' } },
            { data: { alphabet: 'x' } },
            { data: { alphabet: 'x' } },
        ]);
    });
    it('Should be able to invoke something after the stream has ended.', async () => {
        expect.assertions(1);
        const streamExecuteFn = async function* () {
            for (const value of ['a', 'b', 'c', 'd']) {
                yield { data: { alphabet: value } };
            }
        };
        const teskit = (0, testing_1.createTestkit)([
            {
                onSubscribe({ setSubscribeFn }) {
                    setSubscribeFn(streamExecuteFn);
                    return {
                        onSubscribeResult: () => {
                            let latestResult;
                            return {
                                onNext: ({ result }) => {
                                    latestResult = result;
                                },
                                onEnd: () => {
                                    expect(latestResult).toEqual({ data: { alphabet: 'd' } });
                                },
                            };
                        },
                    };
                },
            },
        ], common_js_1.schema);
        const result = await teskit.execute(/* GraphQL */ `
      subscription {
        alphabet
      }
    `);
        (0, testing_1.assertStreamExecutionValue)(result);
        await (0, testing_1.collectAsyncIteratorValues)(result);
    });
    it('should preserve referential stability of the context', async () => {
        const streamExecuteFn = async function* () {
            for (const value of ['a', 'b', 'c', 'd']) {
                yield { data: { alphabet: value } };
            }
        };
        const teskit = (0, testing_1.createTestkit)([
            {
                onSubscribe({ setSubscribeFn, extendContext }) {
                    setSubscribeFn(streamExecuteFn);
                    extendContext({ foo: 'bar' });
                },
            },
        ], common_js_1.schema);
        const context = {};
        const result = await teskit.execute(
        /* GraphQL */ `
        subscription {
          alphabet
        }
      `, {}, context);
        (0, testing_1.assertStreamExecutionValue)(result);
        await (0, testing_1.collectAsyncIteratorValues)(result);
        expect(context.foo).toEqual('bar');
    });
    it('error in subscription source causes onSubscribeError hook invocation', async () => {
        const subscribeSource = (async function* () {
            for (const value of ['a', 'b']) {
                yield { message: value };
            }
            throw new Error('Hee Hoo!');
        })();
        let isOnSubscribeErrorHookInvoked = false;
        const teskit = (0, testing_1.createTestkit)([
            {
                onSubscribe() {
                    return {
                        onSubscribeError: () => {
                            isOnSubscribeErrorHookInvoked = true;
                        },
                    };
                },
            },
        ], common_js_1.schema);
        const result = await teskit.execute(
        /* GraphQL */ `
        subscription {
          message
        }
      `, undefined, { subscribeSource });
        (0, testing_1.assertStreamExecutionValue)(result);
        try {
            await (0, testing_1.collectAsyncIteratorValues)(result);
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw new Error('Expected error to be instance of Error');
            }
            expect(err.message).toBe('Hee Hoo!');
        }
        expect(isOnSubscribeErrorHookInvoked).toBe(true);
    });
});
