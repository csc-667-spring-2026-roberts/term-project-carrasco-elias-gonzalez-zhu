"use strict";
(() => {
  // src/client/game.ts
  var selectedPassCardIds = /* @__PURE__ */ new Set();
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
  async function passCards(gameId) {
    setGameError("");
    const response = await fetch("/api/games/" + String(gameId) + "/pass-cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gameCardIds: Array.from(selectedPassCardIds)
      })
    });
    if (!response.ok) {
      setGameError(await readError(response));
      await loadState(gameId);
      return;
    }
    selectedPassCardIds.clear();
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
    if (state.game.phase !== "passing") {
      selectedPassCardIds.clear();
    }
    if (state.hand.length === 0) {
      hand.textContent = emptyHandText(state);
      return;
    }
    state.hand.forEach((card) => {
      const button = document.createElement("button");
      button.className = handCardClass(card, state);
      button.type = "button";
      button.textContent = cardText(card);
      button.title = card.label;
      button.disabled = handCardDisabled(card, state);
      button.addEventListener("click", () => {
        handleCardClick(gameId, state, card);
      });
      hand.appendChild(button);
    });
  }
  function renderPassControls(gameId, state) {
    const controls = getRequiredElement("pass-controls");
    clearElement(controls);
    if (state.game.phase !== "passing") {
      return;
    }
    const message = document.createElement("span");
    message.className = "pass-message";
    if (state.hasPassed) {
      message.textContent = "Passed. Waiting for the table.";
      controls.appendChild(message);
      return;
    }
    message.textContent = "Selected " + String(selectedPassCardIds.size) + "/" + String(state.requiredPassCount) + " to pass " + state.game.pass_direction + ".";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-small";
    button.textContent = "Pass Cards";
    button.disabled = !state.canPass || selectedPassCardIds.size !== state.requiredPassCount;
    button.addEventListener("click", () => {
      void passCards(gameId);
    });
    controls.append(message, button);
  }
  function renderPlayedCards(state) {
    const playedCards = getRequiredElement("played-cards");
    clearElement(playedCards);
    if (state.playedCards.length === 0) {
      playedCards.textContent = centerText(state);
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
        name.textContent = player ? playerLabel(player) : "Seat " + String(seat);
      }
      if (avatar) {
        avatar.textContent = player ? seatSymbols[seat] ?? "*" : ".";
      }
    }
  }
  function renderState(gameId, state) {
    getRequiredElement("game-status").textContent = state.statusText;
    getRequiredElement("game-event").textContent = state.game.last_event ?? "";
    setGameError("");
    renderPlayers(state);
    renderPlayedCards(state);
    renderHand(gameId, state);
    renderPassControls(gameId, state);
  }
  function centerText(state) {
    if (state.game.status === "waiting") {
      return "Waiting";
    }
    if (state.game.phase === "passing") {
      return "Passing";
    }
    if (state.game.phase === "finished") {
      return "Finished";
    }
    return "Trick " + String(state.game.current_trick_no);
  }
  function emptyHandText(state) {
    if (state.game.status === "waiting") {
      return "Waiting for four players...";
    }
    if (state.game.phase === "passing" && state.hasPassed) {
      return "Cards passed.";
    }
    return "No cards left.";
  }
  function handCardClass(card, state) {
    const classes = ["playing-card", "hand-card", "suit-" + card.suit];
    if (state.game.phase === "passing" && selectedPassCardIds.has(card.game_card_id)) {
      classes.push("selected-pass-card");
    }
    return classes.join(" ");
  }
  function handCardDisabled(card, state) {
    if (state.game.phase === "passing") {
      return !state.canPass && !selectedPassCardIds.has(card.game_card_id);
    }
    return !card.is_playable;
  }
  function handleCardClick(gameId, state, card) {
    if (state.game.phase === "passing") {
      togglePassSelection(gameId, state, card);
      return;
    }
    if (card.is_playable) {
      void playCard(gameId, card.game_card_id);
    }
  }
  function playerLabel(player) {
    return player.display_name + " | " + String(player.total_score) + " total, " + String(player.hand_score) + " hand";
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
  function togglePassSelection(gameId, state, card) {
    if (!state.canPass && !selectedPassCardIds.has(card.game_card_id)) {
      return;
    }
    if (selectedPassCardIds.has(card.game_card_id)) {
      selectedPassCardIds.delete(card.game_card_id);
    } else if (selectedPassCardIds.size < state.requiredPassCount) {
      selectedPassCardIds.add(card.game_card_id);
    }
    renderHand(gameId, state);
    renderPassControls(gameId, state);
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
