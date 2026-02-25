"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStore = void 0;
class RedisStore {
    store;
    nameSpacedKeyPrefix = 'redis-store-id::';
    constructor(redisStoreInstance) {
        this.store = redisStoreInstance;
    }
    setForIdentity(identity, timestamps, windowMs) {
        return new Promise((resolve, reject) => {
            const expiry = windowMs
                ? ['EX', Math.ceil((Date.now() + windowMs - Math.max(...timestamps)) / 1000)]
                : [];
            this.store.set([this.generateNamedSpacedKey(identity), JSON.stringify([...timestamps]), ...expiry], (err) => {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    }
    getForIdentity(identity) {
        return new Promise((res, rej) => {
            this.store.get(this.generateNamedSpacedKey(identity), 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err, obj) => {
                if (err) {
                    return rej(err);
                }
                return res(obj ? JSON.parse(obj) : []);
            });
        });
    }
    generateNamedSpacedKey = (identity) => {
        return `${this.nameSpacedKeyPrefix}${identity.contextIdentity}:${identity.fieldIdentity}`;
    };
}
exports.RedisStore = RedisStore;
