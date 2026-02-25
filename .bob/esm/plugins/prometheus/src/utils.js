import { visit, visitWithTypeInfo, } from 'graphql';
import { Counter, register as defaultRegistry, Histogram, Summary, } from 'prom-client';
const histograms = new WeakMap();
const summaries = new WeakMap();
const counters = new WeakMap();
export function shouldTraceFieldResolver(info, whitelist) {
    if (!whitelist) {
        return true;
    }
    const parentType = info.parentType.name;
    const fieldName = info.fieldName;
    const coordinate = `${parentType}.${fieldName}`;
    return whitelist.includes(coordinate) || whitelist.includes(`${parentType}.*`);
}
function getOperation(document) {
    return document.definitions[0];
}
export function createFillLabelFnParams(parseResult, context, filterParams) {
    if (parseResult === null) {
        return null;
    }
    if (parseResult instanceof Error) {
        return null;
    }
    const operation = getOperation(parseResult);
    return filterParams({
        document: parseResult,
        operationName: context?.params?.operationName || operation.name?.value || 'Anonymous',
        operationType: operation.operation,
    });
}
export function registerHistogram(registry, conf) {
    if (!histograms.has(registry)) {
        histograms.set(registry, new Map());
    }
    const registryHistograms = histograms.get(registry);
    if (!registryHistograms.has(conf.name)) {
        conf.registers = [registry];
        registryHistograms.set(conf.name, new Histogram(conf));
    }
    return registryHistograms.get(conf.name);
}
/**
 * Histogram metric factory allowing to define custom metrics with advanced configuration.
 * @param options
 * @returns
 */
export function createHistogram(options) {
    return {
        histogram: registerHistogram(options.registry, options.histogram),
        fillLabelsFn: options.fillLabelsFn,
        phases: options.phases,
        shouldObserve: options.shouldObserve ?? (() => true),
    };
}
export function registerSummary(registry, conf) {
    if (!summaries.has(registry)) {
        summaries.set(registry, new Map());
    }
    const registrySummaries = summaries.get(registry);
    if (!registrySummaries.has(conf.name)) {
        conf.registers = [registry];
        registrySummaries.set(conf.name, new Summary(conf));
    }
    return registrySummaries.get(conf.name);
}
/**
 * Summary metric factory allowing to define custom metrics with advanced configuration.
 * @param options
 * @returns
 */
export function createSummary(options) {
    return {
        summary: registerSummary(options.registry, options.summary),
        fillLabelsFn: options.fillLabelsFn,
        phases: options.phases,
        shouldObserve: options.shouldObserve ?? (() => true),
    };
}
/**
 * Counter metric factory allowing to define custom metrics with advanced configuration.
 * @param options
 * @returns
 */
export function registerCounter(registry, conf) {
    if (!counters.has(registry)) {
        counters.set(registry, new Map());
    }
    const registryCounters = counters.get(registry);
    if (!registryCounters.has(conf.name)) {
        conf.registers = [registry];
        registryCounters.set(conf.name, new Counter(conf));
    }
    return registryCounters.get(conf.name);
}
export function createCounter(options) {
    return {
        counter: registerCounter(options.registry, options.counter),
        fillLabelsFn: options.fillLabelsFn,
        phases: options.phases,
        shouldObserve: options.shouldObserve,
    };
}
export function getHistogramFromConfig(config, phase, availablePhases, histogram, fillLabelsFn = params => ({
    operationName: params.operationName,
    operationType: params.operationType,
})) {
    const metric = config.metrics[phase];
    if (!metric) {
        return undefined;
    }
    let phases = availablePhases;
    if (Array.isArray(metric)) {
        if (metric.length === 0) {
            throw TypeError(`Bad value provided for 'metrics.${phase.toString()}': the array must contain at least one element`);
        }
        else if (isBucketsList(metric)) {
            histogram.buckets = metric;
        }
        else if (isPhasesList(metric)) {
            phases = filterAvailablePhases(metric, availablePhases);
        }
        else {
            throw TypeError(`Bad value provided for 'metrics.${phase.toString()}': the array must contain only numbers (buckets) or string (phases)`);
        }
    }
    else if (typeof metric === 'object') {
        const customMetric = metric;
        if (!customMetric.phases) {
            customMetric.phases = availablePhases;
        }
        if (!customMetric.shouldObserve) {
            customMetric.shouldObserve = () => true;
        }
        return customMetric;
    }
    return createHistogram({
        registry: config.registry || defaultRegistry,
        histogram: {
            name: typeof metric === 'string' ? metric : phase,
            ...histogram,
            labelNames: (histogram.labelNames ?? ['operationType', 'operationName']).filter(label => labelExists(config, label)),
        },
        fillLabelsFn: (...args) => filterFillParamsFnParams(config, fillLabelsFn(...args)),
        phases,
        shouldObserve: () => true,
    });
}
export function getSummaryFromConfig(config, phase, availablePhases, summary, fillLabelsFn = params => filterFillParamsFnParams(config, {
    operationName: params.operationName,
    operationType: params.operationType,
})) {
    const metric = config.metrics[phase];
    if (!metric) {
        return undefined;
    }
    let phases = availablePhases;
    if (Array.isArray(metric)) {
        if (metric.length === 0) {
            throw TypeError(`Bad value provided for 'metrics.${phase.toString()}': the array must contain at least one element`);
        }
        else if (isPhasesList(metric)) {
            phases = filterAvailablePhases(metric, availablePhases);
        }
        else {
            throw new TypeError(`Bad value provided for 'metrics.${phase.toString()}': the array must contain only strings (phases)`);
        }
    }
    else if (typeof metric === 'object') {
        const customMetric = metric;
        if (!customMetric.phases) {
            customMetric.phases = availablePhases;
        }
        if (!customMetric.shouldObserve) {
            customMetric.shouldObserve = () => true;
        }
        return customMetric;
    }
    return createSummary({
        registry: config.registry || defaultRegistry,
        summary: {
            name: typeof metric === 'string' ? metric : phase,
            labelNames: ['operationType', 'operationName'].filter(label => labelExists(config, label)),
            ...summary,
        },
        fillLabelsFn,
        phases,
        shouldObserve: () => true,
    });
}
export function getCounterFromConfig(config, phase, availablePhases, counter, fillLabelsFn = params => filterFillParamsFnParams(config, {
    operationName: params.operationName,
    operationType: params.operationType,
})) {
    const metric = config.metrics[phase];
    let phases = availablePhases;
    if (!metric) {
        return undefined;
    }
    if (Array.isArray(metric)) {
        if (metric.length === 0) {
            throw TypeError(`Bad value provided for 'metrics.${phase.toString()}': the array must contain at least one element`);
        }
        else if (isPhasesList(metric)) {
            phases = filterAvailablePhases(metric, availablePhases);
        }
        else {
            throw new TypeError(`Bad value provided for 'metrics.${phase.toString()}': the array must contain only strings (phases)`);
        }
    }
    else if (typeof metric === 'object') {
        const customMetric = metric;
        if (!customMetric.phases) {
            customMetric.phases = availablePhases;
        }
        if (!customMetric.shouldObserve) {
            customMetric.shouldObserve = () => true;
        }
        return customMetric;
    }
    return createCounter({
        registry: config.registry || defaultRegistry,
        counter: {
            name: typeof metric === 'string' ? metric : phase,
            labelNames: ['operationType', 'operationName'].filter(label => labelExists(config, label)),
            ...counter,
        },
        fillLabelsFn,
        phases,
        shouldObserve: () => true,
    });
}
export function extractDeprecatedFields(node, typeInfo) {
    const found = [];
    visit(node, visitWithTypeInfo(typeInfo, {
        Argument: () => {
            const argument = typeInfo.getArgument();
            const field = typeInfo.getFieldDef();
            if (field &&
                argument &&
                (argument.deprecationReason != null || argument.isDeprecated)) {
                found.push({
                    fieldName: argument.name,
                    // the GraphQLArgument type doesn't contain context regarding the mutation the argument was passed to
                    // however, when visiting an argument, typeInfo.getFieldDef returns the mutation
                    typeName: field.name, // this is the mutation name
                });
            }
        },
        Field: () => {
            const field = typeInfo.getFieldDef();
            if (field && (field.deprecationReason != null || field.isDeprecated)) {
                found.push({
                    fieldName: field.name,
                    typeName: typeInfo.getParentType().name || '',
                });
            }
        },
    }));
    return found;
}
export function labelExists(config, label) {
    const labelFlag = config.labels?.[label];
    if (labelFlag == null) {
        return true;
    }
    return !!labelFlag;
}
export function filterFillParamsFnParams(config, params) {
    return Object.fromEntries(Object.entries(params).filter(([key]) => labelExists(config, key)));
}
const clearRegistry = new WeakMap();
export function instrumentRegistry(registry) {
    if (!clearRegistry.has(registry)) {
        clearRegistry.set(registry, registry.clear.bind(registry));
    }
    registry.clear = () => {
        histograms.delete(registry);
        summaries.delete(registry);
        counters.delete(registry);
        clearRegistry.get(registry)();
    };
    return registry;
}
function isBucketsList(list) {
    return list.every(item => typeof item === 'number');
}
function isPhasesList(list) {
    return list.every(item => typeof item === 'string');
}
function filterAvailablePhases(phases, availablePhases) {
    return availablePhases.filter(phase => phases.includes(phase));
}
