// require("channels/wait_channel")
import Socket from "channels/wait_channel"

const AppWait = {
  socketConfig: {
    enableBeginBtn,
  }
}

function enableBeginBtn() {
  const btn = document.querySelector("#begin-game-btn")
  if (btn === null) {
    return
  }
  btn.classList.remove("disabled")
  btn.style.pointerEvents = ""
}

window.addEventListener("load", main)

function main() {
  disableBeginBtn()
  Socket.data.myId = getMyId()
  Socket.data.gameId = getGameId()
  Socket.socketSubscribe(AppWait.socketConfig)
}

function disableBeginBtn() {
  const btn = document.querySelector("#begin-game-btn")
  if (btn === null) {
    return
  }
  btn.style.pointerEvents = "none"
}

function getMyId() {
  const idHolder = document.querySelector("#hidden-id-holder");
  const participant_id = idHolder.value
  idHolder.remove()
  return parseInt(participant_id)
}

function getGameId() {
  const idHolder = document.querySelector("#hidden-game-id-holder");
  const game_id = idHolder.value
  idHolder.remove()
  return parseInt(game_id)
}
