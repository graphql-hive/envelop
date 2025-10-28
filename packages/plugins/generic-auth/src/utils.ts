import {
  DocumentNode,
  DefinitionNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  SelectionSetNode,
  SelectionNode,
  FieldNode,
  InlineFragmentNode,
  FragmentSpreadNode,
} from 'graphql';

export function sanitizeDocument(documentNode: DocumentNode): DocumentNode {
  let changed = true;
  let document = { ...documentNode, definitions: [...documentNode.definitions] };

  while (changed) {
    changed = false;

    // Build a map of fragment definitions
    const fragmentMap = new Map<string, FragmentDefinitionNode>();
    for (const definition of document.definitions) {
      if (definition.kind === 'FragmentDefinition') {
        fragmentMap.set(definition.name.value, definition);
      }
    }

    // Sanitize each operation definition
    document.definitions = document.definitions.map((def) => {
      if (def.kind === 'OperationDefinition') {
        const sanitized = sanitizeSelectionSet(def.selectionSet, fragmentMap);
        if (sanitized !== def.selectionSet) {
          changed = true;
        }
        return { ...def, selectionSet: sanitized };
      }
      return def;
    });

    // Rebuild fragment map after sanitization
    const newFragmentMap = new Map<string, FragmentDefinitionNode>();
    for (const definition of document.definitions) {
      if (definition.kind === 'FragmentDefinition') {
        newFragmentMap.set(definition.name.value, definition);
      }
    }

    // Remove unused fragments
    const usedFragmentNames = new Set<string>();
    for (const definition of document.definitions) {
      if (definition.kind === 'OperationDefinition') {
        collectUsedFragments(definition.selectionSet, newFragmentMap, usedFragmentNames);
      }
    }

    const filteredDefinitions = document.definitions.filter((def) => {
      if (def.kind === 'FragmentDefinition') {
        return usedFragmentNames.has(def.name.value);
      }
      return true;
    });

    if (filteredDefinitions.length !== document.definitions.length) {
      changed = true;
    }

    document = { ...document, definitions: filteredDefinitions };
  }

  return document;
}

function sanitizeSelectionSet(
  selectionSet: SelectionSetNode,
  fragmentMap: Map<string, FragmentDefinitionNode>
): SelectionSetNode {
  let selections = [...selectionSet.selections];

  // First pass: sanitize child selection sets
  selections = selections.map((selection) => {
    if (selection.kind === 'Field') {
      if (selection.selectionSet) {
        const sanitized = sanitizeSelectionSet(selection.selectionSet, fragmentMap);
        return { ...selection, selectionSet: sanitized };
      }
    } else if (selection.kind === 'InlineFragment') {
      const sanitized = sanitizeSelectionSet(selection.selectionSet, fragmentMap);
      return { ...selection, selectionSet: sanitized };
    }
    return selection;
  });

  // Second pass: remove empty inline fragments
  selections = selections.filter((selection) => {
    if (selection.kind === 'InlineFragment') {
      if (selection.selectionSet.selections.length === 0) {
        return false;
      }
    }
    return true;
  });

  // Third pass: remove fields with empty selection sets (unless they have no selectionSet at all)
  selections = selections.filter((selection) => {
    if (selection.kind === 'Field') {
      if (selection.selectionSet && selection.selectionSet.selections.length === 0) {
        return false;
      }
    }
    return true;
  });

  // Fourth pass: remove fragment spreads that reference empty fragments
  selections = selections.filter((selection) => {
    if (selection.kind === 'FragmentSpread') {
      const fragment = fragmentMap.get(selection.name.value);
      if (fragment && fragment.selectionSet.selections.length === 0) {
        return false;
      }
    }
    return true;
  });

  if (selections.length !== selectionSet.selections.length) {
    return { ...selectionSet, selections };
  }

  return selectionSet;
}

function collectUsedFragments(
  selectionSet: SelectionSetNode,
  fragmentMap: Map<string, FragmentDefinitionNode>,
  usedFragments: Set<string>
): void {
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field' && selection.selectionSet) {
      collectUsedFragments(selection.selectionSet, fragmentMap, usedFragments);
    } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
      collectUsedFragments(selection.selectionSet, fragmentMap, usedFragments);
    } else if (selection.kind === 'FragmentSpread') {
      usedFragments.add(selection.name.value);
      const fragment = fragmentMap.get(selection.name.value);
      if (fragment && fragment.selectionSet) {
        collectUsedFragments(fragment.selectionSet, fragmentMap, usedFragments);
      }
    }
  }
}
