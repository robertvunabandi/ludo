// require("channels/wait_channel")
import socketSubscribe from "channels/wait_channel"

const AppWait = {}

window.addEventListener("load", main)

function main() {
  socketSubscribe()
}
