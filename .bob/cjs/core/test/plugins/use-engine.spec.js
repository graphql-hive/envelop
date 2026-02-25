"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const core_1 = require("@envelop/core");
const testing_1 = require("@envelop/testing");
const common_js_1 = require("../common.js");
describe('useEngine', () => {
    it('should invoke custom execute', async () => {
        const custom = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([(0, core_1.useEngine)({ execute: custom })], common_js_1.schema);
        await testInstance.execute(common_js_1.query);
        expect(custom).toHaveBeenCalledTimes(1);
    });
    it('should invoke custom subscribe', async () => {
        const custom = jest.fn();
        const testInstance = (0, testing_1.createTestkit)([(0, core_1.useEngine)({ subscribe: custom })], common_js_1.schema);
        await testInstance.execute(common_js_1.subscriptionOperationString);
        expect(custom).toHaveBeenCalledTimes(1);
    });
    it('should invoke custom validate', async () => {
        const custom = jest.fn(graphql_1.validate);
        const testInstance = (0, testing_1.createTestkit)([(0, core_1.useEngine)({ validate: custom })], common_js_1.schema);
        await testInstance.execute(common_js_1.query);
        expect(custom).toHaveBeenCalledTimes(1);
    });
    it('should invoke custom parse', async () => {
        const custom = jest.fn(graphql_1.parse);
        const testInstance = (0, testing_1.createTestkit)([(0, core_1.useEngine)({ parse: custom })], common_js_1.schema);
        await testInstance.execute(common_js_1.query);
        expect(custom).toHaveBeenCalledTimes(1);
    });
});
