export const useDataLoader = (name, builderFn) => {
    return {
        onContextBuilding({ context, extendContext }) {
            extendContext({
                [name]: builderFn(context),
            });
        },
    };
};
