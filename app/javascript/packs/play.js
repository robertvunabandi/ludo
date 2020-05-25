import Socket from "channels/play_channel"

const AppPlay = {}

window.addEventListener("load", main)

function main() {
  Socket.data.myId = getMyId()
  Socket.data.gameId = getGameId()
  Socket.data.players = getPlayers()
  Socket.socketSubscribe()
}

function getMyId() {
  const idHolder = document.querySelector("#hidden-id-holder")
  const participant_id = idHolder.value
  idHolder.remove()
  return parseInt(participant_id)
}

function getGameId() {
  const idHolder = document.querySelector("#hidden-game-id-holder")
  const game_id = idHolder.value
  idHolder.remove()
  return parseInt(game_id)
}

function getPlayers() {
  const playersHolder = document.querySelector("#hidden-game-players-holder")
  const players = []
  for (let i = 0; i < playersHolder.children.length; i++) {
    const playerHolder = playersHolder.children[i]
    players.push({
      participant_id: parseInt(playerHolder.children[0].value),
      username: playerHolder.children[1].value,
      is_host: playerHolder.children[2].value.toLowerCase() === "true",
    })
  }
  playersHolder.remove()
  return players
}
