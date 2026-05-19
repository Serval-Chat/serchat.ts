import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/modules/EventBus.js';

interface TestEvents {
    message: [content: string, userId: string];
    empty: [];
    error: [Error];
}

describe('EventBus', () => {
    it('sends the same payload to multiple listeners', () => {
        const bus = new EventBus<TestEvents>();
        const first = vi.fn();
        const second = vi.fn();

        bus.on('message', first);
        bus.on('message', second);
        bus.emit('message', 'hello', 'user-1');

        expect(first).toHaveBeenCalledWith('hello', 'user-1');
        expect(second).toHaveBeenCalledWith('hello', 'user-1');
    });

    it('calls listeners in registration order', () => {
        const bus = new EventBus<TestEvents>();
        const calls: string[] = [];

        bus.on('empty', () => {
            calls.push('first');
        });
        bus.on('empty', () => {
            calls.push('second');
        });
        bus.emit('empty');

        expect(calls).toEqual(['first', 'second']);
    });

    it('runs once listeners only once', () => {
        const bus = new EventBus<TestEvents>();
        const listener = vi.fn();

        bus.once('empty', listener);
        bus.emit('empty');
        bus.emit('empty');

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('removes listeners with off', () => {
        const bus = new EventBus<TestEvents>();
        const listener = vi.fn();

        bus.on('empty', listener);
        bus.off('empty', listener);
        bus.emit('empty');

        expect(listener).not.toHaveBeenCalled();
    });

    it('keeps dispatching when a listener throws', () => {
        const bus = new EventBus<TestEvents>({ errorEvent: 'error' });
        const errorListener = vi.fn();
        const laterListener = vi.fn();

        bus.on('error', errorListener);
        bus.on('empty', () => {
            throw new Error('boom');
        });
        bus.on('empty', laterListener);
        bus.emit('empty');

        expect(errorListener).toHaveBeenCalledWith(expect.any(Error));
        expect(laterListener).toHaveBeenCalled();
    });

    describe('subscriber registration', () => {
        it('registers method callbacks starting with on', () => {
            const bus = new EventBus<TestEvents>();
            const messageSpy = vi.fn();
            const emptySpy = vi.fn();

            const subscriber = {
                onMessage(content: string, userId: string) {
                    messageSpy(content, userId);
                },
                onEmpty() {
                    emptySpy();
                },
                ignoredMethod() {
                    // should not be registered as an event
                },
            };

            bus.register(subscriber);

            bus.emit('message', 'hi', 'u-1');
            bus.emit('empty');

            expect(messageSpy).toHaveBeenCalledWith('hi', 'u-1');
            expect(emptySpy).toHaveBeenCalled();
        });

        it('supports aliases like onMessage and onInteraction for specific events', () => {
            const bus = new EventBus<{
                messageCreate: [string];
                interactionCreate: [string];
            }>();
            const msgSpy1 = vi.fn();
            const msgSpy2 = vi.fn();
            const intSpy1 = vi.fn();
            const intSpy2 = vi.fn();

            const subscriber = {
                onMessage(arg: string) {
                    msgSpy1(arg);
                },
                onMessageCreate(arg: string) {
                    msgSpy2(arg);
                },
                onInteraction(arg: string) {
                    intSpy1(arg);
                },
                onInteractionCreate(arg: string) {
                    intSpy2(arg);
                },
            };

            bus.register(subscriber);

            bus.emit('messageCreate', 'hello message');
            bus.emit('interactionCreate', 'hello interaction');

            expect(msgSpy1).toHaveBeenCalledWith('hello message');
            expect(msgSpy2).toHaveBeenCalledWith('hello message');
            expect(intSpy1).toHaveBeenCalledWith('hello interaction');
            expect(intSpy2).toHaveBeenCalledWith('hello interaction');
        });

        it('unregisters all subscriber callbacks', () => {
            const bus = new EventBus<TestEvents>();
            const messageSpy = vi.fn();

            const subscriber = {
                onMessage(content: string, userId: string) {
                    messageSpy(content, userId);
                },
            };

            bus.register(subscriber);
            bus.emit('message', 'first', 'u-1');
            expect(messageSpy).toHaveBeenCalledTimes(1);

            bus.unregister(subscriber);
            bus.emit('message', 'second', 'u-2');
            expect(messageSpy).toHaveBeenCalledTimes(1);
        });

        it('handles errors in subscriber callbacks and redirects to errorEvent if enabled', () => {
            const bus = new EventBus<TestEvents>({ errorEvent: 'error' });
            const errorSpy = vi.fn();

            const subscriber = {
                onEmpty() {
                    throw new Error('callback failed');
                },
            };

            bus.on('error', errorSpy);
            bus.register(subscriber);
            bus.emit('empty');

            expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
            expect(errorSpy.mock.calls[0][0].message).toContain('callback failed');
        });
    });
});
