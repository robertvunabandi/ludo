// require("channels/wait_channel")
import socketSubscribe from "channels/wait_channel"

const App = {
  game_id: null,
  participant_id: null,
};

window.addEventListener("load", main)

function main() {
  socketSubscribe()
}
