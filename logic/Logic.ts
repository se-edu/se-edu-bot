import Koa = require('koa');

/**
 * A piece of logic which defines the behavior of the bot.
 */
export interface Logic {
    webhookMiddleware: Koa.Middleware;
}

export default Logic;
