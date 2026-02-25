"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const testing_1 = require("@envelop/testing");
const common_js_1 = require("./common.js");
describe('parse', () => {
    it('Should call before parse and after parse correctly', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        const teskit = (0, testing_1.createTestkit)([spiedPlugin.plugin], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(spiedPlugin.spies.beforeParse).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.beforeParse).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
            params: {
                options: undefined,
                source: common_js_1.query,
            },
            parseFn: graphql_1.parse,
            setParseFn: expect.any(Function),
            setParsedDocument: expect.any(Function),
        });
        expect(spiedPlugin.spies.afterParse).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.afterParse).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
            result: expect.any(Object),
            replaceParseResult: expect.any(Function),
        });
    });
    it('Should allow to replace parse function with a custom function', async () => {
        const replacementFn = jest.fn(graphql_1.parse);
        const teskit = (0, testing_1.createTestkit)([
            {
                onParse: ({ setParseFn }) => {
                    setParseFn(replacementFn);
                },
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(replacementFn).toHaveBeenCalledTimes(1);
        expect(replacementFn).toHaveBeenCalledWith(common_js_1.query, undefined);
    });
    it('Should allow to set parsed document before actual parsing, and avoid running parseFn', async () => {
        const replacementFn = jest.fn(graphql_1.parse);
        const afterFn = jest.fn();
        const fakeRes = (0, graphql_1.parse)(`query meAlt { me { id }}`);
        const teskit = (0, testing_1.createTestkit)([
            {
                onParse: ({ setParseFn, setParsedDocument }) => {
                    setParseFn(replacementFn);
                    setParsedDocument(fakeRes);
                    return afterFn;
                },
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(replacementFn).toHaveBeenCalledTimes(0);
        expect(afterFn).toHaveBeenCalledTimes(1);
        expect(afterFn).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
            result: fakeRes,
            replaceParseResult: expect.any(Function),
        });
    });
    it('Should allow to manipulate parsed document after parsing', async () => {
        const afterFn = jest.fn(({ result, replaceParseResult }) => {
            const modifiedDoc = (0, graphql_1.visit)(result, {
                Field: node => {
                    if (node.name.value === 'me') {
                        return {
                            ...node,
                            alias: {
                                kind: 'Name',
                                value: 'currentUser',
                            },
                        };
                    }
                    return node;
                },
            });
            replaceParseResult(modifiedDoc);
        });
        const teskit = (0, testing_1.createTestkit)([
            {
                onParse: () => afterFn,
            },
        ], common_js_1.schema);
        const result = await teskit.execute(common_js_1.query);
        (0, testing_1.assertSingleExecutionValue)(result);
        expect(afterFn).toHaveBeenCalledTimes(1);
        expect(result.data?.currentUser).toBeDefined();
        expect(result.data?.me).not.toBeDefined();
    });
    it('should preserve referential stability of the context', async () => {
        const testKit = (0, testing_1.createTestkit)([
            {
                onParse({ extendContext }) {
                    extendContext({ foo: 'bar' });
                    return ({ extendContext }) => {
                        extendContext({ bar: 'foo' });
                    };
                },
            },
        ], common_js_1.schema);
        const context = {};
        await testKit.execute(common_js_1.query, {}, context);
        expect(context.foo).toEqual('bar');
        expect(context.bar).toEqual('foo');
    });
});
