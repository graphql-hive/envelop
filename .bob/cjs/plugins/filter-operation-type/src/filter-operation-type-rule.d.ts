import { OperationTypeNode, ValidationRule } from 'graphql';
export type AllowedOperations = Iterable<OperationTypeNode>;
export declare const createFilterOperationTypeRule: (allowedOperations: AllowedOperations) => ValidationRule;
