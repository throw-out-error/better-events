import { EventEmitter } from "events";
import { Subject, BehaviorSubject, Subscription, Observable } from "rxjs";

/*export function toRx(emitter: EventEmitter) {
    const rx = new RxEmitter();

    emitter
        .eventNames()
        .forEach((e: string) => emitter.on(e, (args) => rx.emit(e, args)));

    return rx;
}*/

export type Pipeable<T> = {
    observable: Observable<T>;
    subscription?: Subscription;
};

export class RxEmitter {
    /**
     * Hash map of subjects
     * @type {Subject}
     */
    private subjects: { [key: string]: Subject<unknown> } = {};

    /**
     * Constructor
     * @param immediate {boolean} Immediate value or emit with the last value
     */
    constructor(private immediate = true) {}

    /**
     * Emits events through a subject to all subscribed broadcaster
     * @param name {string} Name of an event
     * @param data {unknown} Event data
     */
    emit(name: string, data?: unknown): RxEmitter {
        if (typeof this.subjects[name] === "undefined")
            this.subjects[name] = this.immediate
                ? new Subject()
                : new BehaviorSubject(null);

        this.subjects[name].next(data);
        return this;
    }

    /**
     * Subscribes a Observer (listener) to an event.
     * @param name {string} Name of an event
     * @param handler {unknown} Callback of the listener (subscriber)
     * @returns {Subscription}
     */
    on<T>(name: string, handler?: RxEmitterFunction<T>): Pipeable<T> {
        if (typeof this.subjects[name] === "undefined")
            this.subjects[name] = this.immediate
                ? new Subject()
                : new BehaviorSubject(null);

        return {
            observable: this.subjects[name] as Observable<T>,
            subscription: this.subjects[name].subscribe(handler),
        };
    }

    /**
     * Subscribes a Observer (listener) to an event.
     * @param name {string} Name of an event
     * @param handler {unknown} Callback of the listener (subscriber)
     * @returns {Subscription}
     */
    once<T>(name: string, handler?: RxEmitterFunction<T>): Pipeable<T> {
        if (typeof this.subjects[name] === "undefined")
            this.subjects[name] = this.immediate
                ? new Subject()
                : new BehaviorSubject(null);

        const observer = this.subjects[name].subscribe({
            ...handler,
            complete: () => {
                if (isCompletionObserver(handler)) handler();
                observer.unsubscribe();
            },
        });
        return {
            observable: this.subjects[name] as Observable<T>,
        };
    }

    /**
     * Cleans up a Subject and remove all its observers.
     * Also it removes the subject from subject map.
     */
    dispose(name: string): RxEmitter {
        if (this.subjects[name]) {
            this.subjects[name].unsubscribe();
            delete this.subjects[name];
        }
        return this;
    }

    /**
     * Clean up all Observers and clean up map of Subjects
     */
    disposeAll(): RxEmitter {
        const subjects = this.subjects;
        const hasOwnProp = {}.hasOwnProperty;
        for (const prop in subjects)
            if (hasOwnProp.call(subjects, prop)) subjects[prop].unsubscribe();

        this.subjects = {};
        return this;
    }
}

export type NextObserver<T> = (value: T) => void;
export type ErrorObserver = (err: Error) => void;
export type CompletionObserver = () => void;

/**
 * An event emitter listener function with a result value of T.
 */
export type RxEmitterFunction<T> =
    | NextObserver<T>
    | ErrorObserver
    | CompletionObserver;

export function isCompletionObserver<T>(
    fn: RxEmitterFunction<T>
): fn is CompletionObserver {
    const argTypes: Parameters<typeof fn> = null;
    return argTypes[0][0] === undefined;
}

export function isErrorObserver<T>(
    fn: RxEmitterFunction<T>
): fn is ErrorObserver {
    const argTypes: Parameters<typeof fn> = null;
    return argTypes[0][0] && argTypes[0][0] instanceof Error;
}

export type Emitter = RxEmitter | EventEmitter;
