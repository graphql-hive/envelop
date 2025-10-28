import { DocumentNode, FragmentDefinitionNode, SelectionSetNode } from 'graphql';

/**
 * Sanitizes a GraphQL document node by removing empty and unused elements.
 * This includes:
 * - Empty inline fragments
 * - Fields with empty selection sets
 * - Fragment spreads referencing empty fragments
 * - Unused fragment definitions
 *
 * The sanitization is performed iteratively until the document stabilizes,
 * ensuring that cascading cleanups (e.g., removing an empty inline fragment
 * that causes a parent field to become empty) are handled correctly.
 */
export function sanitizeDocument(documentNode: DocumentNode): DocumentNode {
  let hasChanged = true;
  let document = {
    ...documentNode,
    definitions: [...documentNode.definitions],
  };

  // Keep sanitizing until no more changes occur
  while (hasChanged) {
    hasChanged = false;

    // Create a map of all fragment definitions for quick lookup
    const fragmentMap = new Map<string, FragmentDefinitionNode>();
    for (const definition of document.definitions) {
      if (definition.kind === 'FragmentDefinition') {
        fragmentMap.set(definition.name.value, definition);
      }
    }

    // Sanitize all definitions (both operations and fragments)
    document.definitions = document.definitions.map(def => {
      if (def.kind === 'OperationDefinition') {
        const sanitized = sanitizeSelectionSet(def.selectionSet, fragmentMap);
        if (sanitized !== def.selectionSet) {
          hasChanged = true;
        }
        return { ...def, selectionSet: sanitized };
      } else if (def.kind === 'FragmentDefinition') {
        const sanitized = sanitizeSelectionSet(def.selectionSet, fragmentMap);
        if (sanitized !== def.selectionSet) {
          hasChanged = true;
        }
        return { ...def, selectionSet: sanitized };
      }
      return def;
    });

    // Rebuild fragment map after potential sanitization
    const updatedFragmentMap = new Map<string, FragmentDefinitionNode>();
    for (const definition of document.definitions) {
      if (definition.kind === 'FragmentDefinition') {
        updatedFragmentMap.set(definition.name.value, definition);
      }
    }

    // Collect all fragments that are actually used
    const usedFragmentNames = new Set<string>();
    for (const definition of document.definitions) {
      if (definition.kind === 'OperationDefinition') {
        findUsedFragments(definition.selectionSet, updatedFragmentMap, usedFragmentNames);
      } else if (definition.kind === 'FragmentDefinition') {
        // Fragments can also reference other fragments
        findUsedFragments(definition.selectionSet, updatedFragmentMap, usedFragmentNames);
      }
    }

    // Remove unused fragment definitions
    const filteredDefinitions = document.definitions.filter(def => {
      if (def.kind === 'FragmentDefinition') {
        return usedFragmentNames.has(def.name.value);
      }
      return true;
    });

    // Track if any fragments were removed
    if (filteredDefinitions.length !== document.definitions.length) {
      hasChanged = true;
    }

    document = { ...document, definitions: filteredDefinitions };
  }

  return document;
}

/**
 * Sanitizes a selection set by removing empty selections.
 * Performs sanitization bottom-up (recursively sanitizes child selection sets first).
 */
function sanitizeSelectionSet(
  selectionSet: SelectionSetNode,
  fragmentMap: Map<string, FragmentDefinitionNode>,
): SelectionSetNode {
  let selections = [...selectionSet.selections];

  // Recursively sanitize nested selection sets first (bottom-up approach)
  selections = selections.map(selection => {
    if (selection.kind === 'Field') {
      if (selection.selectionSet) {
        const sanitizedChildSet = sanitizeSelectionSet(selection.selectionSet, fragmentMap);
        return { ...selection, selectionSet: sanitizedChildSet };
      }
    } else if (selection.kind === 'InlineFragment') {
      const sanitizedChildSet = sanitizeSelectionSet(selection.selectionSet, fragmentMap);
      return { ...selection, selectionSet: sanitizedChildSet };
    }
    return selection;
  });

  // Remove empty inline fragments
  selections = selections.filter(selection => {
    if (selection.kind === 'InlineFragment') {
      return selection.selectionSet.selections.length > 0;
    }
    return true;
  });

  // Remove fields with empty selection sets (scalar fields have no selectionSet)
  selections = selections.filter(selection => {
    if (selection.kind === 'Field') {
      return !selection.selectionSet || selection.selectionSet.selections.length > 0;
    }
    return true;
  });

  // Remove fragment spreads that reference empty fragments
  selections = selections.filter(selection => {
    if (selection.kind === 'FragmentSpread') {
      const fragment = fragmentMap.get(selection.name.value);
      return !fragment || fragment.selectionSet.selections.length > 0;
    }
    return true;
  });

  // Return new selection set only if something was removed
  if (selections.length !== selectionSet.selections.length) {
    return { ...selectionSet, selections };
  }

  return selectionSet;
}

/**
 * Recursively collects all fragment names that are used in a selection set.
 * This includes fragments referenced directly and fragments referenced by other fragments.
 */
function findUsedFragments(
  selectionSet: SelectionSetNode,
  fragmentMap: Map<string, FragmentDefinitionNode>,
  usedFragments: Set<string>,
): void {
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field' && selection.selectionSet) {
      findUsedFragments(selection.selectionSet, fragmentMap, usedFragments);
    } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
      findUsedFragments(selection.selectionSet, fragmentMap, usedFragments);
    } else if (selection.kind === 'FragmentSpread') {
      const fragmentName = selection.name.value;
      usedFragments.add(fragmentName);

      // Also include fragments referenced by this fragment (recursive)
      const fragment = fragmentMap.get(fragmentName);
      if (fragment?.selectionSet) {
        findUsedFragments(fragment.selectionSet, fragmentMap, usedFragments);
      }
    }
  }
}
