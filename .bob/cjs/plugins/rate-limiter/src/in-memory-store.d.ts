import { Store } from './store';
import { Identity } from './types';
interface StoreData {
    readonly [identity: string]: {
        readonly [fieldIdentity: string]: readonly number[];
    };
}
declare class InMemoryStore implements Store {
    state: StoreData;
    setForIdentity(identity: Identity, timestamps: readonly number[]): void;
    getForIdentity(identity: Identity): readonly number[];
}
export { InMemoryStore };
