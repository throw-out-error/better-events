const { Connection } = require('socket-json-wrapper')

/**
 * Class representing a RemoteEventEmitter.
 */
class RemoteEventEmitter extends Connection {
  /**
   * Create a new RemoteEventEmitter.
   * @param {*} socket - The socket to write the events to.
   */
  constructor(socket) {
    super(socket)

    this.on('message', ({ type, event, args }) => {
      if (type === 'event') {
        super.emit(event, ...args)
      }
    })
  }

  /**
   * Emit an event on the EventEmitter on the other side of the socket connection. Returns true if the event was written to the socket.
   * @param {string} event - The name of the event.
   * @param {*} args - Arguments for the event.
   * @returns {boolean}
   */
  remoteEmit(event, ...args) {
    return this.send({
      type: 'event',
      event,
      args
    })
  }
}

RemoteEventEmitter.RemoteEventEmitter = RemoteEventEmitter

module.exports = RemoteEventEmitter
