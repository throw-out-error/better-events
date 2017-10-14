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

    this.on('message', msg => {
      const { type } = msg

      if (type !== 'event') {
        return
      }

      const { event } = msg

      if (event === 'error') {
        const { name, message, stack, custom } = msg

        const Constructor = global[name] || Error

        // reassemble error
        const error = new Constructor(message)
        error.stack = stack
        Object.assign(error, custom)

        return this.emit(event, error)
      }

      const { args } = msg

      this.emit(event, ...args)
    })
  }

  /**
   * Emit an event on the EventEmitter on the other side of the socket connection. Returns true if the event was written to the socket.
   * @param {string} event - The name of the event.
   * @param {*} args - Arguments for the event.
   * @returns {boolean}
   */
  remoteEmit(event, ...args) {
    if (event === 'error' && args[0] instanceof Error) {
      const error = args[0]

      // disassemble error
      const { name, message, stack } = error
      const custom = Object.assign({}, error)

      return this.send({
        type: 'event',
        event,
        name,
        message,
        stack,
        custom
      })
    }

    return this.send({
      type: 'event',
      event,
      args
    })
  }
}

RemoteEventEmitter.RemoteEventEmitter = RemoteEventEmitter

module.exports = RemoteEventEmitter
