"use strict";
(() => {
  // src/client/lobby.ts
  function renderGames(gamesList, games) {
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
    if (!(template instanceof HTMLTemplateElement)) {
      return;
    }
    games.forEach((game) => {
      const clone = template.content.cloneNode(true);
      const title = clone.querySelector(".game-title");
      const players = clone.querySelector(".game-players");
      const btn = clone.querySelector(".join-btn");
      if (!title || !players || !btn) {
        return;
      }
      title.textContent = "Game #" + String(game.id);
      players.textContent = String(game.player_count) + " / 4 players";
      btn.addEventListener("click", () => {
        window.location.href = "/games/" + String(game.id);
      });
      gamesList.appendChild(clone);
    });
  }
  async function loadGames(gamesList) {
    try {
      const response = await fetch("/api/games");
      if (!response.ok) {
        throw new Error("Failed to load games.");
      }
      const data = await response.json();
      renderGames(gamesList, data.games);
    } catch (err) {
      console.error("Error loading games:", err);
      gamesList.textContent = "";
      const errorTemplate = document.getElementById("error-template");
      if (errorTemplate instanceof HTMLTemplateElement) {
        const clone = errorTemplate.content.cloneNode(true);
        gamesList.appendChild(clone);
      }
    }
  }
  function setupSse(gamesList) {
    const source = new EventSource("/api/sse");
    source.onopen = () => {
      console.log("SSE connected");
    };
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "games_updated" && data.games) {
          renderGames(gamesList, data.games);
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };
    source.onerror = () => {
      console.error("SSE connection error");
    };
  }
  function setupCreateGameButton(createBtn) {
    createBtn.addEventListener("click", () => {
      void (async () => {
        try {
          const response = await fetch("/api/games", { method: "POST" });
          if (!response.ok) {
            console.error("Failed to create game");
          }
        } catch (err) {
          console.error("Error creating game:", err);
        }
      })();
    });
  }
  function main() {
    console.log("Lobby client loaded");
    const gamesListElement = document.getElementById("games-list");
    const createBtnElement = document.getElementById("create-game");
    if (!(gamesListElement instanceof HTMLElement)) {
      console.error("Missing #games-list element.");
      return;
    }
    if (!(createBtnElement instanceof HTMLButtonElement)) {
      console.error("Missing #create-game element.");
      return;
    }
    const gamesList = gamesListElement;
    const createBtn = createBtnElement;
    setupSse(gamesList);
    setupCreateGameButton(createBtn);
    void loadGames(gamesList);
  }
  main();
})();
//# sourceMappingURL=lobby.js.map
