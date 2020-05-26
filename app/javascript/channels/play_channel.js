import consumer from "./consumer"

// The structure is similar to channel/wait_channel.jsx, so see
// there for more context
const Socket = {}
Socket.Respond = {
  MOVE: "move",
}
Socket.Perform = {
  APPEAR: "appear",        // TODO: handle this one
  DISAPPEAR: "disappear",  // TODO: handle this one
  MOVE: "move",
}
Socket.const = {}
Socket.data = {
  myId: null,
  gameId: null,
  players: null,
}
Socket.funcs = {}

Socket.socketSubscribe = function socketSubscribe() {
  const subscription_data = {
    channel: "PlayChannel", game_id: Socket.data.gameId
  }
  const options = {}

  //
  // CONNECTION FUNCTIONALITIES
  // First we're defining the four main methods called
  // whenever connection-related things happen with connection
  //

  // Called when the subscription is ready for use on the server
  options.connected = function connected() {
    this.perform(Socket.Perform.APPEAR)

    const self = this
    Socket.funcs.sendRolls = function sendRolls(rolls) {
      self.perform("roll", {participant_id: Socket.data.myId, rolls})
    }
    Socket.funcs.sendAction = function sendAction(action) {
      self.perform("action", {participant_id: Socket.data.myId, action})
    }
  }

  // Called when the subscription has been terminated by the server
  options.disconnected = function disconnected() {
    this.perform(Socket.Perform.DISAPPEAR)
  }

  // Called when the subscription is rejected by the server
  // TODO: not sure when this is called
  options.rejected = function rejected(data) {}

  // Called when there's incoming data on the websocket for this channel
  options.received = function received(data) {
    switch (data.event) {
      case Socket.Respond.MOVE:
        console.log(`(not-implemented) [${data.event}] event received`, data)
        break
      default:
        console.log(`Unhandled socket event (${data.event}) received`, data)
        break
    }
  }

  //
  // APP FUNCTIONALITIES
  // Things that will allow our app to work
  //

  //
  // FINALLY, subscribe to the channel
  //
  consumer.subscriptions.create(subscription_data, options)
}

export default Socket
