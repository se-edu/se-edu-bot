import Koa = require('koa');
import {
    createAccessTokenApi,
    createAppApi,
    CreateAppApiOptions,
    RequestApi,
} from './api';

/**
 * Context mixed-in into the Koa context by {@link koaGhAppApi} middleware.
 */
export interface GhAppApiCtx {
    ghAppApi: RequestApi;
}

/**
 * Returns a {@link Koa.Middleware} which will set `ctx.ghAppApi` to a {@link RequestApi}
 * which authorizes as the specified GitHub App.
 */
export function koaGhAppApi(options: CreateAppApiOptions): Koa.Middleware {
    return async (ctx: Partial<GhAppApiCtx>, next) => {
        ctx.ghAppApi = createAppApi(options);

        if (next) {
            await next();
        }

        delete ctx.ghAppApi;
    };
}

/**
 * Retrieves the `ghAppApi` from the `ctx` object.
 *
 * @throws TypeError if the ctx object does not have `ghAppApi`.
 */
export function requireGhAppApi(ctx: object): RequestApi {
    const ghAppApi = (ctx as Partial<GhAppApiCtx>).ghAppApi;
    if (!ghAppApi) {
        throw new TypeError('ctx.ghAppApi not present');
    }
    return ghAppApi;
}

/**
 * Context mixed-in into the Koa context by {@link koaGhInstallationApi} middleware.
 */
export interface GhInstallationApiCtx {
    ghInstallationApi: RequestApi;
}

/**
 * Options to pass to {@link koaGhInstallationApi}.
 */
export interface KoaGhInstallationApiOptions {
    installationId: number;
    userAgent: string;
}

/**
 * Returns a {@link Koa.Middleware} which will set `ctx.ghInstallationApi` to a {@link RequestApi}
 * which authorizes as the specified installation.
 */
export function koaGhInstallationApi(options: KoaGhInstallationApiOptions): Koa.Middleware {
    return async (ctx: Partial<GhInstallationApiCtx>, next) => {
        const ghAppApi = requireGhAppApi(ctx);

        // grab an access token
        const resp = await ghAppApi.post(`installations/${options.installationId}/access_tokens`);
        if (typeof resp.token !== 'string') {
            throw new Error('invalid response');
        }
        ctx.ghInstallationApi = createAccessTokenApi({
            accessToken: resp.token,
            userAgent: options.userAgent,
        });

        if (next) {
            await next();
        }

        delete ctx.ghInstallationApi;
    };
}

/**
 * Retrieves the `ghInstallationApi` from the `ctx` object.
 *
 * @throws TypeError if the ctx object does not have `ghInstallationApi`.
 */
export function requireGhInstallationApi(ctx: object): RequestApi {
    const ghInstallationApi = (ctx as Partial<GhInstallationApiCtx>).ghInstallationApi;
    if (!ghInstallationApi) {
        throw new TypeError('ctx.ghInstallationApi not present');
    }
    return ghInstallationApi;
}
