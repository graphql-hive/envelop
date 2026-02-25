"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const testing_1 = require("@envelop/testing");
const common_js_1 = require("./common.js");
describe('schemaChange', () => {
    it('Should trigger schema change initially when schema is available', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        (0, testing_1.createTestkit)([spiedPlugin.plugin], common_js_1.schema);
        expect(spiedPlugin.spies.onSchemaChange).toHaveBeenCalledTimes(1);
    });
    it('Should not trigger schema change initially when schema is not available', async () => {
        const spiedPlugin = (0, testing_1.createSpiedPlugin)();
        (0, testing_1.createTestkit)([spiedPlugin.plugin]);
        expect(spiedPlugin.spies.onSchemaChange).toHaveBeenCalledTimes(0);
    });
    it("Should trigger schema change only for plugins that don't trigger the change itself", async () => {
        const pluginA = { onSchemaChange: jest.fn() };
        const pluginB = { onSchemaChange: jest.fn() };
        let setSchemaFn = (newSchema) => { };
        const pluginTrigger = {
            onSchemaChange: jest.fn(),
            onPluginInit({ setSchema }) {
                setSchemaFn = setSchema;
            },
        };
        (0, testing_1.createTestkit)([pluginA, pluginB, pluginTrigger]);
        const newSchema = (0, graphql_1.buildSchema)(`type Query { foo: String! }`);
        setSchemaFn(newSchema);
        // Should not trigger this one because it's the one triggering the change
        expect(pluginTrigger.onSchemaChange).toHaveBeenCalledTimes(0);
        expect(pluginA.onSchemaChange).toHaveBeenCalledTimes(1);
        expect(pluginB.onSchemaChange).toHaveBeenCalledTimes(1);
    });
    it('should not trigger if the schema is the same', async () => {
        let setSchemaFn = (newSchema) => {
            throw new Error('setSchemaFn not initialized');
        };
        const setSchemaPlugin = {
            onPluginInit({ setSchema }) {
                setSchemaFn = setSchema;
            },
        };
        const onSchemaChangePlugin = {
            onSchemaChange: jest.fn(),
        };
        const newSchema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Query {
        foo: String!
      }
    `);
        (0, testing_1.createTestkit)([setSchemaPlugin, onSchemaChangePlugin]);
        setSchemaFn(common_js_1.schema);
        expect(onSchemaChangePlugin.onSchemaChange).toHaveBeenCalledTimes(1);
        setSchemaFn(common_js_1.schema);
        expect(onSchemaChangePlugin.onSchemaChange).toHaveBeenCalledTimes(1);
        setSchemaFn(newSchema);
        expect(onSchemaChangePlugin.onSchemaChange).toHaveBeenCalledTimes(2);
        setSchemaFn(common_js_1.schema);
        expect(onSchemaChangePlugin.onSchemaChange).toHaveBeenCalledTimes(3);
        setSchemaFn(newSchema);
        expect(onSchemaChangePlugin.onSchemaChange).toHaveBeenCalledTimes(4);
        setSchemaFn(newSchema);
        expect(onSchemaChangePlugin.onSchemaChange).toHaveBeenCalledTimes(4);
    });
});
