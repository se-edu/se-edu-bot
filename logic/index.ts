import Logic from './Logic';
import LogWebhookLogic from './LogWebhookLogic';
import koaCompose = require('koa-compose');

/**
 * Options to be passed to {@link createLogic}.
 */
export interface CreateLogicOptions {
}

/**
 * Constructs the bot logic configured with `options`.
 */
export function createLogic(options: CreateLogicOptions): Logic {
    const logics: Logic[] = [];

    logics.push(new LogWebhookLogic());

    const webhookMiddleware = koaCompose(logics.map(logic => logic.webhookMiddleware.bind(logic)));
    return {
        webhookMiddleware,
    };
}

export { Logic } from './Logic';
