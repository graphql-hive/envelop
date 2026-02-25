import type { DocumentNode, Source } from 'graphql';
import type { ParseOptions } from 'graphql/language/parser';
import type { Plugin } from '@envelop/core';
export declare function parseWithFragmentArguments(source: string | Source, options?: ParseOptions): DocumentNode;
export declare const useFragmentArguments: () => Plugin;
