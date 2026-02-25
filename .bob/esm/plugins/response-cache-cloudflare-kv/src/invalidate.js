import { buildEntityKey } from './cache-key.js';
export function invalidate(entities, KV, keyPrefix) {
    const kvPromises = []; // Collecting all the KV operations so we can await them all at once
    const entityInvalidationPromises = []; // Parallelize invalidation of each entity
    for (const entity of entities) {
        entityInvalidationPromises.push(invalidateCacheEntityRecord(entity, kvPromises, KV, keyPrefix));
    }
    return Promise.allSettled([...entityInvalidationPromises, ...kvPromises]).then(() => undefined);
}
export async function invalidateCacheEntityRecord(entity, 
/** Collect all inner promises to batch await all async operations outside the function */
kvPromiseCollection, KV, keyPrefix) {
    const entityKey = buildEntityKey(entity.typename, entity.id, keyPrefix);
    for await (const kvKey of getAllKvKeysForPrefix(entityKey, KV)) {
        if (kvKey.metadata?.operationKey) {
            kvPromiseCollection.push(KV.delete(kvKey.metadata?.operationKey));
            kvPromiseCollection.push(KV.delete(kvKey.name));
        }
    }
}
export async function* getAllKvKeysForPrefix(prefix, KV) {
    let keyListComplete = false;
    let cursor;
    do {
        const kvListResponse = await KV.list({
            prefix,
            cursor,
        });
        keyListComplete = kvListResponse.list_complete;
        if (!kvListResponse.list_complete) {
            cursor = kvListResponse.cursor;
        }
        for (const keyResult of kvListResponse.keys) {
            yield keyResult;
        }
    } while (!keyListComplete);
}
