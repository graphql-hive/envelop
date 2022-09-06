import { Plugin, DefaultContext, TypedExecutionArgs, ExecutionResult } from '@envelop/types';
import { handleStreamOrSingleExecutionResult } from '../utils.js';

export type ErrorHandler = (errors: readonly Error[] | any[], context: Readonly<DefaultContext>) => void;

type ErrorHandlerCallback<ContextType> = {
  result: ExecutionResult;
  args: TypedExecutionArgs<ContextType>;
};

const makeHandleResult =
  <ContextType extends Record<any, any>>(errorHandler: ErrorHandler) =>
  ({ result, args }: ErrorHandlerCallback<ContextType>) => {
    if (result.errors?.length) {
      errorHandler(result.errors, args);
    }
  };

export const useErrorHandler = <ContextType extends Record<string, any>>(
  errorHandler: ErrorHandler
): Plugin<ContextType> => {
  const handleResult = makeHandleResult<ContextType>(errorHandler);
  return {
    onParse() {
      return function onParseEnd({ result, replaceParseResult, context }) {
        if (result instanceof Error) {
          console.log('onParseEnd', result);
          replaceParseResult(errorHandler([result], context));
        }
      };
    },
    onValidate() {
      return function onValidateEnd({ valid, result, setResult, context }) {
        if (valid === false && result.length > 0) {
          setResult(errorHandler(result as Error[], context));
        }
      };
    },
    onPluginInit(context) {
      context.registerContextErrorHandler(({ error, setError }) => {
        setError(errorHandler([error], context));
      });
    },
    onExecute() {
      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(payload, handleResult);
        },
      };
    },
    onSubscribe() {
      return {
        onSubscribeResult(payload) {
          return handleStreamOrSingleExecutionResult(payload, handleResult);
        },
      };
    },
  };
};
