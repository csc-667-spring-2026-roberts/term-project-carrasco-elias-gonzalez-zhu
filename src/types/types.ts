/**
 * Shared Types (M8)
 *
 * Owned by Person 1 (Core).
 *
 * Other team members (Jonathan, Marbella, Breanna):
 * - Use these types via import
 * - Do NOT modify this file directly
 */

export interface User {
  id: number;
  email: string;
  display_name: string;
  created_at: Date;
}

export interface DbUser extends User {
  password_hash: string;
}

export interface RegisterRequestBody {
  email?: string;
  password?: string;
  display_name?: string;
}

export interface LoginRequestBody {
  email?: string;
  password?: string;
}

export type GameStatus = "waiting" | "in_progress" | "finished";

export type CardLocation = "deck" | "hand" | "played";

export type CardSuit = "clubs" | "diamonds" | "hearts" | "spades";

export interface Game {
  id: number;
  status: GameStatus;
  created_at: Date;
  max_players: number;
  started_at: Date | null;
  current_turn_seat: number | null;
}

export interface GameListItem {
  id: number;
  status: GameStatus;
  created_at: Date;
  max_players: number;
  creator_email: string;
  player_count: number;
}

export interface GamePlayer {
  user_id: number;
  display_name: string;
  seat: number;
}

export interface GameCard {
  game_card_id: number;
  card_id: number;
  suit: CardSuit;
  rank: string;
  label: string;
  location: CardLocation;
  user_id: number | null;
  played_order: number | null;
  played_at: Date | null;
}

export interface GameState {
  game: {
    id: number;
    status: GameStatus;
    started_at: Date | null;
    current_turn_seat: number | null;
  };
  players: GamePlayer[];
  hand: GameCard[];
  playedCards: GameCard[];
  currentUserId: number;
  canPlay: boolean;
  statusText: string;
}
