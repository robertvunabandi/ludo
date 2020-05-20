import consumer from "./consumer"

consumer.subscriptions.create("WaitChannel", {
  connected() {
    // Called when the subscription is ready for use on the server
    console.log("Connected to Wait WaitChannel--")
  },

  disconnected() {
    // Called when the subscription has been terminated by the server
    console.log("--Disconnected from WaitChannel")
  },

  received(data) {
    // Called when there's incoming data on the websocket for this channel
    console.log("Received data, see below")
    console.log("---------")
    console.log(data)
    console.log("---------")
  }
});
