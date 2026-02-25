import { formatApolloErrors } from 'apollo-server-errors';
import { Plugin } from '@envelop/core';
export declare const useApolloServerErrors: (options?: Parameters<typeof formatApolloErrors>[1]) => Plugin;
