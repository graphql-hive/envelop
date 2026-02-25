"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBuildEntityId = exports.createInMemoryCache = void 0;
const lru_cache_1 = require("lru-cache");
const createInMemoryCache = (params) => {
    const buildEntityId = params?.buildEntityId ?? exports.defaultBuildEntityId;
    const cachedResponses = new lru_cache_1.LRUCache({
        max: params?.max ?? 1000,
        allowStale: false,
        noDisposeOnSet: true,
        dispose(responseId) {
            purgeResponse(responseId, false);
        },
    });
    const entityToResponseIds = new Map();
    const responseIdToEntityIds = new Map();
    function purgeResponse(responseId, shouldRemove = true) {
        const entityIds = responseIdToEntityIds.get(responseId);
        // get entities related to the response
        if (entityIds !== undefined) {
            for (const entityId of entityIds) {
                // remove the response mapping from the entity
                entityToResponseIds.get(entityId)?.delete(responseId);
            }
            // remove all the entity mappings from the response
            responseIdToEntityIds.delete(responseId);
        }
        if (shouldRemove) {
            // remove the response from the cache
            cachedResponses.delete(responseId);
        }
    }
    function purgeEntity(entity) {
        const responseIds = entityToResponseIds.get(entity);
        if (responseIds !== undefined) {
            for (const responseId of responseIds) {
                purgeResponse(responseId);
            }
        }
    }
    return {
        set(responseId, result, collectedEntities, ttl) {
            cachedResponses.set(responseId, result, { ttl });
            const entityIds = new Set();
            responseIdToEntityIds.set(responseId, entityIds);
            for (const { typename, id } of collectedEntities) {
                let operationIds = entityToResponseIds.get(typename);
                if (operationIds == null) {
                    operationIds = new Set();
                    entityToResponseIds.set(typename, operationIds);
                }
                // typename => operation
                operationIds.add(responseId);
                // operation => typename
                entityIds.add(typename);
                if (id !== undefined) {
                    const entityId = buildEntityId(typename, id);
                    let responseIds = entityToResponseIds.get(entityId);
                    if (responseIds == null) {
                        responseIds = new Set();
                        entityToResponseIds.set(entityId, responseIds);
                    }
                    // typename:id => operation
                    responseIds.add(responseId);
                    // operation => typename:id
                    entityIds.add(entityId);
                }
            }
        },
        get(responseId) {
            return cachedResponses.get(responseId) ?? null;
        },
        invalidate(entitiesToRemove) {
            for (const { typename, id } of entitiesToRemove) {
                purgeEntity(id != null ? buildEntityId(typename, id) : typename);
            }
        },
    };
};
exports.createInMemoryCache = createInMemoryCache;
const defaultBuildEntityId = (typename, id) => `${typename}:${id}`;
exports.defaultBuildEntityId = defaultBuildEntityId;
