import depthLimit from 'graphql-depth-limit';
export const useDepthLimit = (config) => {
    const ignore = config.ignore || [];
    const checkFn = depthLimit(config.maxDepth, { ignore });
    return {
        onValidate({ addValidationRule }) {
            addValidationRule(checkFn);
        },
    };
};
