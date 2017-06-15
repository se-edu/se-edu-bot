/**
 * Triggered when a new webhook is created or the ping endpoint is called.
 */
export interface PingEvent {
    hook: {
        app_id: number;
    };
}

export default PingEvent;
