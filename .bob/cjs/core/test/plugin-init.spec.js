"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@envelop/testing");
const common_js_1 = require("./common.js");
describe('plugin init', () => {
    describe('addPlugin', () => {
        it('should call plugins in the correct order', async () => {
            let callNumber = 0;
            const createPlugin = (order) => ({
                order,
                onExecute() {
                    expect(callNumber).toBe(order);
                    callNumber++;
                },
            });
            const teskit = (0, testing_1.createTestkit)([
                createPlugin(0),
                {
                    onPluginInit({ addPlugin }) {
                        addPlugin(createPlugin(1));
                        addPlugin(createPlugin(2));
                    },
                },
                {
                    onPluginInit({ addPlugin }) {
                        addPlugin(createPlugin(3));
                        addPlugin({
                            onPluginInit({ addPlugin }) {
                                addPlugin(createPlugin(4));
                            },
                        });
                        addPlugin(createPlugin(5));
                    },
                },
                createPlugin(6),
            ], common_js_1.schema);
            await teskit.execute(common_js_1.query, {});
            expect.assertions(7);
        });
    });
});
