/**
 * Client Layer: Lobby
 *
 * TODO Breanna:
 * Implement the frontend logic for the lobby page.
 *
 * Responsibilities:
 * - Fetch games from the API (/api/games)
 * - Render the list of games in #games-list
 * - Handle "Create Game" button click
 * - Reload the list after creating a game
 *
 * Guidelines:
 * - Use fetch for API calls
 * - Use the DOM elements already defined in lobby.ejs:
 *   - #games-list
 *   - #create-game
 * - Do NOT modify server routes or DB logic here
 *
 * Notes:
 * - This is temporary for M8 (API-based updates)
 * - Later milestones will replace this with real-time updates
 */

// TODO Breanna:
// 1. Get references to DOM elements:
//    - #games-list
//    - #create-game
//
// 2. Fetch games from /api/games
//
// 3. Render games into #games-list
//
// 4. Add click handler to #create-game button
//    - Call POST /api/games
//    - Reload the game list

type Game = {
  id: number;
  player_count: number;
};

type GamesResponse = {
  games: Game[];
};

function main(): void {
  console.log("Lobby client loaded");

  const gamesList = document.getElementById("games-list") as HTMLElement;
  const createBtn = document.getElementById("create-game") as HTMLButtonElement;

  async function loadGames(): Promise<void> {
    try {
      const res = await fetch("/api/games");

      const data = (await res.json()) as GamesResponse;

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

      games.forEach((game: Game) => {
        const clone = template.content.cloneNode(true) as DocumentFragment;

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

  createBtn.addEventListener("click", (): void => {
    void (async (): Promise<void> => {
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
