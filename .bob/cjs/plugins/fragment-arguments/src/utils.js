"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySelectionSetFragmentArguments = applySelectionSetFragmentArguments;
const graphql_1 = require("graphql");
function applySelectionSetFragmentArguments(document) {
    const fragmentList = new Map();
    for (const def of document.definitions) {
        if (def.kind !== 'FragmentDefinition') {
            continue;
        }
        fragmentList.set(def.name.value, def);
    }
    return (0, graphql_1.visit)(document, {
        FragmentSpread(fragmentNode) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (fragmentNode.arguments != null && fragmentNode.arguments.length) {
                const fragmentDef = fragmentList.get(fragmentNode.name.value);
                if (!fragmentDef) {
                    return;
                }
                const fragmentArguments = new Map();
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                for (const arg of fragmentNode.arguments) {
                    fragmentArguments.set(arg.name.value, arg);
                }
                const selectionSet = (0, graphql_1.visit)(fragmentDef.selectionSet, {
                    Variable(variableNode) {
                        const fragArg = fragmentArguments.get(variableNode.name.value);
                        if (fragArg) {
                            return fragArg.value;
                        }
                        return variableNode;
                    },
                });
                const inlineFragment = {
                    kind: graphql_1.Kind.INLINE_FRAGMENT,
                    typeCondition: fragmentDef.typeCondition,
                    selectionSet,
                };
                return inlineFragment;
            }
            return fragmentNode;
        },
    });
}
