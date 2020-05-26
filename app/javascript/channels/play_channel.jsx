import consumer from "./consumer"

import React from "react"
import ReactDOM from "react-dom"

import Game from "components/Game"

// The structure is similar to channel/wait_channel.jsx, so see
// there for more context
const Socket = {}
Socket.Respond = {
  START: "start",
  // TODO: we changed move with action and roll I believe
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
  firstDisplayHappened: false,
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
      case Socket.Respond.START:
        if (!Socket.data.firstDisplayHappened) {
          Socket.data.firstDisplayHappened = true
          this._displayGame(data)
          return
        }
        console.log("Already displayed!")
        break
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

  options._displayGame = function _displayGame(displayData) {
    // doing this temporarily
    console.log(displayData)
    displayData.rules = this._fixRuleTypes(displayData.rules)
    const titleHeight = document.querySelector(".title").clientHeight
    const smallest_length = Math.min(window.innerHeight, window.innerWidth)
    const side_length = smallest_length - titleHeight - 50
    ReactDOM.render(
      <Game
        side_length={side_length}
        rules={displayData.rules}
        mappings={{red: 100, green: 200, yellow: 300, blue: 400}}
        is_turn_order_determination={displayData.is_turn_order_determination}
        turn_info={displayData.turn_info}
        sendRolls={Socket.funcs.sendRolls}
        sendAction={Socket.funcs.sendAction}
      />,
      document.querySelector("#game-box"),
    )
  }

  options._fixRuleTypes = function(rules) {
    rules.dice_count = parseInt(rules.dice_count)
    const boolean_keys = [
      "roll_after_six",
      "allow_square_doubling",
      "capture_into_prison",
      "roll_six_to_graduate"
    ]
    boolean_keys.forEach((r) => {
      rules[r] = rules[r] === "yes"
    })
    return rules
  }

  //
  // FINALLY, subscribe to the channel
  //
  consumer.subscriptions.create(subscription_data, options)
}

export default Socket
