export function operationIdFromSource(source) {
    return typeof source === 'string' && source.length && source.indexOf('{') === -1
        ? source
        : undefined;
}
