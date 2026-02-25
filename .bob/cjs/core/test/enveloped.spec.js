"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@envelop/testing");
const common_1 = require("./common");
describe('enveloped', () => {
    it('should preserve referential stability of the context', async () => {
        const testKit = (0, testing_1.createTestkit)([
            {
                onEnveloped({ extendContext }) {
                    extendContext({ foo: 'bar' });
                },
            },
        ], common_1.schema);
        const context = {};
        await testKit.execute(common_1.query, {}, context);
        expect(context.foo).toEqual('bar');
    });
});
