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
  async function loadChatMessages(gameId) {
    const response = await fetch("/api/games/" + String(gameId) + "/chat");
    if (!response.ok) {
      setChatStatus(await readError(response));
      return;
    }
    const data = await response.json();
    renderChatMessages(data.messages);
    setChatStatus("");
  }
  async function leaveGame(gameId) {
    setGameError("");
    const response = await fetch("/api/games/" + String(gameId) + "/leave", {
      method: "POST"
    });
    if (!response.ok) {
      setGameError(await readError(response));
      await loadState(gameId);
      return;
    }
    window.location.href = "/lobby";
  }
  async function playAgain() {
    setGameError("");
    const response = await fetch("/api/games", {
      method: "POST"
    });
    if (!response.ok) {
      setGameError(await readError(response));
      return;
    }
    const data = await response.json();
    window.location.href = "/games/" + String(data.game.id);
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
  async function sendChatMessage(gameId) {
    const input = getRequiredElement("chat-input");
    const button = getRequiredElement("chat-send");
    if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement)) {
      throw new Error("Missing chat form controls.");
    }
    const message = input.value.trim();
    if (message.length === 0) {
      setChatStatus("Type a message first.");
      return;
    }
    button.disabled = true;
    setChatStatus("");
    try {
      const response = await fetch("/api/games/" + String(gameId) + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message
        })
      });
      if (!response.ok) {
        setChatStatus(await readError(response));
        return;
      }
      input.value = "";
      await loadChatMessages(gameId);
    } finally {
      button.disabled = false;
      input.focus();
    }
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
    if (isFinished(state)) {
      hand.textContent = emptyHandText(state);
      return;
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
    if (isFinished(state)) {
      playedCards.appendChild(renderGameOverCenter(state));
      return;
    }
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
      const score = seatElement.querySelector(".seat-score");
      const avatar = seatElement.querySelector(".seat-avatar");
      const isCurrentTurn = state.game.current_turn_seat === seat;
      seatElement.classList.toggle("active-turn", isCurrentTurn);
      seatElement.classList.toggle("you", player?.user_id === state.currentUserId);
      seatElement.classList.toggle("bot", player?.is_bot === true);
      seatElement.classList.toggle("disconnected", player?.disconnected_at !== null);
      if (name) {
        name.textContent = player ? playerNameLabel(player) : "Seat " + String(seat);
      }
      if (score) {
        score.textContent = player ? playerScoreLabel(player) : "";
      }
      if (avatar) {
        avatar.textContent = player ? player.avatar_emoji || (seatSymbols[seat] ?? "*") : ".";
      }
    }
  }
  function renderMoveLog(state) {
    const log = getRequiredElement("move-log");
    clearElement(log);
    if (state.moveLog.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "move-log-empty";
      emptyItem.textContent = "No moves yet.";
      log.appendChild(emptyItem);
      return;
    }
    state.moveLog.forEach((event) => {
      const item = document.createElement("li");
      item.className = "move-log-item move-log-" + event.event_type;
      const time = document.createElement("span");
      time.className = "move-log-time";
      time.textContent = eventTime(event.created_at);
      const message = document.createElement("span");
      message.className = "move-log-message";
      message.textContent = event.message;
      item.append(time, message);
      log.appendChild(item);
    });
    log.scrollTop = log.scrollHeight;
  }
  function renderFinalScoreboard(state) {
    const scoreboard = getRequiredElement("final-scoreboard");
    clearElement(scoreboard);
    if (!isFinished(state)) {
      scoreboard.hidden = true;
      return;
    }
    scoreboard.hidden = false;
    const title = document.createElement("h2");
    title.textContent = "Final Scoreboard";
    const list = document.createElement("ol");
    list.className = "final-score-list";
    rankedPlayers(state.players).forEach(({ player, rank }) => {
      const item = document.createElement("li");
      item.className = "final-score-row";
      if (rank === 1) {
        item.classList.add("winner");
      }
      const rankElement = document.createElement("span");
      rankElement.className = "final-score-rank";
      rankElement.textContent = rankLabel(rank);
      const avatar = document.createElement("span");
      avatar.className = "final-score-avatar";
      avatar.textContent = playerAvatar(player);
      const name = document.createElement("span");
      name.className = "final-score-name";
      name.textContent = playerNameLabel(player);
      const score = document.createElement("span");
      score.className = "final-score-total";
      score.textContent = String(player.total_score);
      item.append(rankElement, avatar, name, score);
      list.appendChild(item);
    });
    scoreboard.append(title, list);
  }
  function renderChatMessages(messages) {
    const list = getRequiredElement("chat-messages");
    clearElement(list);
    if (messages.length === 0) {
      const empty = document.createElement("li");
      empty.className = "chat-message chat-message-empty";
      empty.textContent = "No chat messages yet.";
      list.appendChild(empty);
      return;
    }
    messages.forEach((chatMessage) => {
      const item = document.createElement("li");
      item.className = "chat-message";
      const meta = document.createElement("div");
      meta.className = "chat-message-meta";
      const author = document.createElement("span");
      author.className = "chat-message-author";
      author.textContent = chatAuthorLabel(chatMessage);
      const time = document.createElement("span");
      time.className = "chat-message-time";
      time.textContent = eventTime(chatMessage.created_at);
      const body = document.createElement("p");
      body.className = "chat-message-body";
      body.textContent = chatMessage.message;
      meta.append(author, time);
      item.append(meta, body);
      list.appendChild(item);
    });
    list.scrollTop = list.scrollHeight;
  }
  function renderState(gameId, state) {
    getRequiredElement("game-status").textContent = state.statusText;
    getRequiredElement("game-event").textContent = state.game.last_event ?? "";
    setGameError("");
    renderGameActions(state);
    renderPlayers(state);
    renderPlayedCards(state);
    renderFinalScoreboard(state);
    renderMoveLog(state);
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
    if (isFinished(state)) {
      return "Game finished.";
    }
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
  function playerNameLabel(player) {
    if (player.is_bot) {
      return player.display_name + " Bot";
    }
    if (player.disconnected_at) {
      return player.display_name + " Offline";
    }
    return player.display_name;
  }
  function playerScoreLabel(player) {
    return String(player.hand_score) + " / " + String(player.total_score);
  }
  function playerAvatar(player) {
    return player.avatar_emoji || seatSymbols[player.seat] || "*";
  }
  function isFinished(state) {
    return state.game.status === "finished" || state.game.phase === "finished";
  }
  function rankedPlayers(players) {
    let previousScore = null;
    let previousRank = 0;
    return [...players].sort((a, b) => {
      if (a.total_score !== b.total_score) {
        return a.total_score - b.total_score;
      }
      return a.seat - b.seat;
    }).map((player, index) => {
      const rank = previousScore === player.total_score ? previousRank : index + 1;
      previousScore = player.total_score;
      previousRank = rank;
      return {
        player,
        rank
      };
    });
  }
  function winningPlayers(state) {
    const lowestScore = Math.min(...state.players.map((player) => player.total_score));
    return state.players.filter((player) => player.total_score === lowestScore);
  }
  function winnerLabel(state) {
    const winners = winningPlayers(state).map(
      (player) => playerAvatar(player) + " " + playerNameLabel(player)
    );
    if (winners.length === 0) {
      return "No winner yet";
    }
    if (winners.length === 1) {
      return winners[0] ?? "No winner yet";
    }
    return winners.slice(0, -1).join(", ") + " and " + (winners.at(-1) ?? "");
  }
  function rankLabel(rank) {
    if (rank === 1) {
      return "\u{1F947}";
    }
    if (rank === 2) {
      return "\u{1F948}";
    }
    if (rank === 3) {
      return "\u{1F949}";
    }
    return "\u{1F396}\uFE0F";
  }
  function renderGameOverCenter(state) {
    const wrapper = document.createElement("div");
    wrapper.className = "game-over-center";
    const title = document.createElement("strong");
    title.textContent = "\u{1F3C6} Game Over";
    const winner = document.createElement("span");
    winner.textContent = "Winner: " + winnerLabel(state);
    wrapper.append(title, winner);
    return wrapper;
  }
  function renderGameActions(state) {
    const leaveButton = getRequiredElement("leave-game");
    const playAgainButton = getRequiredElement("play-again");
    const returnLobbyButton = getRequiredElement("return-lobby");
    const finished = isFinished(state);
    if (!(leaveButton instanceof HTMLButtonElement) || !(playAgainButton instanceof HTMLButtonElement) || !(returnLobbyButton instanceof HTMLButtonElement)) {
      throw new Error("Missing game action buttons.");
    }
    leaveButton.hidden = finished;
    playAgainButton.hidden = !finished;
    returnLobbyButton.hidden = !finished;
  }
  function chatAuthorLabel(chatMessage) {
    const name = chatMessage.display_name ?? "Former player";
    return chatMessage.avatar_emoji ? chatMessage.avatar_emoji + " " + name : name;
  }
  function eventTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }
  function setGameError(message) {
    getRequiredElement("game-error").textContent = message;
  }
  function setChatStatus(message) {
    getRequiredElement("chat-status").textContent = message;
  }
  function setupSse(gameId) {
    const source = new EventSource("/api/sse?gameId=" + String(gameId));
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "game_updated" && data.gameId === gameId) {
          void loadState(gameId);
        }
        if (data.type === "chat_updated" && data.gameId === gameId) {
          void loadChatMessages(gameId);
        }
      } catch (err) {
        console.error("Error parsing game SSE message:", err);
      }
    };
    source.onerror = () => {
      console.error("Game SSE connection error");
    };
  }
  function setupLeaveButton(gameId) {
    const button = getRequiredElement("leave-game");
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("Missing #leave-game button.");
    }
    button.addEventListener("click", () => {
      void leaveGame(gameId);
    });
  }
  function setupFinishedActionButtons() {
    const playAgainButton = getRequiredElement("play-again");
    const returnLobbyButton = getRequiredElement("return-lobby");
    if (!(playAgainButton instanceof HTMLButtonElement) || !(returnLobbyButton instanceof HTMLButtonElement)) {
      throw new Error("Missing finished game action buttons.");
    }
    playAgainButton.addEventListener("click", () => {
      void playAgain();
    });
    returnLobbyButton.addEventListener("click", () => {
      window.location.href = "/lobby";
    });
  }
  function setupChatForm(gameId) {
    const form = getRequiredElement("chat-form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Missing #chat-form.");
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void sendChatMessage(gameId);
    });
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
    setupLeaveButton(gameId);
    setupFinishedActionButtons();
    setupChatForm(gameId);
    void loadState(gameId);
    void loadChatMessages(gameId);
  }
  main();
})();
//# sourceMappingURL=game.js.map
