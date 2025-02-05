import {
  ArbitraryObject,
  ComposeContext,
  GetEnvelopedFn,
  Optional,
  Plugin,
  type EnvelopData,
} from '@envelop/types';
import { createEnvelopOrchestrator, EnvelopOrchestrator } from './orchestrator.js';

type ExcludeFalsy<TArray extends any[]> = Exclude<TArray[0], null | undefined | false>[];

function notEmpty<T>(value: Optional<T>): value is T {
  return value != null;
}

export function envelop<
  PluginsType extends Optional<Plugin<any>>[],
  Data extends EnvelopData = EnvelopData,
>(options: {
  plugins: PluginsType;
  enableInternalTracing?: boolean;
  data?: Map<Plugin, Data>;
}): GetEnvelopedFn<ComposeContext<ExcludeFalsy<PluginsType>>> {
  const plugins = options.plugins.filter(notEmpty);
  const orchestrator = createEnvelopOrchestrator<ComposeContext<ExcludeFalsy<PluginsType>>, Data>({
    plugins,
    data: options.data,
  });

  const getEnveloped = <TInitialContext extends ArbitraryObject>(
    initialContext: TInitialContext = {} as TInitialContext,
  ) => {
    const typedOrchestrator = orchestrator as EnvelopOrchestrator<
      TInitialContext,
      ComposeContext<ExcludeFalsy<PluginsType>>
    >;
    typedOrchestrator.init(initialContext);

    return {
      parse: typedOrchestrator.parse(initialContext),
      validate: typedOrchestrator.validate(initialContext),
      contextFactory: typedOrchestrator.contextFactory(initialContext as any),
      execute: typedOrchestrator.execute,
      subscribe: typedOrchestrator.subscribe,
      schema: typedOrchestrator.getCurrentSchema(),
    };
  };

  getEnveloped._plugins = plugins;

  return getEnveloped as GetEnvelopedFn<ComposeContext<ExcludeFalsy<PluginsType>>>;
}
