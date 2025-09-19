import {
  defaultFieldResolver,
  GraphQLResolveInfo,
  GraphQLSchema,
  isObjectType,
  responsePathAsArray,
} from 'graphql';
import picomatch from 'picomatch';
import type { Plugin } from '@envelop/core';
import { createGraphQLError, getDirectiveExtensions } from '@graphql-tools/utils';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';
import { getGraphQLRateLimiter } from './get-graphql-rate-limiter.js';
import { InMemoryStore } from './in-memory-store.js';
import { RateLimitError } from './rate-limit-error.js';
import { RedisStore } from './redis-store.js';
import { Store } from './store.js';
import {
  FormatErrorInput,
  GraphQLRateLimitConfig,
  GraphQLRateLimitDirectiveArgs,
  Identity,
  Options,
} from './types.js';

export {
  FormatErrorInput,
  GraphQLRateLimitConfig,
  GraphQLRateLimitDirectiveArgs,
  Identity,
  InMemoryStore,
  Options,
  RateLimitError,
  RedisStore,
  Store,
};

export type IdentifyFn<ContextType = unknown> = (context: ContextType) => string;

export type MessageInterpolator<ContextType = unknown> = (
  message: string,
  identifier: string,
  params: {
    root: unknown;
    args: Record<string, unknown>;
    context: ContextType;
    info: GraphQLResolveInfo;
  },
) => string;

export const DIRECTIVE_SDL = /* GraphQL */ `
  directive @rateLimit(
    max: Int
    window: String
    message: String
    identityArgs: [String]
    arrayLengthField: String
    readOnly: Boolean
    uncountRejected: Boolean
  ) on FIELD_DEFINITION
`;

export type RateLimitDirectiveArgs = {
  max?: number;
  window?: string;
  message?: string;
  identityArgs?: string[];
  arrayLengthField?: string;
  readOnly?: boolean;
  uncountRejected?: boolean;
};

export type RateLimiterPluginOptions = {
  identifyFn: IdentifyFn;
  rateLimitDirectiveName?: 'rateLimit' | string;
  transformError?: (message: string) => Error;
  onRateLimitError?: (event: {
    error: string;
    identifier: string;
    context: unknown;
    info: GraphQLResolveInfo;
  }) => void;
  interpolateMessage?: MessageInterpolator;
  configByField?: ConfigByField[];
} & Omit<GraphQLRateLimitConfig, 'identifyContext'>;

export interface ConfigByField extends RateLimitDirectiveArgs {
  type: string;
  field: string;
  identifyFn?: IdentifyFn;
}

export const defaultInterpolateMessageFn: MessageInterpolator = (message, identifier) =>
  interpolateByArgs(message, { id: identifier });

interface RateLimiterContext {
  rateLimiterFn: ReturnType<typeof getGraphQLRateLimiter>;
}

export const useRateLimiter = (options: RateLimiterPluginOptions): Plugin<RateLimiterContext> => {
  const rateLimiterFn = getGraphQLRateLimiter({
    ...options,
    identifyContext: options.identifyFn,
  });

  const interpolateMessage = options.interpolateMessage || defaultInterpolateMessageFn;

  const configByField = options.configByField?.map(config => ({
    ...config,
    isMatch: {
      type: picomatch(config.type),
      field: picomatch(config.field),
    },
  }));

  const directiveName = options.rateLimitDirectiveName ?? 'rateLimit';

  return {
    onSchemaChange({ schema: _schema }) {
      if (!_schema) {
        return;
      }
      const schema = _schema as GraphQLSchema;

      for (const type of Object.values(schema.getTypeMap())) {
        if (!isObjectType(type)) {
          continue;
        }

        for (const field of Object.values(type.getFields())) {
          const fieldConfigs = configByField?.filter(
            ({ isMatch }) => isMatch.type(type.name) && isMatch.field(field.name),
          );
          if (fieldConfigs && fieldConfigs.length > 1) {
            throw new Error(
              `Config error: field '${type.name}.${field.name}' has multiple matching configuration`,
            );
          }
          const fieldConfig = fieldConfigs?.[0];

          const rateLimitDirective = getDirectiveExtensions(field, schema)[
            directiveName
          ]?.[0] as RateLimitDirectiveArgs;

          if (rateLimitDirective && fieldConfig) {
            throw new Error(
              `Config error: field '${type.name}.${field.name}' has both a configuration and a directive`,
            );
          }

          const rateLimitConfig = { ...(rateLimitDirective ?? fieldConfig) };

          if (rateLimitConfig) {
            rateLimitConfig.max = rateLimitConfig.max && Number(rateLimitConfig.max);

            if (fieldConfig?.identifyFn) {
              rateLimitConfig.identityArgs = [
                'identifier',
                ...(rateLimitConfig.identityArgs ?? []),
              ];
            }

            const originalResolver = field.resolve ?? defaultFieldResolver;
            field.resolve = (parent, args, context, info) => {
              const resolverRateLimitConfig = { ...rateLimitConfig };
              const executionArgs = { parent, args, context, info };
              const identifier = (fieldConfig?.identifyFn ?? options.identifyFn)(context);

              if (fieldConfig?.identifyFn) {
                executionArgs.args = { identifier, ...args };
              }

              if (resolverRateLimitConfig.message && identifier) {
                const messageArgs = { root: parent, args, context, info };
                resolverRateLimitConfig.message = interpolateMessage(
                  resolverRateLimitConfig.message,
                  identifier,
                  messageArgs,
                );
              }

              return handleMaybePromise(
                () => rateLimiterFn(executionArgs, resolverRateLimitConfig),
                rateLimitError => {
                  if (!rateLimitError) {
                    return originalResolver(parent, args, context, info);
                  }

                  if (options.onRateLimitError) {
                    options.onRateLimitError({
                      error: rateLimitError,
                      identifier,
                      context,
                      info,
                    });
                  }

                  if (options.transformError) {
                    throw options.transformError(rateLimitError);
                  }

                  const errorOptions: Parameters<typeof createGraphQLError>[1] = {
                    extensions: { http: { statusCode: 429 } },
                    path: responsePathAsArray(info.path),
                    nodes: info.fieldNodes,
                  };

                  if (resolverRateLimitConfig.window) {
                    errorOptions.extensions.http.headers = {
                      'Retry-After': resolverRateLimitConfig.window,
                    };
                  }

                  throw createGraphQLError(rateLimitError, errorOptions);
                },
              );
            };
          }
        }
      }
    },
    onContextBuilding({ extendContext }) {
      extendContext({
        rateLimiterFn,
      });
    },
  };
};

function interpolateByArgs(message: string, args: { [key: string]: string }) {
  return message.replace(/\{{([^)]*)\}}/g, (_, key) => args[key.trim()]);
}
