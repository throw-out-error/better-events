# Better Events

Better event emitters.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
# pnpm
pnpm i @throw-out-error/better-events

# npm
npm i @throw-out-error/better-events

# Yarn
yarn add @throw-out-error/better-events
```

## Example

In the `server.js` file:

```javascript
const { RemoteEventEmitter } = require("@throw-out-error/better-events");
const net = require("net");

const server = net.createServer((socket) => {
    const connection = new RemoteEventEmitter(socket);

    connection.remoteEmit("ping");

    connection.on("pong", () => {
        console.log("pong");
    });
});

server.listen(8080);
```

In the `client.js` file:

```javascript
const { RemoteEventEmitter } = require('@throw-out-error/better-events')
const net = require('net')

const socket = net.connect(8080)
const connection = new RemoteEventEmitter(socket)

connection.remoteEmit('pong')

connection.on('ping', () => {
    console.log('ping')
}
```

## API

The `RemoteEventEmitter` extends the `Connection` class. This means that you can use
the [send method](https://www.npmjs.com/package/socket-json-wrapper#connectionsenddata) and the `"message"` event.

### emitter.remoteEmit(event, ...args)

- event `<string>` - The name of the event.
- ...args `<any>` - Arguments for the event.

Emit an event on the EventEmitter on the other side of the socket connection. It **returns** a `<boolean>` that
is `true` if the event was written to the socket.
