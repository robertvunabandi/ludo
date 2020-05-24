import consumer from "./consumer"

const Socket = {};

/// Events that we are hearing and respond to from the server
Socket.Respond = {
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
}
/// Where we store data relevant to the socket
Socket.data = {
  // This id is set in javascript/pack/wait.js, it's pretty hacky
  // but I can't find another way to send this value over
  myId: null,
  players: null,
};
/// Other functionalities are declared inside the `connected` functions
Socket.funcs = {}

Socket.socketSubscribe = function socketSubscribe() {
  const subscription_data = {
    channel: "WaitChannel",
    game_id: getGameIdFromUrl(),
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
      console.log("Connected to Wait WaitChannel")

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
      console.log("Received data, see below")
      console.log(data)
      switch (data.event) {
        case Socket.Respond.PLAYERS:
          Socket.data.players = data.players
          this._displayPlayers(Socket.data.players)
          break
        default:
          console.log(`Unhandled event (${data.event}) received`)
          break
      }
    },

    //
    // APP FUNCTIONALITIES
    // Things that will allow our app to work
    //

    // TODO: this is not perfect because the update of others interrupt
    // the updates of some users. so, we should fix that bug by updating
    // only what changed instead of re-rendering everything from scratch
    _displayPlayers(players) {
      const playersBox = document.querySelector("#active-players")
      clearElement(playersBox)

      const innerPlayersBox = document.createElement("span")
      innerPlayersBox.setAttribute("id", "inner-active-players")

      players.forEach((player, index) => {
        const playerBox = document.createElement("span")
        playerBox.setAttribute("class", "player")

        const indexBox = document.createElement("span")
        indexBox.setAttribute("class", "player-index")
        indexBox.innerText = (index + 1)
        playerBox.appendChild(indexBox)

        const playerId = document.createElement("span")
        playerId.setAttribute("class", "player-id")
        playerId.innerText = "ID:" + player.participant_id
        playerBox.appendChild(playerId)

        // Allow them to set their usernames here
        if (player.participant_id === Socket.data.myId) {
          const playerUsernameInput = document.createElement("input")
          playerUsernameInput.setAttribute("type", "text")
          playerUsernameInput.setAttribute("class", "player-username-input")
          playerUsernameInput.setAttribute(
            "minlength", Socket.const.MIN_USERNAME_LENGTH
          )
          playerUsernameInput.setAttribute(
            "maxlength", Socket.const.MAX_USERNAME_LENGTH
          )
          playerUsernameInput.value = player.username
          playerBox.appendChild(playerUsernameInput)

          let previousValue = playerUsernameInput.value;
          const updateUsername = function() {
            // change only when the name actually changes
            if (playerUsernameInput.value !== previousValue) {
              Socket.funcs.changeUsername(playerUsernameInput.value)
              previousValue = playerUsernameInput.value;
            }
          }
          playerUsernameInput.onchange = updateUsername
          playerUsernameInput.onkeypress = function(e) {
            const code = (e.keyCode ? e.keyCode : e.which)
            if (code === Socket.const.ENTER_KEY_CODE) {
              updateUsername()
            }
          }
        } else {
          const playerUsername = document.createElement("span")
          playerUsername.setAttribute("class", "player-username")
          playerUsername.innerText = player.username
          playerBox.appendChild(playerUsername)
        }

        if (player.is_host) {
          const playerHostIndicator = document.createElement("span")
          playerHostIndicator.setAttribute("class", "player-host-indicator")
          playerHostIndicator.innerText = "host"
          playerBox.appendChild(playerHostIndicator)
        }

        innerPlayersBox.appendChild(playerBox)
      })

      playersBox.appendChild(innerPlayersBox)
    },
  });
}

function getGameIdFromUrl() {
  // remove anything that comes after the "?" in the URL if any
  const url = window.location.href.replace(/\?.*$/, "")
  const tokens = url.split("/")
  return parseInt(tokens[tokens.length - 1])
}

function clearElement(elm) {
  while (elm.firstChild) {
    elm.removeChild(elm.firstChild)
  }
}


export default Socket;
