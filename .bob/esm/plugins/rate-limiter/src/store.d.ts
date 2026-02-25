import type { Identity } from './types.js';
declare abstract class Store {
    /**
     * Sets an array of call timestamps in the store for a given identity
     *
     * @param identity
     * @param timestamps
     */
    abstract setForIdentity(identity: Identity, timestamps: readonly number[], windowMs?: number): void | Promise<void>;
    /**
     * Gets an array of call timestamps for a given identity.
     *
     * @param identity
     */
    abstract getForIdentity(identity: Identity): readonly number[] | Promise<readonly number[]>;
}
export { Store };
