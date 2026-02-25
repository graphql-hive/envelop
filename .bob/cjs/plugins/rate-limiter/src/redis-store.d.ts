import type { Store } from './store.js';
import type { Identity } from './types.js';
declare class RedisStore implements Store {
    store: any;
    private readonly nameSpacedKeyPrefix;
    constructor(redisStoreInstance: unknown);
    setForIdentity(identity: Identity, timestamps: readonly number[], windowMs?: number): Promise<void>;
    getForIdentity(identity: Identity): Promise<readonly number[]>;
    private readonly generateNamedSpacedKey;
}
export { RedisStore };
