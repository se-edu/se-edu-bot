import sourceMapSupport = require('source-map-support');
sourceMapSupport.install();

import dotenv = require('dotenv');
dotenv.config();

import Koa = require('koa');
import koaRoute = require('koa-route');

/**
 * Server app configuration.
 */
export interface AppConfig {
    /**
     * True if the server is being served behind a proxy.
     */
    proxy: boolean;
}

/**
 * Creates a Koa Application with the provided `appConfig`.
 */
export function createApp(appConfig: AppConfig): Koa {
    const app = new Koa();
    app.proxy = appConfig.proxy;

    app.use(koaRoute.get('/', async ctx => {
        ctx.body = 'Hello world!';
    }));

    return app;
}

/**
 * Extracts {@link AppConfig} from `process.env`.
 */
function extractAppConfigFromEnv(): AppConfig {
    return {
        proxy: !!extractEnvVar('PROXY', ''),
    };
}

/**
 * Extracts an environment variable from `process.env`.
 * @throws {Error} Environment variable not defined and `defaultValue` not provided.
 */
function extractEnvVar(key: string, defaultValue?: string): string {
    if (typeof process.env[key] === 'string' && process.env[key]) {
        return process.env[key];
    } else if (typeof defaultValue !== 'undefined') {
        return defaultValue;
    } else {
        throw new Error(`$${key} not defined`);
    }
}

if (require.main === module) {
    const port = parseInt(extractEnvVar('PORT', '5000'), 10);
    const app = createApp(extractAppConfigFromEnv());
    app.listen(port);
}
