import consumer from "./consumer"

import React from "react"
import ReactDOM from "react-dom"

import ActivePlayers from "components/ActivePlayers"

const Socket = {}

/// Events that we are hearing and respond to from the server
Socket.Respond = {
  APPEAR: "appear",        // TODO: handle this one
  DISAPPEAR: "disappear",  // TODO: handle this one
  PLAY: "play",
  PLAYERS: "players",
}
/// Events that we perform
Socket.Perform = {
  CHANGE_USERNAME: "change_username",
}
/// constants
Socket.const = {
  ENTER_KEY_CODE: 13,
  // TODO: This min and max are duplicate from server. we should
  // find a way to get that value directly from the server
  MIN_USERNAME_LENGTH: 4,
  MAX_USERNAME_LENGTH: 25,
  MIN_PLAYERS_TO_PLAY: 2,
}
/// Where we store data relevant to the socket
Socket.data = {
  // This id is set in javascript/pack/wait.js, it's pretty hacky
  // but I can't find another way to send this value over
  myId: null,
  // This id is also set in javascript/pack/wait.js, also hacky
  gameId: null,
  players: null,
};
/// Other functionalities are declared inside the `connected` functions
Socket.funcs = {}

Socket.socketSubscribe = function socketSubscribe(socketConfig) {
  const subscription_data = {
    channel: "WaitChannel",
    game_id: Socket.data.gameId,
  }
  consumer.subscriptions.create(subscription_data, {
    //
    // CONNECTION FUNCTIONALITIES
    // First we're defining the four main methods called
    // whenever connection-related things happen with connection
    //

    /**
     * Called when the subscription is ready for use on the server
     */
    connected() {
      console.log("Connected to WaitChannel")

      const self = this
      Socket.funcs.changeUsername = function changeUsername(username) {
        self.perform(Socket.Perform.CHANGE_USERNAME, {username})
      }
    },

    /**
     * Called when the subscription has been terminated by the server
     */
    disconnected() {
      // TODO: isn't 'leave' the same as 'unsubscribed' in the server?
      this.perform("leave")
      console.log("Disconnected from WaitChannel")
    },

    /**
     * Called when the subscription is rejected by the server
     * TODO: Not sure when this is called
     */
    rejected() {
      console.log("rejected!")
    },

    /**
     * Called when there's incoming data on the websocket for this channel
     */
    received(data) {
      switch (data.event) {
        case Socket.Respond.PLAY:
          // reload the page, then in the controller's wait handler,
          // it will redirect to the play. This helps prevent the
          // bad authenticity token error.
          window.location.reload()
          break
        case Socket.Respond.PLAYERS:
          Socket.data.players = data.players
          this._displayPlayers(Socket.data.players)
          this._enableBeginBtn(Socket.data.players.length)
          break
        default:
          console.log(`Unhandled event (${data.event}) received`, data)
          break
      }
    },

    //
    // APP FUNCTIONALITIES
    // Things that will allow our app to work
    //

    _displayPlayers(players) {
      ReactDOM.render(
        <ActivePlayers players={players} Socket={Socket} />,
        document.querySelector("#active-players"),
      )
    },

    _enableBeginBtn(numPlayers) {
      if (numPlayers >= Socket.const.MIN_PLAYERS_TO_PLAY) {
        socketConfig.enableBeginBtn()
      }
    },
  });
}

export default Socket;
