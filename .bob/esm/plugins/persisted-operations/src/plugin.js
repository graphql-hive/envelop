import { GraphQLError, parse } from 'graphql';
import { operationIdFromSource } from './utils.js';
const DEFAULT_OPTIONS = {
    onlyPersisted: false,
};
const contextProperty = Symbol('persistedOperationId');
export function readOperationId(context) {
    return context[contextProperty];
}
export const usePersistedOperations = (rawOptions) => {
    const options = {
        ...DEFAULT_OPTIONS,
        ...rawOptions,
    };
    return {
        onParse({ context, params, extendContext, setParsedDocument }) {
            const operationId = options.extractOperationId
                ? options.extractOperationId(context)
                : operationIdFromSource(params.source);
            if (!operationId) {
                if (options.onlyPersisted) {
                    throw new GraphQLError('Must provide operation id');
                }
                return;
            }
            const store = typeof options.store === 'function' ? options.store(context) : options.store;
            if (!store) {
                throw new GraphQLError('Must provide store for persisted-operations!');
            }
            const rawResult = store.get(operationId);
            if (rawResult) {
                const document = typeof rawResult === 'string' ? parse(rawResult) : rawResult;
                extendContext({ [contextProperty]: operationId });
                setParsedDocument(document);
                return;
            }
            if (options.onMissingMatch)
                options.onMissingMatch(context, operationId);
            if (options.onlyPersisted) {
                // we want to throw an error only when "onlyPersisted" is true, otherwise we let execution continue normally
                throw new GraphQLError(`Unable to match operation with id '${operationId}'`);
            }
            // if we reach this stage we could not retrieve a persisted operation and we didn't throw any error as onlyPersisted is false
            // hence we let operation continue assuming consumer is not passing an operation id, but a plain query string, with current request.
        },
    };
};
