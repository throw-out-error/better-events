import net from "net";
import { RemoteEventEmitter, toRx } from ".";

async function main() {
    const _server = net
        .createServer(async (socket) => {
            const server = new RemoteEventEmitter(socket);
            server.emit("listening");

            _server.close();
        })
        .listen(3030);

    const _client = net.createConnection(3030);
    const client = new RemoteEventEmitter(_client);
    // const rxClient = toRx(_client);

    // wait for connection
    await Promise.all([
        _server.once("connection", () => null),
        _client.once("connect", () => null),
    ]);

    if (!client.isDead) {
        _client.end();
        console.log("Finished testing.");
    }
}

main();
