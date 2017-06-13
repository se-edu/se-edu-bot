import BaseLogic from './BaseLogic';
import Koa = require('koa');

/**
 * Log all webhook payloads to the console.
 */
export default class LogWebhookLogic extends BaseLogic {
    async webhookMiddleware(ctx: Koa.Context, next?: () => Promise<void>): Promise<void> {
        console.log(ctx.request.body);
        await super.webhookMiddleware(ctx, next);
    }
}
