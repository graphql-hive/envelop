import { Plugin } from '@envelop/core';
import { CounterMetricOption, HistogramMetricOption, PrometheusTracingPluginConfig, SummaryMetricOption } from './config.js';
import { createCounter, createHistogram, createSummary, FillLabelsFnParams, getCounterFromConfig, getHistogramFromConfig, getSummaryFromConfig, type CounterAndLabels, type HistogramAndLabels, type SummaryAndLabels } from './utils.js';
export { CounterAndLabels, FillLabelsFnParams, HistogramAndLabels, PrometheusTracingPluginConfig, SummaryAndLabels, HistogramMetricOption, CounterMetricOption, SummaryMetricOption, createCounter, createHistogram, createSummary, getCounterFromConfig, getHistogramFromConfig, getSummaryFromConfig, };
export declare const fillLabelsFnParamsMap: WeakMap<any, FillLabelsFnParams | null>;
export declare const execStartTimeMap: WeakMap<any, number>;
export declare const usePrometheus: (config: PrometheusTracingPluginConfig) => Plugin;
