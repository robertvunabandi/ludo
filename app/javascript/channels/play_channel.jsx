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
  TURN_INFO: "turn_info",
}
Socket.Perform = {
  START: "start",
  APPEAR: "appear",
  ACTION: "action",
  ROLL: "roll",
  FINISH_TURN: "finish_turn",
  HISTORY_REQUEST: "history_request",
  TURN_INFO_REQUEST: "turn_info_request",
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
  setTurnInfoFunction(handleReceiveTurnInfo) {
    Socket.funcs.handleReceiveTurnInfo = handleReceiveTurnInfo
  },
  handleReceiveTurnInfo: () => null,
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
    const self = this
    const data_pid = {participant_id: Socket.data.myId}
    Socket.funcs.sendRolls = function sendRolls() {
      // roll will be performed in the server
      self.perform(Socket.Perform.ROLL, data_pid)
    }
    Socket.funcs.sendAction = function sendAction(action) {
      // action gets mapped to "action" in the server, and I'm thinking
      // this might be because the action we're performing in the server
      // is called "action" and so this things automatically maps the
      // action name to "action" instead of whatever is provided in our
      // action variable. So, I renamed it to 'action_name'
      const data = {...data_pid, ...action, action_name: action.action}
      self.perform(Socket.Perform.ACTION, data)
    }
    Socket.funcs.finishTurn = function finishTurn() {
      self.perform(Socket.Perform.FINISH_TURN, data_pid)
    }
    Socket.funcs.requestHistory = function requestHistory(turn) {
      self.perform(Socket.Perform.HISTORY_REQUEST, {turn, ...data_pid})
    }
    Socket.funcs.requestMaxHistory = function requestMaxHistory() {
      self.perform(Socket.Perform.HISTORY_REQUEST, {turn: -1, ...data_pid})
    }
    Socket.funcs.requestTurnInfo = function requestTurnInfo() {
      self.perform(Socket.Perform.TURN_INFO_REQUEST)
    }

    this.perform(Socket.Perform.START)
    this.perform(Socket.Perform.APPEAR)
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
        }
        break
      case Socket.Respond.HISTORY:
        Socket.funcs.handleReceiveHistory(data)
        break
      case Socket.Respond.TURN_INFO:
        Socket.funcs.handleReceiveTurnInfo(data)
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
    ReactDOM.render(
      <Game
        rules={this._fixRuleTypes(displayData.rules)}
        my_id={Socket.data.myId}
        players={Socket.data.players}
        getSideLength={this._getSideLength}
        sendRolls={Socket.funcs.sendRolls}
        sendAction={Socket.funcs.sendAction}
        finishTurn={Socket.funcs.finishTurn}
        setHistoryFunction={Socket.funcs.setHistoryFunction}
        setTurnInfoFunction={Socket.funcs.setTurnInfoFunction}
        requestHistory={Socket.funcs.requestHistory}
        requestMaxHistory={Socket.funcs.requestMaxHistory}
        requestTurnInfo={Socket.funcs.requestTurnInfo}
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
      "roll_six_to_graduate",
    ]
    boolean_keys.forEach((r) => {
      rules[r] = rules[r] === "yes"
    })
    return rules
  }

  options._getSideLength = function _getSideLength() {
    const titleHeight = document.querySelector(".title").clientHeight
    const smallest_length = Math.min(window.innerHeight, window.innerWidth)
    return smallest_length - titleHeight - 25
  }

  //
  // FINALLY, subscribe to the channel
  //
  consumer.subscriptions.create(subscription_data, options)
}

export default Socket
