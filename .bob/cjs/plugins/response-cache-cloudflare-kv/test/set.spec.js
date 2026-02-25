"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_key_js_1 = require("../src/cache-key.js");
const invalidate_js_1 = require("../src/invalidate.js");
const set_js_1 = require("../src/set.js");
describe('set.test.ts', () => {
    let maxTtl;
    let KV;
    const keyPrefix = 'vitest';
    const dataValue = {
        errors: [],
        data: { key: 'value' },
        extensions: { extensions: 'value' },
    };
    const dataKey = '1B9502F92EFA53AFF0AC650794AA79891E4B6900';
    async function collectAllKeys(prefix) {
        const keys = [];
        for await (const kvKey of (0, invalidate_js_1.getAllKvKeysForPrefix)(prefix, KV)) {
            keys.push(kvKey);
        }
        return keys;
    }
    describe('set()', () => {
        beforeEach(() => {
            // @ts-expect-error - Unable to get jest-environment-miniflare/globals working the test/build setup
            const env = getMiniflareBindings();
            KV = env.GRAPHQL_RESPONSE_CACHE;
            maxTtl = 60 * 1000; // 1 minute
        });
        test('should save the operation and entity keys in the KV store', async () => {
            await (0, set_js_1.set)(dataKey, dataValue, [{ typename: 'User' }, { typename: 'User', id: 1 }, { typename: 'User', id: 2 }], maxTtl, KV, keyPrefix);
            const operationKey = (0, cache_key_js_1.buildOperationKey)(dataKey, keyPrefix);
            const operationKeyWithoutPrefix = (0, cache_key_js_1.buildOperationKey)(dataKey);
            const entityTypeKey = (0, cache_key_js_1.buildEntityKey)('User', undefined, keyPrefix);
            const entityKey1 = (0, cache_key_js_1.buildEntityKey)('User', 1, keyPrefix);
            const entityKey2 = (0, cache_key_js_1.buildEntityKey)('User', 2, keyPrefix);
            const allKeys = await collectAllKeys(keyPrefix);
            expect(allKeys.length).toEqual(4);
            expect(allKeys.find(k => k.name === operationKey)).toBeDefined();
            expect(allKeys.find(k => k.name === operationKey)?.metadata).toEqual({ operationKey });
            expect(allKeys.find(k => k.name === `${entityTypeKey}:${operationKeyWithoutPrefix}`)).toBeDefined();
            expect(allKeys.find(k => k.name === `${entityTypeKey}:${operationKeyWithoutPrefix}`)?.metadata).toEqual({ operationKey });
            expect(allKeys.find(k => k.name === `${entityKey1}:${operationKeyWithoutPrefix}`)).toBeDefined();
            expect(allKeys.find(k => k.name === `${entityKey1}:${operationKeyWithoutPrefix}`)?.metadata).toEqual({ operationKey });
            expect(allKeys.find(k => k.name === `${entityKey2}:${operationKeyWithoutPrefix}`)).toBeDefined();
            expect(allKeys.find(k => k.name === `${entityKey2}:${operationKeyWithoutPrefix}`)?.metadata).toEqual({ operationKey });
        });
        test('should function even if there are no entities', async () => {
            await (0, set_js_1.set)(dataKey, dataValue, [], maxTtl, KV, keyPrefix);
            const operationKey = (0, cache_key_js_1.buildOperationKey)(dataKey, keyPrefix);
            const operationKeyWithoutPrefix = (0, cache_key_js_1.buildOperationKey)(dataKey);
            const allKeys = await collectAllKeys(keyPrefix);
            expect(allKeys.length).toEqual(1);
            expect(allKeys.find(k => k.name === operationKey)).toBeDefined();
            expect(allKeys.find(k => k.name === operationKey)?.metadata).toEqual({ operationKey });
            expect(allKeys.find(k => k.name ===
                `${(0, cache_key_js_1.buildEntityKey)('User', undefined, keyPrefix)}:${operationKeyWithoutPrefix}`)).toBeUndefined();
        });
    });
});
