# revents

Connect two EventEmitters via a socket.

[![Build Status](https://circleci.com/gh/robojones/revents.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/robojones/revents/tree/master)
[![Test Coverage](https://codeclimate.com/github/robojones/revents/badges/coverage.svg)](https://codeclimate.com/github/robojones/revents/coverage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![bitHound Code](https://www.bithound.io/github/robojones/revents/badges/code.svg)](https://www.bithound.io/github/robojones/revents)
[![bitHound Overall Score](https://www.bithound.io/github/robojones/revents/badges/score.svg)](https://www.bithound.io/github/robojones/revents)
[![bitHound Dependencies](https://www.bithound.io/github/robojones/revents/badges/dependencies.svg)](https://www.bithound.io/github/robojones/revents/master/dependencies/npm)

## Installation

```
npm i revents
```

## Example

In the `server.js` file:

```javascript
const { RemoteEventEmitter: Connection } = require('revents')
const net = require('net')

const server = net.createServer(socket => {
  const connection = new Connection(socket)

  connection.remoteEmit('ping')

  connection.on('pong', () => {
    console.log('pong')
  })
})

server.listen(8080)
```

In the `client.js` file:

```javascript
const { RemoteEventEmitter } = require('revents')
const net = require('net')

const socket = net.connect(8080)
const connection = new Connection(socket)

connection.remoteEmit('pong')

connection.on('ping', () => {
  console.log('ping')
}
```

## API

The `RemoteEventEmitter` extends the `Connection` class from the [socket-json-wrapper package](https://www.npmjs.com/package/socket-json-wrapper).
This means that you can use the [send method](https://www.npmjs.com/package/socket-json-wrapper#connectionsenddata) and the `"message"` event.

### emitter.remoteEmit(event, ...args)

- event `<string>` - The name of the event.
- ...args `<any>` - Arguments for the event.

Emit an event on the EventEmitter on the other side of the socket connection.
It __returns__ a `<boolean>` that is `true` if the event was written to the socket.
