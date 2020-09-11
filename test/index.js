const assert = require("assert");
const net = require("net");
const { once, RemoteEventEmitter } = require("../dist");

describe("socket-json-wrapper", function () {
    beforeEach(async function () {
        this._server = net
            .createServer((socket) => {
                this.server = new RemoteEventEmitter(socket);
            })
            .listen("test-socket");

        await once(this._server, "listening");

        this._client = net.createConnection("test-socket");
        this.client = new RemoteEventEmitter(this._client);

        // wait for connection
        const queue = [
            once(this._server, "connection"),
            once(this._client, "connect"),
        ];
        await Promise.all(queue);
    });

    afterEach(async function () {
        if (!this.client.isDead) {
            this._client.end();
        }

        this._server.close();

        await once(this._server, "close");
    });

    describe("remoteEmit()", function () {
        it("should remotely emit the event", async function () {
            const args = ["arg1", "arg2"];
            this.client.remoteEmit("hello", ...args);

            const result = await once(this.server, "hello", true);

            // verify that all arguments have been transmitted.
            assert.deepStrictEqual(result, args);
        });

        it('should ignore objects that don\'t have the type === "event"', async function () {
            this.client.send({ event: "invalid", args: [] });
            this.client.remoteEmit("valid");

            const invalid = once(this.server, "invalid").then(() => false);
            const valid = once(this.server, "valid").then(() => true);

            const result = await Promise.race([invalid, valid]);

            assert(result, "invalid event was emitted.");
        });

        it("should transfer errors without losing any information", async function () {
            const originalError = new TypeError("bad error");
            originalError.code = "BAD_ERR";

            this.client.remoteEmit("error", originalError);

            try {
                await this.server.once("error");
            } catch (error) {
                assert(
                    error instanceof TypeError,
                    "is not an instance of TypeError",
                );
                assert.strictEqual(error.message, originalError.message);
                assert.strictEqual(error.code, originalError.code);

                return;
            }

            throw new Error("Error was not thrown.");
        });

        it("should reassemble errors as a default Error if the name is unknown", async function () {
            const originalError = new TypeError("bad error");
            originalError.name = "UnknownErrorClass";

            this.client.remoteEmit("error", originalError);

            try {
                await this.server.once("error");
            } catch (error) {
                assert.strictEqual(error.message, originalError.message);
                assert.strictEqual(error.name, originalError.name);

                return;
            }

            throw new Error("Error was not thrown.");
        });

        it('should be able to transmit strings if they are emitted as "error"', async function () {
            const errorString = "bad error";

            this.client.remoteEmit("error", errorString);

            try {
                await this.server.once("error");
            } catch (string) {
                assert.strictEqual(string, errorString);
                return;
            }

            throw new Error("Error was not thrown.");
        });
    });
});
