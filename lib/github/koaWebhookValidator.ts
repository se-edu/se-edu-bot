import Koa = require('koa');
import crypto = require('crypto');
import createError = require('http-errors');
import { isEventName } from './events';

/**
 * Returns a {@link Koa.Middleware} which will check that the request is a valid GitHub Webhook request.
 *
 * @param secret Secret that the request body should be signed with.
 */
export function koaWebhookValidator(secret: string): Koa.Middleware {
    return async (ctx, next) => {
        const eventName: string | undefined = ctx.headers['x-github-event'];
        if (typeof eventName !== 'string') {
            throw createError(400, 'X-Github-Event not sent');
        }
        if (typeof ctx.headers['x-github-delivery'] !== 'string') {
            throw createError(400, 'X-Github-Delivery not sent');
        }
        if (typeof ctx.request.body !== 'object') {
            throw createError(400, 'body is not an object');
        }
        const rawBody: string | Buffer | undefined = (ctx.request as any).rawBody;
        if (typeof rawBody === 'undefined') {
            throw createError(500, 'rawBody not provided');
        }
        const actualSignature = ctx.headers['x-hub-signature'];
        if (typeof actualSignature !== 'string') {
            throw createError(400, 'X-Hub-Signature not sent');
        }

        // validate signature
        const hmac = crypto.createHmac('sha1', secret);
        hmac.update(rawBody);
        const expectedSignature = `sha1=${hmac.digest('hex')}`;
        if (actualSignature !== expectedSignature) {
            throw createError(400, 'signature validation failed');
        }

        // validate event name
        if (!isEventName(eventName)) {
            throw createError(400, 'invalid event name');
        }

        ctx.body = { ok: true };
        if (next) {
            await next();
        }
    };
}
