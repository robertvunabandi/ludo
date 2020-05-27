import consumer from "./consumer"

import React from "react"
import ReactDOM from "react-dom"

import Game from "components/Game"

// The structure is similar to channel/wait_channel.jsx, so see
// there for more context
const Socket = {}
Socket.Respond = {
  APPEAR: "appear",
  DISAPPEAR: "disappear",
  START: "start",
  HISTORY: "history",
}
Socket.Perform = {
  APPEAR: "appear",
  DISAPPEAR: "disappear",
  ACTION: "action",
  ROLL: "roll",
  HISTORY_REQUEST: "history_request",
}
Socket.const = {}
Socket.data = {
  myId: null,
  gameId: null,
  players: null,
  firstDisplayHappened: false,
}
Socket.funcs = {
  setHistoryFunction(handleReceiveHistory) {
    Socket.funcs.handleReceiveHistory = handleReceiveHistory
  },
  handleReceiveHistory: () => null,
}

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
      self.perform(
        Socket.Perform.ROLL, {participant_id: Socket.data.myId, rolls}
      )
    }
    Socket.funcs.sendAction = function sendAction(action) {
      self.perform(
        Socket.Perform.ACTION, {participant_id: Socket.data.myId, action}
      )
    }
    Socket.funcs.requestHistory = function requestHistory(index) {
      self.perform(Socket.Perform.HISTORY_REQUEST, {index})
    }
    Socket.funcs.requestMaxHistory = function requestMaxHistory() {
      self.perform(Socket.Perform.HISTORY_REQUEST, {index: -1})
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
      case Socket.Respond.APPEAR:
        // TODO: handle appear if needed
        break
      case Socket.Respond.DISAPPEAR:
        // TODO: handle disappear if needed
        break
      case Socket.Respond.START:
        if (!Socket.data.firstDisplayHappened) {
          Socket.data.firstDisplayHappened = true
          this._displayGame(data)
          return
        }
        break
      case Socket.Respond.HISTORY:
        Socket.funcs.handleReceiveHistory(data.history)
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
    // TODO: we haven't handled turn_info (also remove this log)
    console.log(displayData)

    displayData.rules = this._fixRuleTypes(displayData.rules)
    ReactDOM.render(
      <Game
        rules={displayData.rules}
        my_id={Socket.data.myId}
        players={Socket.data.players}
        is_turn_order_determination={displayData.is_turn_order_determination}
        turn_info={displayData.turn_info}
        getSideLength={this._getSideLength}
        sendRolls={Socket.funcs.sendRolls}
        sendAction={Socket.funcs.sendAction}
        setHistoryFunction={Socket.funcs.setHistoryFunction}
        requestHistory={Socket.funcs.requestHistory}
        requestMaxHistory={Socket.funcs.requestMaxHistory}
      />,
      document.querySelector("#game-box"),
    )
  }

  options._fixRuleTypes = function _fixRuleTypes(rules) {
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

  options._getSideLength = function _getSideLength() {
    const titleHeight = document.querySelector(".title").clientHeight
    const smallest_length = Math.min(window.innerHeight, window.innerWidth)
    return smallest_length - titleHeight - 50
  }

  //
  // FINALLY, subscribe to the channel
  //
  consumer.subscriptions.create(subscription_data, options)
}

export default Socket
