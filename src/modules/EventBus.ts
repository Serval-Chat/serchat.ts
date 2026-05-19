type CallbackNames<K extends string> = K extends 'messageCreate'
    ? 'onMessage' | 'onMessageCreate'
    : K extends 'interactionCreate'
      ? 'onInteraction' | 'onInteractionCreate'
      : `on${Capitalize<K>}`;

type AnyArray = readonly (
    | string
    | number
    | boolean
    | symbol
    | bigint
    | object
    | null
    | undefined
)[];

export type EventSubscriber<Events extends Record<keyof Events, AnyArray>> = {
    [K in keyof Events & string as CallbackNames<K>]?: (...args: Events[K]) => void | Promise<void>;
};

export interface EventBusOptions<Events extends Record<keyof Events, AnyArray>> {
    logger?: {
        error(message: string): void;
    };
    errorEvent?: keyof Events;
}

/**
 * Event dispatcher to fan gateway events out.
 */
export class EventBus<Events extends Record<keyof Events, AnyArray>> {
    private listeners: {
        [K in keyof Events]?: Set<(...args: Events[K]) => void | Promise<void>>;
    } = {};

    private logger?: EventBusOptions<Events>['logger'];
    private errorEvent?: keyof Events;

    private subscriberListeners = new Map<
        EventSubscriber<Events>,
        { [K in keyof Events]?: Set<(...args: Events[K]) => void | Promise<void>> }
    >();

    constructor(options: EventBusOptions<Events> = {}) {
        this.logger = options.logger;
        this.errorEvent = options.errorEvent;
    }

    /**
     * Registers all event handler methods on an object.
     */
    public register(subscriber: EventSubscriber<Events>): void {
        if (!subscriber || typeof subscriber !== 'object') {
            return;
        }

        const registered: {
            [K in keyof Events]?: Set<(...args: Events[K]) => void | Promise<void>>;
        } = {};
        const keys = this.getMethods(subscriber);

        for (const key of keys) {
            if (typeof key === 'string') {
                const eventNames = this.getEventNamesForCallback(key);
                for (const eventName of eventNames) {
                    const method = subscriber[key];
                    if (typeof method === 'function') {
                        type CurrentListener = (
                            ...args: Events[typeof eventName]
                        ) => void | Promise<void>;
                        const typedMethod = method as CurrentListener;

                        const listener = (
                            ...args: Events[typeof eventName]
                        ): void | Promise<void> => {
                            try {
                                const result = typedMethod(...args);
                                if (result instanceof Promise) {
                                    void result.catch((err) => {
                                        const error =
                                            err instanceof Error ? err : new Error(String(err));
                                        this.handleListenerError(eventName, error);
                                    });
                                }
                                return result;
                            } catch (err) {
                                const error = err instanceof Error ? err : new Error(String(err));
                                this.handleListenerError(eventName, error);
                            }
                        };

                        this.on(eventName, listener);

                        let listenersSet = registered[eventName];
                        if (!listenersSet) {
                            listenersSet = new Set();
                            registered[eventName] = listenersSet;
                        }
                        listenersSet.add(listener);
                    }
                }
            }
        }

        if (Object.keys(registered).length > 0) {
            this.subscriberListeners.set(subscriber, registered);
        }
    }

    /**
     * Unregisters all event handler methods previously registered for the given subscriber.
     */
    public unregister(subscriber: EventSubscriber<Events>): void {
        const registered = this.subscriberListeners.get(subscriber);
        if (registered) {
            for (const event of Object.keys(registered) as (keyof Events)[]) {
                const listenersSet = registered[event];
                if (listenersSet) {
                    for (const listener of listenersSet) {
                        this.off(event, listener);
                    }
                }
            }
            this.subscriberListeners.delete(subscriber);
        }
    }

    private getEventNamesForCallback(callbackName: string): (keyof Events)[] {
        if (!callbackName.startsWith('on') || callbackName.length <= 2) {
            return [];
        }

        const eventPart = callbackName.slice(2);
        const decapitalized = (eventPart.charAt(0).toLowerCase() +
            eventPart.slice(1)) as keyof Events;

        const results: (keyof Events)[] = [decapitalized];

        if (callbackName === 'onMessage') {
            results.push('messageCreate' as keyof Events);
        }
        if (callbackName === 'onMessageCreate') {
            results.push('messageCreate' as keyof Events);
        }
        if (callbackName === 'onInteraction') {
            results.push('interactionCreate' as keyof Events);
        }
        if (callbackName === 'onInteractionCreate') {
            results.push('interactionCreate' as keyof Events);
        }

        return results;
    }

    private getMethods(obj: EventSubscriber<Events>): (keyof EventSubscriber<Events>)[] {
        const methods: (keyof EventSubscriber<Events>)[] = [];
        let currentObj: object | null = obj;

        while (currentObj && currentObj !== Object.prototype) {
            const props = Object.getOwnPropertyNames(currentObj);
            for (const prop of props) {
                if (prop !== 'constructor') {
                    const val = (obj as Record<string, Function>)[prop];
                    if (typeof val === 'function') {
                        const key = prop as keyof EventSubscriber<Events>;
                        if (!methods.includes(key)) {
                            methods.push(key);
                        }
                    }
                }
            }
            currentObj = Object.getPrototypeOf(currentObj) as object | null;
        }

        return methods;
    }

    public on<K extends keyof Events>(
        event: K,
        listener: (...args: Events[K]) => void | Promise<void>,
    ): this {
        let listeners = this.listeners[event];
        if (!listeners) {
            listeners = new Set();
            this.listeners[event] = listeners;
        }
        listeners.add(listener);
        return this;
    }

    public once<K extends keyof Events>(
        event: K,
        listener: (...args: Events[K]) => void | Promise<void>,
    ): this {
        const wrappedListener = (...args: Events[K]): void | Promise<void> => {
            this.off(event, wrappedListener);
            return listener(...args);
        };

        return this.on(event, wrappedListener);
    }

    public off<K extends keyof Events>(
        event: K,
        listener: (...args: Events[K]) => void | Promise<void>,
    ): this {
        this.listeners[event]?.delete(listener);
        return this;
    }

    public emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
        const listeners = this.listeners[event];
        if (!listeners || listeners.size === 0) {
            return false;
        }

        for (const listener of listeners) {
            try {
                const result = listener(...args);
                if (result instanceof Promise) {
                    void result.catch((err) => {
                        const error = err instanceof Error ? err : new Error(String(err));
                        this.handleListenerError(event, error);
                    });
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                this.handleListenerError(event, error);
            }
        }

        return true;
    }

    private handleListenerError(event: keyof Events, error: Error): void {
        this.logger?.error(`Event listener for "${String(event)}" failed: ${error.message}`);

        if (this.errorEvent && event !== this.errorEvent) {
            this.emitError(error);
        }
    }

    private emitError(error: Error): void {
        if (!this.errorEvent) {
            return;
        }

        this.emit(this.errorEvent as never, ...([error] as never));
    }
}
