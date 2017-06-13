import {
    Enum,
} from 'typescript-string-enums';

/**
 * Webhook event name.
 */
export const EventName = Enum(
    'ping');
export type EventName = Enum<typeof EventName>;

/**
 * Returns true if `value` is a valid {@link EventName}
 */
export function isEventName(value: any): value is EventName {
    return typeof value === 'string' && Enum.isType(EventName, value);
}

/**
 * Extracts event name from the Koa context.
 */
export function getEventName(ctx: { get(key: string): string | undefined }): EventName {
    const eventName = ctx.get('x-github-event');
    if (!isEventName(eventName)) {
        throw new Error(`BUG: invalid eventName ${eventName}`);
    }
    return eventName;
}

export { PingEvent } from './PingEvent';
