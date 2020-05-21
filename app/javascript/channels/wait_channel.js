import consumer from "./consumer"


consumer.subscriptions.create("WaitChannel", {
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
    console.log("Disconnected from WaitChannel")
  },

  /**
   * Called when the subscription is rejected by the server? Not sure
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
  }

  //
  // APP FUNCTIONALITIES
  // Things that will allow our app to work
  //
});
