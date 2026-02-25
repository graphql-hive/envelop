"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const redis_mock_1 = tslib_1.__importDefault(require("redis-mock"));
const redis_store_1 = require("../src/redis-store");
test('RedisStore sets and gets correct timestamps', async () => {
    const storeInstance = new redis_store_1.RedisStore(redis_mock_1.default.createClient());
    await storeInstance.setForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar' }, [1, 2, 3]);
    expect(await storeInstance.getForIdentity({
        contextIdentity: 'foo',
        fieldIdentity: 'bar',
    })).toEqual([1, 2, 3]);
    await storeInstance.setForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar2' }, [4, 5]);
    expect(await storeInstance.getForIdentity({
        contextIdentity: 'foo',
        fieldIdentity: 'bar2',
    })).toEqual([4, 5]);
    await storeInstance.setForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar' }, [10, 20]);
    expect(await storeInstance.getForIdentity({
        contextIdentity: 'foo',
        fieldIdentity: 'bar',
    })).toEqual([10, 20]);
});
