"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const push_pull_async_iterable_iterator_1 = require("@n1ru4l/push-pull-async-iterable-iterator");
const common_js_1 = require("../../../core/test/common.js");
const index_js_1 = require("../src/index.js");
describe('useContextValuePerExecuteSubscriptionEvent', () => {
    it('it can be used for injecting a context that is different from the subscription context', async () => {
        expect.assertions(4);
        const { pushValue, asyncIterableIterator } = (0, push_pull_async_iterable_iterator_1.makePushPullAsyncIterableIterator)();
        const subscriptionContextValue = {
            subscribeSource: asyncIterableIterator,
            message: 'this is only used during subscribe phase',
        };
        let counter = 0;
        const testInstance = (0, testing_1.createTestkit)([
            (0, core_1.useExtendContext)(() => subscriptionContextValue),
            (0, index_js_1.useExtendContextValuePerExecuteSubscriptionEvent)(() => ({
                contextPartial: {
                    message: `${counter}`,
                },
            })),
        ], common_js_1.schema);
        const result = await testInstance.execute(common_js_1.subscriptionOperationString);
        (0, testing_1.assertStreamExecutionValue)(result);
        pushValue({});
        for await (const value of result) {
            expect(value.errors).toBeUndefined();
            if (counter === 0) {
                expect(value.data?.message).toEqual('0');
                counter = 1;
                pushValue({});
            }
            else if (counter === 1) {
                expect(value.data?.message).toEqual('1');
                return;
            }
        }
    });
    it('invokes cleanup function after value is published', async () => {
        expect.assertions(3);
        const { pushValue, asyncIterableIterator } = (0, push_pull_async_iterable_iterator_1.makePushPullAsyncIterableIterator)();
        let onEnd = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([
            (0, core_1.useExtendContext)(() => ({ subscribeSource: asyncIterableIterator })),
            (0, index_js_1.useExtendContextValuePerExecuteSubscriptionEvent)(() => ({
                contextPartial: {
                    message: `hi`,
                },
                onEnd,
            })),
        ], common_js_1.schema);
        const result = await testInstance.execute(common_js_1.subscriptionOperationString);
        (0, testing_1.assertStreamExecutionValue)(result);
        pushValue({});
        for await (const value of result) {
            expect(value.errors).toBeUndefined();
            expect(value.data?.message).toEqual('hi');
            expect(onEnd.mock.calls).toHaveLength(1);
            return;
        }
    });
});
