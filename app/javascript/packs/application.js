// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

require("@rails/ujs").start()
require("turbolinks").start()
require("@rails/activestorage").start()


// Uncomment to copy all static images under ../images to the output folder and reference
// them with the image_pack_tag helper in views (e.g <%= image_pack_tag 'rails.png' %>)
// or the `imagePath` JavaScript helper below.
//
// const images = require.context('../images', true)
// const imagePath = (name) => images(name, true)

const App = {
  helpers: {},
}

App.main = function main() {
  // Make all copyable links actually copy things
  const linkBlocks = document.querySelectorAll(".copyable-link")
  for (let i = 0; i < linkBlocks.length; i++) {
    const link = linkBlocks[i].children[0]
    const copy = linkBlocks[i].children[1]
    copy.addEventListener(
      "click",
      () => App.helpers.copyToClipboard(link.innerText),
    );
  }
}

App.helpers.copyToClipboard = function copyToClipboard(text) {
  const dummy = document.createElement("textarea")
  dummy.style.opacity = 0
  document.body.appendChild(dummy)
  dummy.value = text
  dummy.select()
  document.execCommand("copy")
  document.body.removeChild(dummy)
}

window.addEventListener("load", App.main)
