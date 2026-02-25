"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_key_js_1 = require("../src/cache-key.js");
const invalidate_js_1 = require("../src/invalidate.js");
const set_js_1 = require("../src/set.js");
const keyPrefix = 'vitest';
let maxTtl;
let KV;
async function collectAllKeys(prefix) {
    const keys = [];
    for await (const kvKey of (0, invalidate_js_1.getAllKvKeysForPrefix)(prefix, KV)) {
        keys.push(kvKey);
    }
    return keys;
}
describe('invalidate.test.ts', () => {
    beforeEach(() => {
        // @ts-expect-error - Unable to get jest-environment-miniflare/globals working the test/build setup
        const env = getMiniflareBindings();
        KV = env.GRAPHQL_RESPONSE_CACHE;
        maxTtl = 60 * 1000; // 1 minute
    });
    describe('_getAllKvKeysForPrefix()', () => {
        test('should successfully iterate over a KV namespace with no keys', async () => {
            // kv cache has no keys at this point
            const keys = [];
            for await (const kvKey of (0, invalidate_js_1.getAllKvKeysForPrefix)(keyPrefix, KV)) {
                keys.push(kvKey);
            }
            expect(keys).toEqual([]);
        });
        test('should successfully iterate over a KV namespace with less than 1000 keys', async () => {
            // setup kv cache
            for (let i = 0; i < 500; i++) {
                await KV.put(`${keyPrefix}:entity:User:${i}`, 'value', {
                    metadata: { operationKey: `${keyPrefix}:operation:${i}` },
                });
            }
            const keys = [];
            for await (const kvKey of (0, invalidate_js_1.getAllKvKeysForPrefix)(keyPrefix, KV)) {
                keys.push(kvKey);
                const userId = kvKey.name.split(':')[3];
                expect(kvKey.metadata).toEqual({
                    operationKey: `${keyPrefix}:operation:${userId}`,
                });
            }
            expect(keys.length).toEqual(500);
        });
        test('should successfully iterate over a KV namespace with more than 1000 keys', async () => {
            // setup kv cache
            for (let i = 0; i < 1500; i++) {
                await KV.put(`${keyPrefix}:entity:User:${i}`, 'value', {
                    metadata: { operationKey: `${keyPrefix}:operation:${i}` },
                });
            }
            const keys = [];
            for await (const kvKey of (0, invalidate_js_1.getAllKvKeysForPrefix)(keyPrefix, KV)) {
                keys.push(kvKey);
                const indexId = kvKey.name.split(':')[3];
                expect(kvKey.metadata).toEqual({
                    operationKey: `${keyPrefix}:operation:${indexId}`,
                });
            }
            expect(keys.length).toEqual(1500);
        });
    });
    describe('invalidate()', () => {
        const dataValue = {
            errors: [],
            data: { key: 'value' },
            extensions: { extensions: 'value' },
        };
        const dataKey = '1B9502F92EFA53AFF0AC650794AA79891E4B6900';
        test('should invalidate all entity keys given only a type', async () => {
            await (0, set_js_1.set)(dataKey, dataValue, [{ typename: 'User' }, { typename: 'User', id: 1 }, { typename: 'User', id: 2 }], maxTtl, KV, keyPrefix);
            await (0, invalidate_js_1.invalidate)([{ typename: 'User' }], KV, keyPrefix);
            const allKeys = await collectAllKeys(keyPrefix);
            expect(allKeys.length).toEqual(0);
        });
        test('should invalidate only given entity and operation key', async () => {
            await (0, set_js_1.set)(dataKey, dataValue, [{ typename: 'User' }, { typename: 'User', id: 1 }, { typename: 'User', id: 2 }], maxTtl, KV, keyPrefix);
            await (0, invalidate_js_1.invalidate)([{ typename: 'User', id: 1 }], KV, keyPrefix);
            const allKeys = await collectAllKeys(keyPrefix);
            expect(allKeys.length).toEqual(2);
            const operationKey = (0, cache_key_js_1.buildOperationKey)(dataKey, keyPrefix);
            const operationKeyWithoutPrefix = (0, cache_key_js_1.buildOperationKey)(dataKey);
            const entityTypeKey = (0, cache_key_js_1.buildEntityKey)('User', undefined, keyPrefix);
            const entityKey1 = (0, cache_key_js_1.buildEntityKey)('User', 1, keyPrefix);
            const entityKey2 = (0, cache_key_js_1.buildEntityKey)('User', 2, keyPrefix);
            expect(allKeys.find(k => k.name === operationKey)).not.toBeDefined();
            expect(allKeys.find(k => k.name === `${entityTypeKey}:${operationKeyWithoutPrefix}`)).toBeDefined();
            expect(allKeys.find(k => k.name === `${entityTypeKey}:${operationKeyWithoutPrefix}`)?.metadata).toEqual({ operationKey });
            expect(allKeys.find(k => k.name === `${entityKey1}:${operationKeyWithoutPrefix}`)).not.toBeDefined();
            expect(allKeys.find(k => k.name === `${entityKey2}:${operationKeyWithoutPrefix}`)).toBeDefined();
            expect(allKeys.find(k => k.name === `${entityKey2}:${operationKeyWithoutPrefix}`)?.metadata).toEqual({ operationKey });
        });
    });
});
