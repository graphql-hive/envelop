import { DocumentNode } from 'graphql';
/**
 * Sanitizes a GraphQL document node by removing empty and unused nodes.
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
export declare function removeEmptyOrUnusedNodes(documentNode: DocumentNode): DocumentNode;
