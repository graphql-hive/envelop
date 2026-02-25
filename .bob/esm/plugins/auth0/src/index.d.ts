import { DecodeOptions, VerifyOptions } from 'jsonwebtoken';
import * as JwksRsa from 'jwks-rsa';
import { Plugin } from '@envelop/core';
export type Auth0PluginOptions = {
    domain: string;
    audience: VerifyOptions['audience'];
    preventUnauthenticatedAccess?: boolean;
    onError?: (error: Error) => void;
    extractTokenFn?: (context: unknown) => Promise<string> | string;
    jwksClientOptions?: JwksRsa.Options;
    jwtVerifyOptions?: VerifyOptions;
    jwtDecodeOptions?: DecodeOptions;
    extendContextField?: '_auth0' | string;
    tokenType?: string;
    headerName?: string;
};
export declare class UnauthenticatedError extends Error {
}
export type UserPayload = {
    sub: string;
    [key: string]: any;
};
type BuildContext<TOptions extends Auth0PluginOptions> = TOptions['extendContextField'] extends string ? {
    [TName in TOptions['extendContextField'] as TOptions['extendContextField']]: UserPayload;
} : {
    _auth0: UserPayload;
};
export declare const useAuth0: <TOptions extends Auth0PluginOptions>(options: TOptions) => Plugin<BuildContext<TOptions>>;
export {};
