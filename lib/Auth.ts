import Koa = require('koa');
import koaCompose = require('koa-compose');
import koaRoute = require('koa-route');
import simpleOauth2 = require('simple-oauth2');
import createError = require('http-errors');

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
}

export default Auth;
