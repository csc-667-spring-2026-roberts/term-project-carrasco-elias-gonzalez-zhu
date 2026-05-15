"use strict";
(() => {
  // src/client/game.ts
  var suitSymbols = {
    clubs: "\u2663",
    diamonds: "\u2666",
    hearts: "\u2665",
    spades: "\u2660"
  };
  var seatSymbols = {
    1: "\u2665",
    2: "\u2666",
    3: "\u2663",
    4: "\u2660"
  };
  function cardText(card) {
    return card.rank + suitSymbols[card.suit];
  }
  function clearElement(element) {
    element.textContent = "";
  }
  function getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLElement)) {
      throw new Error("Missing #" + id + " element.");
    }
    return element;
  }
  async function loadState(gameId) {
    const response = await fetch("/api/games/" + String(gameId) + "/state");
    if (!response.ok) {
      setGameError(await readError(response));
      return;
    }
    const data = await response.json();
    renderState(gameId, data.state);
  }
  async function playCard(gameId, gameCardId) {
    setGameError("");
    const response = await fetch("/api/games/" + String(gameId) + "/play-card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gameCardId
      })
    });
    if (!response.ok) {
      setGameError(await readError(response));
      await loadState(gameId);
      return;
    }
    const data = await response.json();
    renderState(gameId, data.state);
  }
  async function readError(response) {
    try {
      const data = await response.json();
      return data.error ?? "Request failed.";
    } catch {
      return "Request failed.";
    }
  }
  function renderCard(card) {
    const cardElement = document.createElement("div");
    cardElement.className = "playing-card suit-" + card.suit;
    cardElement.textContent = cardText(card);
    cardElement.title = card.label;
    return cardElement;
  }
  function renderHand(gameId, state) {
    const hand = getRequiredElement("player-hand");
    clearElement(hand);
    if (state.hand.length === 0) {
      hand.textContent = state.game.status === "waiting" ? "Waiting for cards..." : "No cards left.";
      return;
    }
    state.hand.forEach((card) => {
      const button = document.createElement("button");
      button.className = "playing-card hand-card suit-" + card.suit;
      button.type = "button";
      button.textContent = cardText(card);
      button.title = card.label;
      button.disabled = !state.canPlay;
      button.addEventListener("click", () => {
        void playCard(gameId, card.game_card_id);
      });
      hand.appendChild(button);
    });
  }
  function renderPlayedCards(state) {
    const playedCards = getRequiredElement("played-cards");
    clearElement(playedCards);
    if (state.playedCards.length === 0) {
      playedCards.textContent = "Center";
      return;
    }
    state.playedCards.forEach((card) => {
      playedCards.appendChild(renderCard(card));
    });
  }
  function renderPlayers(state) {
    for (let seat = 1; seat <= 4; seat += 1) {
      const seatElement = document.querySelector(
        '.table-seat[data-seat="' + String(seat) + '"]'
      );
      if (!seatElement) {
        continue;
      }
      const player = state.players.find((candidate) => candidate.seat === seat);
      const name = seatElement.querySelector(".seat-name");
      const avatar = seatElement.querySelector(".seat-avatar");
      const isCurrentTurn = state.game.current_turn_seat === seat;
      seatElement.classList.toggle("active-turn", isCurrentTurn);
      seatElement.classList.toggle("you", player?.user_id === state.currentUserId);
      if (name) {
        name.textContent = player ? player.display_name : "Seat " + String(seat);
      }
      if (avatar) {
        avatar.textContent = player ? seatSymbols[seat] ?? "\u2022" : "\xB7";
      }
    }
  }
  function renderState(gameId, state) {
    getRequiredElement("game-status").textContent = state.statusText;
    setGameError("");
    renderPlayers(state);
    renderPlayedCards(state);
    renderHand(gameId, state);
  }
  function setGameError(message) {
    getRequiredElement("game-error").textContent = message;
  }
  function setupSse(gameId) {
    const source = new EventSource("/api/sse");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "game_updated" && data.gameId === gameId) {
          void loadState(gameId);
        }
      } catch (err) {
        console.error("Error parsing game SSE message:", err);
      }
    };
    source.onerror = () => {
      console.error("Game SSE connection error");
    };
  }
  function main() {
    const root = getRequiredElement("game-root");
    const gameId = Number(root.dataset.gameId);
    if (!Number.isInteger(gameId)) {
      setGameError("Invalid game id.");
      return;
    }
    setupSse(gameId);
    void loadState(gameId);
  }
  main();
})();
