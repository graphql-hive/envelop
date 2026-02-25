"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const testing_1 = require("@envelop/testing");
const use_validation_rule_js_1 = require("../src/plugins/use-validation-rule.js");
const common_js_1 = require("./common.js");
describe('validate', () => {
    it('Should call before validate and after validate correctly', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        const teskit = (0, testing_1.createTestkit)([spiedPlugin.plugin], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(spiedPlugin.spies.beforeValidate).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.beforeValidate).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
            params: {
                schema: expect.any(graphql_1.GraphQLSchema),
                documentAST: expect.any(Object),
                options: undefined,
                rules: expect.any(Array),
                typeInfo: undefined,
            },
            addValidationRule: expect.any(Function),
            setResult: expect.any(Function),
            setValidationFn: expect.any(Function),
            validateFn: graphql_1.validate,
        });
        expect(spiedPlugin.spies.afterValidate).toHaveBeenCalledTimes(1);
        expect(spiedPlugin.spies.afterValidate).toHaveBeenCalledWith({
            context: expect.any(Object),
            extendContext: expect.any(Function),
            result: [],
            setResult: expect.any(Function),
            valid: true,
        });
    });
    it('Should allow to replace validate function', async () => {
        const replacementFn = jest.fn(graphql_1.validate);
        const teskit = (0, testing_1.createTestkit)([
            {
                onValidate: ({ setValidationFn }) => {
                    setValidationFn(replacementFn);
                },
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(replacementFn).toHaveBeenCalledTimes(1);
        expect(replacementFn).toHaveBeenCalledWith(expect.any(graphql_1.GraphQLSchema), expect.any(Object), expect.any(Array), undefined, undefined);
    });
    it('Should allow to set validation result and avoid running validate', async () => {
        const replacementFn = jest.fn(graphql_1.validate);
        const teskit = (0, testing_1.createTestkit)([
            {
                onValidate: ({ setValidationFn, setResult }) => {
                    setValidationFn(replacementFn);
                    setResult([]);
                },
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(replacementFn).toHaveBeenCalledTimes(0);
    });
    it('Should allow to manipulate validation results during execution and effect result', async () => {
        const e = new graphql_1.GraphQLError('failed');
        const replacementFn = jest.fn(() => {
            return [e];
        });
        const after = jest.fn();
        const teskit = (0, testing_1.createTestkit)([
            {
                onValidate: ({ setValidationFn }) => {
                    setValidationFn(replacementFn);
                    return after;
                },
            },
        ], common_js_1.schema);
        await teskit.execute(common_js_1.query);
        expect(after).toHaveBeenCalledTimes(1);
        expect(after).toHaveBeenCalledWith({
            valid: false,
            result: [e],
            setResult: expect.any(Function),
            context: expect.any(Object),
            extendContext: expect.any(Function),
        });
    });
    it('Should allow to add validation rules (reportError)', async () => {
        const teskit = (0, testing_1.createTestkit)([
            {
                onValidate: ({ addValidationRule }) => {
                    addValidationRule((context) => {
                        context.reportError(new graphql_1.GraphQLError('Invalid!'));
                        return {};
                    });
                },
            },
        ], common_js_1.schema);
        const r = await teskit.execute(common_js_1.query);
        (0, testing_1.assertSingleExecutionValue)(r);
        expect(r.errors).toBeDefined();
        expect(r.errors.length).toBe(1);
        expect(r.errors[0].message).toBe('Invalid!');
    });
    it('Should allow to add validation rules (reportError, `useValidationRule`)', async () => {
        const teskit = (0, testing_1.createTestkit)([
            (0, use_validation_rule_js_1.useValidationRule)((context) => {
                context.reportError(new graphql_1.GraphQLError('Invalid!'));
                return {};
            }),
        ], common_js_1.schema);
        const r = await teskit.execute(common_js_1.query);
        (0, testing_1.assertSingleExecutionValue)(r);
        expect(r.errors).toBeDefined();
        expect(r.errors.length).toBe(1);
        expect(r.errors[0].message).toBe('Invalid!');
    });
    it('Should allow to add validation rules (throw)', async () => {
        const teskit = (0, testing_1.createTestkit)([
            {
                onValidate: ({ addValidationRule }) => {
                    addValidationRule(() => {
                        throw new graphql_1.GraphQLError('Invalid!');
                    });
                },
            },
        ], common_js_1.schema);
        const r = await teskit.execute(common_js_1.query);
        (0, testing_1.assertSingleExecutionValue)(r);
        expect(r.errors).toBeDefined();
        expect(r.errors.length).toBe(1);
        expect(r.errors[0].message).toBe('Invalid!');
    });
    it('Should not replace default rules when adding new ones', async () => {
        const teskit = (0, testing_1.createTestkit)([
            {
                onValidate: ({ addValidationRule }) => {
                    addValidationRule(() => ({}));
                },
            },
        ], common_js_1.schema);
        const r = await teskit.execute('{ woah }');
        (0, testing_1.assertSingleExecutionValue)(r);
        expect(r).toMatchInlineSnapshot(`
      {
        "errors": [
          [GraphQLError: Cannot query field "woah" on type "Query".],
        ],
      }
    `);
    });
    it('should preserve referential stability of the context', async () => {
        const testKit = (0, testing_1.createTestkit)([
            {
                onValidate({ extendContext }) {
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
