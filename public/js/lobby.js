"use strict";
(() => {
  // src/client/lobby.ts
  function main() {
    console.log("Lobby client loaded");
    const gamesList = document.getElementById("games-list");
    const createBtn = document.getElementById("create-game");
    async function loadGames() {
      try {
        const res = await fetch("/api/games");
        const data = await res.json();
        const games = data.games;
        gamesList.textContent = "";
        if (games.length === 0) {
          const emptyTemplate = document.getElementById("empty-template");
          if (emptyTemplate instanceof HTMLTemplateElement) {
            const clone = emptyTemplate.content.cloneNode(true);
            gamesList.appendChild(clone);
          }
          return;
        }
        const template = document.getElementById("game-template");
        if (!(template instanceof HTMLTemplateElement)) return;
        games.forEach((game) => {
          const clone = template.content.cloneNode(true);
          const title = clone.querySelector(".game-title");
          const players = clone.querySelector(".game-players");
          const btn = clone.querySelector(".join-btn");
          if (!title || !players || !btn) return;
          title.textContent = "Game #" + String(game.id);
          const count = game.player_count;
          players.textContent = String(count) + " / 4 players";
          btn.addEventListener("click", () => {
            window.location.href = "/games/" + String(game.id);
          });
          gamesList.appendChild(clone);
        });
      } catch (err) {
        console.error("Error loading games:", err);
        const errorTemplate = document.getElementById("error-template");
        if (errorTemplate instanceof HTMLTemplateElement) {
          const clone = errorTemplate.content.cloneNode(true);
          gamesList.appendChild(clone);
        }
      }
    }
    createBtn.addEventListener("click", () => {
      void (async () => {
        try {
          const res = await fetch("/api/games", { method: "POST" });
          if (!res.ok) {
            console.error("Failed to create game");
            return;
          }
          await loadGames();
        } catch (err) {
          console.error("Error creating game:", err);
        }
      })();
    });
    void loadGames();
  }
  main();
})();
