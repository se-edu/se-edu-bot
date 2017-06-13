import * as github from '../lib/github';
import Logic from './Logic';
import Koa = require('koa');

/**
 * Useful {@link Logic} base class.
 */
export default class BaseLogic implements Logic {
    async onPing(event: github.PingEvent): Promise<void> {
        // do nothing
    }

    async webhookMiddleware(ctx: Koa.Context, next?: () => Promise<void>): Promise<void> {
        const event = ctx.request.body;
        switch (github.getEventName(ctx)) {
        case 'ping':
            this.onPing(event).catch(onError);
            break;
        default:
        }

        if (next) {
            await next();
        }

        function onError(e: any): void {
            console.error(e);
        }
    }
}
