"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_key_js_1 = require("../src/cache-key.js");
describe('cacheKey.spec.ts', () => {
    describe('buildOperationKey', () => {
        const operationId = '1B9502F92EFA53AFF0AC650794AA79891E4B6900';
        test('should build a key with no prefix', () => {
            const key = (0, cache_key_js_1.buildOperationKey)(operationId);
            expect(key).toEqual(`operation:${operationId}`);
        });
        test('should build a key with a prefix', () => {
            const key = (0, cache_key_js_1.buildOperationKey)(operationId, 'prefix');
            expect(key).toEqual(`prefix:operation:${operationId}`);
        });
    });
    describe('buildEntityKey', () => {
        const entityTypename = 'User';
        const entityId = '1';
        test('should build a key with no prefix', () => {
            const key = (0, cache_key_js_1.buildEntityKey)(entityTypename, entityId);
            expect(key).toEqual(`entity:${entityTypename}:${entityId}`);
        });
        test('should build a key with a prefix', () => {
            const key = (0, cache_key_js_1.buildEntityKey)(entityTypename, entityId, 'prefix');
            expect(key).toEqual(`prefix:entity:${entityTypename}:${entityId}`);
        });
        test('should build a key with no entity id and no prefix', () => {
            const key = (0, cache_key_js_1.buildEntityKey)(entityTypename);
            expect(key).toEqual(`entity:${entityTypename}`);
        });
        test('should build a key with no entity id and a prefix', () => {
            const key = (0, cache_key_js_1.buildEntityKey)(entityTypename, undefined, 'prefix');
            expect(key).toEqual(`prefix:entity:${entityTypename}`);
        });
    });
});
