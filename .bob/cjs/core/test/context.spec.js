"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const common_js_1 = require("./common.js");
describe('contextFactory', () => {
    it('Should call before parse and after parse correctly', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        const teskit = (0, testing_1.createTestkit)([spiedPlugin.plugin], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(spiedPlugin.spies.beforeContextBuilding).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.beforeContextBuilding).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
            breakContextBuilding: expect.any(Function),
        });
        expect(spiedPlugin.spies.afterContextBuilding).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.afterContextBuilding).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
        });
    });
    it('Should set initial `createProxy` arguments as initial context', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        const teskit = (0, testing_1.createTestkit)([spiedPlugin.plugin], common_js_1.schema);
        await teskit.execute(common_js_1.query, {}, { test: true });
        expect(spiedPlugin.spies.beforeContextBuilding).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.beforeContextBuilding).toHaveBeenCalledWith({
            context: expect.objectContaining({
                test: true,
            }),
            extendContext: expect.any(Function),
            breakContextBuilding: expect.any(Function),
        });
    });
    it('Should allow to extend context', async () => {
        const afterContextSpy = jest.fn();
        const onExecuteSpy = jest.fn();
        const teskit = (0, testing_1.createTestkit)([
            {
                onContextBuilding({ extendContext }) {
                    extendContext({
                        test: true,
                    });
                    return afterContextSpy;
                },
                onExecute: onExecuteSpy,
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query, {}, {});
        expect(afterContextSpy).toHaveBeenCalledWith({
            context: expect.objectContaining({
                test: true,
            }),
            extendContext: expect.any(Function),
        });
        expect(onExecuteSpy).toHaveBeenCalledWith(expect.objectContaining({
            args: expect.objectContaining({
                contextValue: expect.objectContaining({
                    test: true,
                }),
            }),
        }));
    });
    it('Should allow to provide async function for context extension', async () => {
        const afterContextSpy = jest.fn();
        const onExecuteSpy = jest.fn();
        const teskit = (0, testing_1.createTestkit)([
            {
                onContextBuilding: async ({ extendContext }) => {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    extendContext({
                        test: true,
                    });
                    return afterContextSpy;
                },
                onExecute: onExecuteSpy,
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query, {}, {});
        expect(afterContextSpy).toHaveBeenCalledWith(expect.objectContaining({
            context: expect.objectContaining({
                test: true,
            }),
        }));
        expect(onExecuteSpy).toHaveBeenCalledWith(expect.objectContaining({
            args: expect.objectContaining({
                contextValue: expect.objectContaining({
                    test: true,
                }),
            }),
        }));
    });
    it('Should yield initial context to context error handlers', async () => {
        const registerContextErrorHandlerSpy = jest.fn();
        const contextFactory = () => {
            return {
                contextSoFar: 'all good',
            };
        };
        const throwingContextFactory = () => {
            throw new Error('The server was about to step on a turtle');
        };
        const teskit = (0, testing_1.createTestkit)([
            (0, core_1.useExtendContext)(contextFactory),
            (0, core_1.useExtendContext)(throwingContextFactory),
            {
                onPluginInit({ registerContextErrorHandler }) {
                    registerContextErrorHandler(args => {
                        registerContextErrorHandlerSpy(args);
                    });
                },
            },
        ], common_js_1.schema);
        try {
            await teskit.execute(common_js_1.query, {}, { test: true });
        }
        catch { }
        expect(registerContextErrorHandlerSpy).toHaveBeenCalledWith(expect.objectContaining({
            context: expect.objectContaining({
                contextSoFar: 'all good',
                document: expect.any(Object),
                operation: expect.any(String),
                request: expect.any(Object),
                test: true,
                variables: expect.any(Object),
            }),
            error: new Error('The server was about to step on a turtle'),
            setError: expect.any(Function),
        }));
    });
    it('should preserve referential stability of the context', async () => {
        const testKit = (0, testing_1.createTestkit)([
            {
                onContextBuilding({ extendContext }) {
                    extendContext({ foo: 'bar' });
                    return ({ extendContext }) => {
                        extendContext({ bar: 'foo' });
                    };
                },
            },
        ], common_js_1.schema);
        const context = {};
        await testKit.execute(common_js_1.query, {}, context);
        expect(context).toMatchObject({ foo: 'bar', bar: 'foo' });
    });
});
