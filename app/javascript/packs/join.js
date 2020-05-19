window.addEventListener("load", main);

function main() {
}

function addJoinBtnLink() {
  const joinBtn = document.querySelector("#join-game-btn");
  joinBtn.addEventListener("click", function() {
    const gameIdInputElm = document.querySelector("#game-id-input");
    const gameId = parseInt(gameIdInputElm.value);
    if (!gameId) {
      // TODO: display invalid game id
      return;
    }
    window.open(`/wait/${gameId}`, "_self", false);
  });
}
