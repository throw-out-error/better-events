import { eventPromiseCache } from "./lib/eventPromiseCache";
import { shareEvent } from "./lib/shareEvent";
import { EventEmitter } from "events";
import { StringDecoder } from "string_decoder";
import { Socket } from "net";

export type EmitterFunction = (...args: any[]) => void;

/**
 * Class representing better EventEmitter.
 * @class
 * @extends EventEmitter
 */
export class BetterEventEmitter extends EventEmitter {
    /**
     * Return a promise that gets resolved when the event is emitted by the source.
     * @param {Emitter} source - The source of the event.
     * @param {string} eventName - The name of the event.
     * @param {boolean} [arrayMode] - Convert all arguments of the event into an array.
     * @returns {Promise.<*>}
     */
    static once(
        source: EventEmitter,
        eventName: string,
        arrayMode: boolean,
    ): Promise<unknown> {
        if (!(source instanceof EventEmitter)) {
            return Promise.reject(
                new TypeError("source must be an instance of EventEmitter"),
            );
        }

        if (arrayMode && eventName !== "error") {
            const cacheProp = "_arrayEventPromises";
            const fn = (resolve) => {
                source.once(eventName, (...args) => resolve(args));
            };

            return eventPromiseCache(source, cacheProp, eventName, fn);
        }

        const cacheProp = "_eventPromises";
        const fn = (resolve, reject) => {
            if (eventName === "error") {
                return source.once("error", reject);
            }

            source.once(eventName, resolve);
        };

        return eventPromiseCache(source, cacheProp, eventName, fn);
    }

    /**
     * Listen for an event once.
     * @param {string} eventName - The name of the event.
     * @param {true|function} [listener] - Function that listens for the event. If set to true, the array-mode will be used and a promise will be returned.
     * @returns {BetterEventEmitter|Promise.<*>} - If no callback is provided, a promise gets returned.
     */
    once(eventName: string, listener?: true | EmitterFunction) {
        if (typeof listener === "function") {
            return super.once(eventName, listener);
        }

        return BetterEventEmitter.once(this, eventName, listener);
    }

    /**
     * Collect an event from the source.
     * @param {string} eventName - The name of the event.
     * @param {Emitter} source - The source of the Event.
     * @returns {callback} - The callback that has been applied to the source.
     */
    collect(eventName: string, source: EventEmitter) {
        return shareEvent(eventName, source, this);
    }

    /**
     * Collect an event from the source once.
     * @param {string} eventName - The name of the event.
     * @param {Emitter} source - The source of the Event.
     * @returns {callback} - The callback that has been applied to the source.
     */
    collectOnce(eventName: string, source: EventEmitter) {
        return shareEvent(eventName, source, this, true);
    }

    /**
     * Share an event an event with the target.
     * @param {string} eventName - The name of the event.
     * @param {Emitter} target - The target for the Event.
     * @returns {callback} - The callback that has been applied to the target.
     */
    share(eventName: string, target: EventEmitter) {
        return shareEvent(eventName, this, target);
    }

    /**
     * Share an event an event with the target once.
     * @param {string} eventName - The name of the event.
     * @param {Emitter} target - The target for the Event.
     * @returns {callback} - The callback that has been applied to the target.
     */
    shareOnce(eventName: string, target: EventEmitter) {
        return shareEvent(eventName, this, target, true);
    }
}

/**
 * Class representing a connection to the daemon.
 * @class
 */
export class Connection extends BetterEventEmitter {
    socket: Socket;
    _message: string;

    static Connection: typeof Connection;
    /**
     * Create a new connection to the daemon.
     * @param {*} socket
     */
    constructor(socket: Socket) {
        super();

        this.socket = socket;
        this._message = "";

        const decoder = new StringDecoder();

        socket.on("data", async (chunk) => {
            this._message += decoder.write(chunk);

            this._parse();
        });

        socket.once("end", async () => {
            this._message += decoder.end();
            this._parse();
        });
    }

    /**
     * Is true if the underlying socket is not writable.
     * @returns {boolean}
     */
    get isDead(): boolean {
        return !this.socket.writable;
    }

    /**
     * Parses this._message and emits the "message" event if one was received.
     * @returns {void}
     */
    _parse(): void {
        while (true) {
            const i = this._message.indexOf("\n");
            if (i === -1) {
                break;
            }

            const msg = this._message.substr(0, i);
            this._message = this._message.substr(i + 1);

            try {
                const obj = JSON.parse(msg);
                this.emit("message", obj);
            } catch (error) {
                error.text = msg;
                this.emit("error", error);
            }
        }
    }

    /**
     * Writes a message to the socket. Returns true if the message was written to the socket.
     * @param {*} data - The object to transmit.
     * @returns {boolean}
     */
    send(data): boolean {
        if (this.isDead) {
            return false;
        }

        this.socket.write(JSON.stringify(data) + "\n");
        return true;
    }

    /**
     * Close the connection.
     * @returns {boolean}
     */
    close(): boolean {
        if (this.isDead) {
            return false;
        }

        this.socket.end();
        return true;
    }
}

/**
 * Class representing a RemoteEventEmitter.
 */
export class RemoteEventEmitter extends Connection {
    /**
     * Create a new RemoteEventEmitter.
     * @param {*} socket - The socket to write the events to.
     */
    constructor(socket: Socket) {
        super(socket);

        this.on("message", (msg) => {
            const { type } = msg;

            if (type !== "event") {
                return;
            }

            const { event, args } = msg;

            if (event === "error" && !args) {
                const { name, message, stack, custom } = msg;

                const Constructor = global[name] || Error;

                // reassemble error
                const error = new Constructor(message);
                error.stack = stack;
                Object.assign(error, custom);

                return this.emit(event, error);
            }

            this.emit(event, ...args);
        });
    }

    /**
     * Emit an event on the EventEmitter on the other side of the socket connection. Returns true if the event was written to the socket.
     * @param {string} event - The name of the event.
     * @param {*} args - Arguments for the event.
     * @returns {boolean}
     */
    remoteEmit(event, ...args) {
        if (event === "error" && args[0] instanceof Error) {
            const error = args[0];

            // disassemble error
            const { name, message, stack } = error;
            const custom = Object.assign({}, error);

            return this.send({
                type: "event",
                event,
                name,
                message,
                stack,
                custom,
            });
        }

        return this.send({
            type: "event",
            event,
            args,
        });
    }
}

export * from "./lib/eventPromiseCache";
export * from "./lib/shareEvent";
export * from "./lib/verifyEventEmitter";
export const once = BetterEventEmitter.once;
