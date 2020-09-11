import { EventEmitter } from "events";

/**
 * Throws an error if the value is not an EventEmitter.
 * @param {*} value - The value to verify.
 * @param {string} name  - The name of the variable.
 */
export function verifyEventEmitter(value: unknown, name: string): void {
    if (!(value && value instanceof EventEmitter)) {
        throw new TypeError(name + " must be an instance of EventEmitter");
    }
}
