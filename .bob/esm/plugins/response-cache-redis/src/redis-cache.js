import { handleMaybePromise } from '@whatwg-node/promise-helpers';
export const createRedisCache = (params) => {
    const store = params.redis;
    const buildRedisEntityId = params?.buildRedisEntityId ?? defaultBuildRedisEntityId;
    const buildRedisOperationResultCacheKey = params?.buildRedisOperationResultCacheKey ?? defaultBuildRedisOperationResultCacheKey;
    async function buildEntityInvalidationsKeys(entity) {
        const keysToInvalidate = [entity];
        // find the responseIds for the entity
        const responseIds = await store.smembers(entity);
        // and add each response to be invalidated since they contained the entity data
        responseIds.forEach(responseId => {
            keysToInvalidate.push(responseId);
            keysToInvalidate.push(buildRedisOperationResultCacheKey(responseId));
        });
        // if invalidating an entity like Comment, then also invalidate Comment:1, Comment:2, etc
        if (!entity.includes(':')) {
            const entityKeys = await store.keys(`${entity}:*`);
            for (const entityKey of entityKeys) {
                // and invalidate any responses in each of those entity keys
                const entityResponseIds = await store.smembers(entityKey);
                // if invalidating an entity check for associated operations containing that entity
                // and invalidate each response since they contained the entity data
                entityResponseIds.forEach(responseId => {
                    keysToInvalidate.push(responseId);
                    keysToInvalidate.push(buildRedisOperationResultCacheKey(responseId));
                });
                // then the entityKeys like Comment:1, Comment:2 etc to be invalidated
                keysToInvalidate.push(entityKey);
            }
        }
        return keysToInvalidate;
    }
    return {
        set(responseId, result, collectedEntities, ttl) {
            const pipeline = store.pipeline();
            if (ttl === Infinity) {
                pipeline.set(responseId, JSON.stringify(result));
            }
            else {
                // set the ttl in milliseconds
                pipeline.set(responseId, JSON.stringify(result), 'PX', ttl);
            }
            const responseKey = buildRedisOperationResultCacheKey(responseId);
            for (const { typename, id } of collectedEntities) {
                // Adds a key for the typename => response
                pipeline.sadd(typename, responseId);
                // Adds a key for the operation => typename
                pipeline.sadd(responseKey, typename);
                if (id) {
                    const entityId = buildRedisEntityId(typename, id);
                    // Adds a key for the typename:id => response
                    pipeline.sadd(entityId, responseId);
                    // Adds a key for the operation => typename:id
                    pipeline.sadd(responseKey, entityId);
                }
            }
            return pipeline.exec().then(() => undefined);
        },
        get(responseId) {
            return handleMaybePromise(() => store.get(responseId), (result) => (result ? JSON.parse(result) : undefined));
        },
        async invalidate(entitiesToRemove) {
            const invalidationKeys = [];
            for (const { typename, id } of entitiesToRemove) {
                invalidationKeys.push(await buildEntityInvalidationsKeys(id != null ? buildRedisEntityId(typename, id) : typename));
            }
            const keys = invalidationKeys.flat();
            if (keys.length > 0) {
                await store.del(keys);
            }
        },
    };
};
export const defaultBuildRedisEntityId = (typename, id) => `${typename}:${id}`;
export const defaultBuildRedisOperationResultCacheKey = responseId => `operations:${responseId}`;
