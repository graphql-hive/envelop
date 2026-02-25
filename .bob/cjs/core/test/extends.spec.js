"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@envelop/testing");
const index_js_1 = require("../src/index.js");
const use_envelop_js_1 = require("../src/plugins/use-envelop.js");
const common_js_1 = require("./common.js");
describe('extending envelops', () => {
    it('should allow to extend envelops', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        const baseEnvelop = (0, index_js_1.envelop)({
            plugins: [(0, testing_1.useGraphQLJSEngine)(), (0, index_js_1.useLogger)(), spiedPlugin.plugin],
        });
        const onExecuteChildSpy = jest.fn();
        const instance = (0, index_js_1.envelop)({
            plugins: [
                (0, use_envelop_js_1.useEnvelop)(baseEnvelop),
                (0, index_js_1.useSchema)(common_js_1.schema),
                {
                    onExecute: onExecuteChildSpy,
                },
            ],
        });
        const teskit = (0, testing_1.createTestkit)(instance);
        await teskit.execute(common_js_1.query, {});
        expect(onExecuteChildSpy).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.beforeExecute).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.afterExecute).toHaveBeenCalledTimes(1);
    });
    it('should allow to extend envelops with extended envelop', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        const instance = (0, index_js_1.envelop)({
            plugins: [
                (0, testing_1.useGraphQLJSEngine)(),
                (0, index_js_1.useLogger)(),
                (0, index_js_1.useSchema)(common_js_1.schema),
                (0, use_envelop_js_1.useEnvelop)((0, index_js_1.envelop)({
                    plugins: [
                        (0, use_envelop_js_1.useEnvelop)((0, index_js_1.envelop)({
                            plugins: [spiedPlugin.plugin],
                        })),
                    ],
                })),
            ],
        });
        const teskit = (0, testing_1.createTestkit)(instance);
        await teskit.execute(common_js_1.query, {});
        expect(spiedPlugin.spies.beforeExecute).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.afterExecute).toHaveBeenCalledTimes(1);
    });
});
