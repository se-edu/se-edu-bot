import Koa = require('koa');
import koaCompose = require('koa-compose');
import koaRoute = require('koa-route');
import simpleOauth2 = require('simple-oauth2');
import createError = require('http-errors');
import * as github from '../lib/github';

/**
 * Options to pass to {@link Auth}.
 */
export interface AuthOptions {
    clientId: string;
    clientSecret: string;
    baseRoute: string;
    accessTokenCookieName: string;
    redirectCookieName?: string;
    defaultRedirect?: string;
    userAgent: string;
}

/**
 * GitHub user authentication.
 */
export class Auth {
    readonly middleware: Koa.Middleware;

    private readonly oauth2: simpleOauth2.OAuthClient;
    private readonly loginRoute: string;
    private readonly loginCallbackRoute: string;
    private readonly logoutRoute: string;
    private readonly accessTokenCookieName: string;
    private readonly redirectCookieName: string;
    private readonly defaultRedirect: string;
    private readonly userAgent: string;

    constructor(options: AuthOptions) {
        this.oauth2 = simpleOauth2.create({
            auth: {
                authorizePath: '/login/oauth/authorize',
                tokenHost: 'https://github.com',
                tokenPath: '/login/oauth/access_token',
            },
            client: {
                id: options.clientId,
                secret: options.clientSecret,
            },
        });
        this.loginRoute = `${options.baseRoute}/login`;
        this.loginCallbackRoute = `${options.baseRoute}/login/callback`;
        this.logoutRoute = `${options.baseRoute}/logout`;
        this.accessTokenCookieName = options.accessTokenCookieName;
        this.redirectCookieName = options.redirectCookieName || 'AUTH_REDIRECT';
        this.defaultRedirect = options.defaultRedirect || '/';
        this.userAgent = options.userAgent;

        this.middleware = koaCompose<Koa.Context>([
            koaRoute.get(this.loginRoute, this.loginMiddleware.bind(this)),
            koaRoute.get(this.loginCallbackRoute, this.loginCallbackMiddleware.bind(this)),
            koaRoute.get(this.logoutRoute, this.logoutMiddleware.bind(this)),
        ]);
    }

    createAccessControlByInstallationId(installationId: number): Koa.Middleware {
        return async (ctx: Koa.Context, next?: () => Promise<void>): Promise<void> => {
            const ghUserApi = this.getGhUserApi(ctx);
            if (!ghUserApi) {
                ctx.redirect(this.getLoginRedirect(ctx));
                return;
            }

            // Check that the user has access to our installation
            const installationIds: number[] = [];
            await github.forEachPage(ghUserApi, {
                url: 'user/installations',
            }, body => {
                const installations: any[] = body.installations;
                installations.forEach(installation => installationIds.push(installation.id));
            });

            if (!installationIds.includes(installationId)) {
                throw createError(403, 'User is not authorized to access this page');
            }

            if (next) {
                await next();
            }
        };
    }

    private getGhUserApi(ctx: Koa.Context): github.RequestApi | undefined {
        const accessToken = ctx.cookies.get(this.accessTokenCookieName);
        if (!accessToken) {
            return;
        }
        return github.createAccessTokenApi({
            accessToken,
            userAgent: this.userAgent,
        });
    }

    private async loginMiddleware(ctx: Koa.Context): Promise<void> {
        const authorizationUri = this.oauth2.authorizationCode.authorizeURL({
            redirect_uri: this.getOauthRedirectUri(ctx),
        });
        if (ctx.query.redirect) {
            ctx.cookies.set(this.redirectCookieName, ctx.query.redirect, {
                overwrite: true,
            });
        } else {
            ctx.cookies.set(this.redirectCookieName);
        }
        ctx.redirect(authorizationUri);
    }

    private async loginCallbackMiddleware(ctx: Koa.Context): Promise<void> {
        const redirect: string | undefined = ctx.cookies.get(this.redirectCookieName);
        ctx.cookies.set(this.redirectCookieName);

        const code: string | undefined = ctx.query.code;
        if (typeof code !== 'string') {
            throw createError(400, 'code not provided');
        }

        const token = await this.oauth2.authorizationCode.getToken({
            code,
            redirect_uri: this.getOauthRedirectUri(ctx),
        });
        if (!token.access_token) {
            throw createError(403, token.error_description || 'Unknown error');
        }

        ctx.cookies.set(this.accessTokenCookieName, token.access_token, {
            overwrite: true,
        });

        ctx.redirect(this.getRedirect(redirect));
    }

    private async logoutMiddleware(ctx: Koa.Context): Promise<void> {
        ctx.cookies.set(this.accessTokenCookieName);
        ctx.redirect(this.getRedirect(ctx.query.redirect));
    }

    private getOauthRedirectUri(ctx: Koa.Context): string {
        return `${ctx.origin}${this.loginCallbackRoute}`;
    }

    private getRedirect(redirect?: string): string {
        if (!redirect || !redirect.startsWith('/')) {
            return this.defaultRedirect;
        }
        return redirect;
    }

    private getLoginRedirect(ctx: Koa.Context): string {
        const redirect = `${ctx.path}${ctx.search}`;
        return `${this.loginRoute}?redirect=${encodeURIComponent(redirect)}`;
    }
}

export default Auth;
