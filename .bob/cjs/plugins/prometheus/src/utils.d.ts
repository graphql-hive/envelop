import { ASTNode, DocumentNode, GraphQLError, GraphQLResolveInfo, OperationDefinitionNode, TypeInfo } from 'graphql';
import { Counter, Histogram, Summary, type CounterConfiguration, type HistogramConfiguration, type Registry, type SummaryConfiguration } from 'prom-client';
import { AfterParseEventPayload } from '@envelop/core';
import { PrometheusTracingPluginConfig } from './config.js';
export type DeprecatedFieldInfo = {
    fieldName: string;
    typeName: string;
};
export type FillLabelsFnParams = {
    document?: DocumentNode;
    operationName?: string;
    operationType?: OperationDefinitionNode['operation'];
    info?: GraphQLResolveInfo;
    errorPhase?: string;
    error?: GraphQLError;
    deprecationInfo?: DeprecatedFieldInfo;
};
export declare function shouldTraceFieldResolver(info: GraphQLResolveInfo, whitelist: string[] | undefined): boolean;
export declare function createFillLabelFnParams(parseResult: AfterParseEventPayload<any>['result'], context: any, filterParams: (params: FillLabelsFnParams) => FillLabelsFnParams | null): FillLabelsFnParams | null;
export type FillLabelsFn<LabelNames extends string, Params extends Record<string, any>> = (params: Params, rawContext: any) => Record<LabelNames, string | number>;
export type ShouldObservePredicate<Params extends Record<string, any>> = (params: Params, rawContext: any) => boolean;
export type HistogramAndLabels<Phases, LabelNames extends string, Params extends Record<string, any>> = {
    histogram: Histogram<LabelNames>;
    fillLabelsFn: FillLabelsFn<LabelNames, Params>;
    phases?: AtLeastOne<Phases>;
    shouldObserve?: ShouldObservePredicate<Params>;
};
export declare function registerHistogram<LabelNames extends string>(registry: Registry, conf: Omit<HistogramConfiguration<LabelNames>, 'registers'>): Histogram<LabelNames>;
/**
 * Histogram metric factory allowing to define custom metrics with advanced configuration.
 * @param options
 * @returns
 */
export declare function createHistogram<Phases, LabelNames extends string, Params extends Record<string, any> = FillLabelsFnParams>(options: {
    /**
     * The registry to be used by the plugin. If you don't have a custom registry,
     * use `register` exported variable from `prom-client`.
     */
    registry: Registry;
    /**
     * The configuration of the histogram, as expected by the `prom-client` library.
     */
    histogram: Omit<HistogramConfiguration<LabelNames>, 'registers'>;
    /**
     * A function called when an event is observed to extract labels values from the context.
     */
    fillLabelsFn: FillLabelsFn<LabelNames, Params>;
    /**
     * A list of GraphQL pipeline phases which will be observed by this metric.
     *
     * The possible values accepted in this list depends on the metric,
     * please refer to metric type or documentation to know which phases ar available.
     *
     * By default, all available phases are observed
     */
    phases?: AtLeastOne<Phases>;
    /**
     * A function called for each event that can be observed.
     * If it is provided, an event will be observed only if it returns true.
     *
     * By default, all events are observed.
     */
    shouldObserve?: ShouldObservePredicate<Params>;
}): HistogramAndLabels<Phases, LabelNames, Params>;
export type SummaryAndLabels<Phases, LabelNames extends string, Params extends Record<string, any>> = {
    summary: Summary<LabelNames>;
    fillLabelsFn: FillLabelsFn<LabelNames, Params>;
    phases?: AtLeastOne<Phases>;
    shouldObserve?: ShouldObservePredicate<Params>;
};
export declare function registerSummary<LabelNames extends string>(registry: Registry, conf: Omit<SummaryConfiguration<LabelNames>, 'registers'>): Summary<LabelNames>;
/**
 * Summary metric factory allowing to define custom metrics with advanced configuration.
 * @param options
 * @returns
 */
export declare function createSummary<Phases, LabelNames extends string, Params extends Record<string, any> = FillLabelsFnParams>(options: {
    /**
     * The registry to be used by the plugin. If you don't have a custom registry,
     * use `register` exported variable from `prom-client`.
     */
    registry: Registry;
    /**
     * The configuration of the summary, as expected by the `prom-client` library.
     */
    summary: Omit<SummaryConfiguration<LabelNames>, 'registers'>;
    /**
     * A function called when an event is observed to extract labels values from the context.
     */
    fillLabelsFn: FillLabelsFn<LabelNames, Params>;
    /**
     * A list of GraphQL pipeline phases which will be observed by this metric.
     *
     * The possible values accepted in this list depends on the metric,
     * please refer to metric type or documentation to know which phases ar available.
     *
     * By default, all available phases are observed
     */
    phases?: AtLeastOne<Phases>;
    /**
     * A function called for each event that can be observed.
     * If it is provided, an event will be observed only if it returns true.
     *
     * By default, all events are observed.
     */
    shouldObserve?: ShouldObservePredicate<Params>;
}): SummaryAndLabels<Phases, LabelNames, Params>;
export type CounterAndLabels<Phases, LabelNames extends string, Params extends Record<string, any>> = {
    counter: Counter<LabelNames>;
    fillLabelsFn: FillLabelsFn<LabelNames, Params>;
    phases?: AtLeastOne<Phases>;
    shouldObserve?: ShouldObservePredicate<Params>;
};
/**
 * Counter metric factory allowing to define custom metrics with advanced configuration.
 * @param options
 * @returns
 */
export declare function registerCounter<LabelNames extends string>(registry: Registry, conf: Omit<CounterConfiguration<LabelNames>, 'registers'>): Counter<LabelNames>;
export declare function createCounter<Phases, LabelNames extends string, Params extends Record<string, any> = FillLabelsFnParams>(options: {
    /**
     * The registry to be used by the plugin. If you don't have a custom registry,
     * use `register` exported variable from `prom-client`.
     */
    registry: Registry;
    /**
     * The configuration of the counter, as expected by the `prom-client` library.
     */
    counter: Omit<CounterConfiguration<LabelNames>, 'registers'>;
    /**
     * A function called when an event is observed to extract labels values from the context.
     */
    fillLabelsFn: FillLabelsFn<LabelNames, Params>;
    /**
     * A list of GraphQL pipeline phases which will be observed by this metric.
     *
     * The possible values accepted in this list depends on the metric,
     * please refer to metric type or documentation to know which phases ar available.
     *
     * By default, all available phases are observed
     */
    phases?: AtLeastOne<Phases>;
    /**
     * A function called for each event that can be observed.
     * If it is provided, an event will be observed only if it returns true.
     *
     * By default, all events are observed.
     */
    shouldObserve?: ShouldObservePredicate<Params>;
}): CounterAndLabels<Phases, LabelNames, Params>;
export declare function getHistogramFromConfig<Phases, MetricOptions, Params extends Record<string, any> = FillLabelsFnParams>(config: PrometheusTracingPluginConfig, phase: keyof MetricOptions, availablePhases: AtLeastOne<Phases>, histogram: Omit<HistogramConfiguration<string>, 'registers' | 'name'>, fillLabelsFn?: FillLabelsFn<string, Params>): Required<HistogramAndLabels<Phases, string, Params>> | undefined;
export declare function getSummaryFromConfig<Phases, MetricOptions, Params extends Record<string, any> = FillLabelsFnParams>(config: PrometheusTracingPluginConfig, phase: keyof MetricOptions, availablePhases: AtLeastOne<Phases>, summary: Omit<SummaryConfiguration<string>, 'registers' | 'name'>, fillLabelsFn?: FillLabelsFn<string, Params>): Required<SummaryAndLabels<Phases, string, Params>> | undefined;
export declare function getCounterFromConfig<Phases, MetricOptions, Params extends Record<string, any> = FillLabelsFnParams>(config: PrometheusTracingPluginConfig, phase: keyof MetricOptions, availablePhases: AtLeastOne<Phases>, counter: Omit<CounterConfiguration<string>, 'registers' | 'name'>, fillLabelsFn?: FillLabelsFn<string, Params>): Required<CounterAndLabels<Phases, string, Params>> | undefined;
export declare function extractDeprecatedFields(node: ASTNode, typeInfo: TypeInfo): DeprecatedFieldInfo[];
export declare function labelExists(config: {
    labels?: Record<string, unknown>;
}, label: string): boolean;
export declare function filterFillParamsFnParams<T extends string>(config: PrometheusTracingPluginConfig, params: Partial<Record<T, any>>): Record<T, any>;
export declare function instrumentRegistry(registry: Registry): Registry<"text/plain; version=0.0.4; charset=utf-8">;
export type AtLeastOne<T> = [T, ...T[]];
