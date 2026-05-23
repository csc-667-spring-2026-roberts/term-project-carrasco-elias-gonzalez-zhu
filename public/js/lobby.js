"use strict";
(() => {
  // src/client/lobby.ts
  async function enterGame() {
    try {
      const response = await fetch("/api/games", {
        method: "POST"
      });
      if (!response.ok) {
        console.error("Failed to enter game");
        return;
      }
      const data = await response.json();
      window.location.href = "/games/" + String(data.game.id);
    } catch (err) {
      console.error("Error entering game:", err);
    }
  }
  function setupCreateGameButton(createBtn) {
    createBtn.addEventListener("click", () => {
      void enterGame();
    });
  }
  function main() {
    const createBtnElement = document.getElementById("create-game");
    if (!(createBtnElement instanceof HTMLButtonElement)) {
      console.error("Missing #create-game element.");
      return;
    }
    setupCreateGameButton(createBtnElement);
  }
  main();
})();
//# sourceMappingURL=lobby.js.map
