declare enum CacheScope {
    Public = "PUBLIC",
    Private = "PRIVATE"
}
interface CacheHint {
    maxAge?: number;
    scope?: CacheScope;
}
export interface CachePolicy {
    maxAge: number | undefined;
    scope: CacheScope | undefined;
    restrict(hint: CacheHint): void;
    replace(hint: CacheHint): void;
    policyIfCacheable(): {
        maxAge: number;
        scope: CacheScope;
    } | null;
}
export declare function newCachePolicy(): CachePolicy;
export {};
