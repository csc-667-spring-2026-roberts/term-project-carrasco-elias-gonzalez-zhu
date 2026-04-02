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

function main(): void {
  console.log("Lobby client loaded");

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
}

main();
