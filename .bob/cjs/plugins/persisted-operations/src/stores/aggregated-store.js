"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatedStore = void 0;
class AggregatedStore {
    stores;
    constructor(stores) {
        this.stores = stores;
    }
    get(operationId) {
        for (const store of this.stores) {
            const item = store.get(operationId);
            if (item) {
                return item;
            }
        }
        return undefined;
    }
}
exports.AggregatedStore = AggregatedStore;
