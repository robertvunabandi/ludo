// require("channels/wait_channel")
import Socket from "channels/wait_channel"

const AppWait = {}

window.addEventListener("load", main)

function main() {
  Socket.data.myId = getMyId()
  Socket.socketSubscribe()
}

function getMyId() {
  const idHolder = document.querySelector("#hidden-id-holder");
  const participant_id = idHolder.value
  idHolder.remove()
  return parseInt(participant_id)
}
