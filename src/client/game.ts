type GameStatus = "waiting" | "in_progress" | "finished";
type CardSuit = "clubs" | "diamonds" | "hearts" | "spades";

type GameInfo = {
  id: number;
  status: GameStatus;
  current_turn_seat: number | null;
};

type Player = {
  user_id: number;
  display_name: string;
  seat: number;
};

type GameCard = {
  game_card_id: number;
  suit: CardSuit;
  rank: string;
  label: string;
  user_id: number | null;
};

type GameState = {
  game: GameInfo;
  players: Player[];
  hand: GameCard[];
  playedCards: GameCard[];
  currentUserId: number;
  canPlay: boolean;
  statusText: string;
};

type GameStateResponse = {
  state: GameState;
};

type ErrorResponse = {
  error?: string;
};

type SseMessage = {
  type: string;
  gameId?: number;
};

const suitSymbols: Record<CardSuit, string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

const seatSymbols: Record<number, string> = {
  1: "♥",
  2: "♦",
  3: "♣",
  4: "♠",
};

function cardText(card: GameCard): string {
  return card.rank + suitSymbols[card.suit];
}

function clearElement(element: HTMLElement): void {
  element.textContent = "";
}

function getRequiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLElement)) {
    throw new Error("Missing #" + id + " element.");
  }

  return element;
}

async function loadState(gameId: number): Promise<void> {
  const response = await fetch("/api/games/" + String(gameId) + "/state");

  if (!response.ok) {
    setGameError(await readError(response));
    return;
  }

  const data = (await response.json()) as GameStateResponse;
  renderState(gameId, data.state);
}

async function playCard(gameId: number, gameCardId: number): Promise<void> {
  setGameError("");

  const response = await fetch("/api/games/" + String(gameId) + "/play-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gameCardId,
    }),
  });

  if (!response.ok) {
    setGameError(await readError(response));
    await loadState(gameId);
    return;
  }

  const data = (await response.json()) as GameStateResponse;
  renderState(gameId, data.state);
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ErrorResponse;
    return data.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function renderCard(card: GameCard): HTMLDivElement {
  const cardElement = document.createElement("div");
  cardElement.className = "playing-card suit-" + card.suit;
  cardElement.textContent = cardText(card);
  cardElement.title = card.label;

  return cardElement;
}

function renderHand(gameId: number, state: GameState): void {
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

    button.addEventListener("click", (): void => {
      void playCard(gameId, card.game_card_id);
    });

    hand.appendChild(button);
  });
}

function renderPlayedCards(state: GameState): void {
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

function renderPlayers(state: GameState): void {
  for (let seat = 1; seat <= 4; seat += 1) {
    const seatElement = document.querySelector<HTMLElement>(
      '.table-seat[data-seat="' + String(seat) + '"]',
    );

    if (!seatElement) {
      continue;
    }

    const player = state.players.find((candidate) => candidate.seat === seat);
    const name = seatElement.querySelector<HTMLElement>(".seat-name");
    const avatar = seatElement.querySelector<HTMLElement>(".seat-avatar");
    const isCurrentTurn = state.game.current_turn_seat === seat;

    seatElement.classList.toggle("active-turn", isCurrentTurn);
    seatElement.classList.toggle("you", player?.user_id === state.currentUserId);

    if (name) {
      name.textContent = player ? player.display_name : "Seat " + String(seat);
    }

    if (avatar) {
      avatar.textContent = player ? (seatSymbols[seat] ?? "•") : "·";
    }
  }
}

function renderState(gameId: number, state: GameState): void {
  getRequiredElement("game-status").textContent = state.statusText;
  setGameError("");
  renderPlayers(state);
  renderPlayedCards(state);
  renderHand(gameId, state);
}

function setGameError(message: string): void {
  getRequiredElement("game-error").textContent = message;
}

function setupSse(gameId: number): void {
  const source = new EventSource("/api/sse");

  source.onmessage = (event: MessageEvent<string>): void => {
    try {
      const data = JSON.parse(event.data) as SseMessage;

      if (data.type === "game_updated" && data.gameId === gameId) {
        void loadState(gameId);
      }
    } catch (err) {
      console.error("Error parsing game SSE message:", err);
    }
  };

  source.onerror = (): void => {
    console.error("Game SSE connection error");
  };
}

function main(): void {
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
