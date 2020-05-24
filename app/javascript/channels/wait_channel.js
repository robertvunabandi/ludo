import consumer from "./consumer"

const WaitEvents = {
  // This event is used to signal who the players are
  PLAYERS: "players",
}

const AppData = {
  players: null,
};

function socketSubscribe() {
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
    },

    /**
     * Called when the subscription has been terminated by the server
     */
    disconnected() {
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
        case WaitEvents.PLAYERS:
          AppData.players = data.players
          this._displayPlayers(AppData.players)
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

        // TODO: Allow them to set their usernames here
        const playerUsername = document.createElement("span")
        playerUsername.setAttribute("class", "player-username")
        playerUsername.innerText = player.username
        playerBox.appendChild(playerUsername)

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


export default socketSubscribe;
