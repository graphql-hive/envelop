import { print } from 'graphql';
import { astFromDirective } from '@graphql-tools/utils';
import { GraphQLLiveDirective, NoLiveMixedWithDeferStreamRule } from '@n1ru4l/graphql-live-query';
export { GraphQLLiveDirective };
export const GraphQLLiveDirectiveAST = astFromDirective(GraphQLLiveDirective);
export const GraphQLLiveDirectiveSDL = print(GraphQLLiveDirectiveAST);
export const useLiveQuery = (opts) => {
    return {
        onExecute: ({ executeFn, setExecuteFn }) => {
            const execute = opts.liveQueryStore.makeExecute(executeFn);
            if (opts.applyLiveQueryPatchGenerator) {
                const { applyLiveQueryPatchGenerator } = opts;
                setExecuteFn((...args) => applyLiveQueryPatchGenerator(execute(...args)));
            }
            else {
                setExecuteFn(execute);
            }
        },
        onValidate: ({ addValidationRule }) => {
            addValidationRule(NoLiveMixedWithDeferStreamRule);
        },
        onContextBuilding: ({ extendContext }) => {
            extendContext({
                liveQueryStore: opts.liveQueryStore,
            });
        },
    };
};
