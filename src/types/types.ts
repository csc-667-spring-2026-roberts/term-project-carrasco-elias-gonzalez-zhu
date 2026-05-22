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

export type GamePhase = "waiting" | "passing" | "playing" | "finished";

export type CardLocation = "deck" | "hand" | "passing" | "trick" | "taken";

export type CardSuit = "clubs" | "diamonds" | "hearts" | "spades";

export type PassDirection = "left" | "right" | "across" | "hold";

export type GameEventType = "system" | "pass" | "play" | "trick" | "score" | "leave";

export interface Game {
  id: number;
  status: GameStatus;
  created_at: Date;
  max_players: number;
  started_at: Date | null;
  current_turn_seat: number | null;
  phase: GamePhase;
  current_hand_no: number;
  current_trick_no: number;
  lead_seat: number | null;
  hearts_broken: boolean;
  pass_direction: PassDirection;
  finished_at: Date | null;
  last_event: string | null;
  target_score: number;
}

export interface GameListItem {
  id: number;
  status: GameStatus;
  phase: GamePhase;
  created_at: Date;
  max_players: number;
  creator_email: string;
  player_count: number;
}

export interface GamePlayer {
  user_id: number;
  display_name: string;
  seat: number;
  total_score: number;
  hand_score: number;
  has_passed: boolean;
  is_bot: boolean;
  disconnected_at: Date | null;
  left_at: Date | null;
}

export interface GameCard {
  game_card_id: number;
  card_id: number;
  suit: CardSuit;
  rank: string;
  label: string;
  location: CardLocation;
  user_id: number | null;
  owner_seat: number | null;
  played_order: number | null;
  played_at: Date | null;
  trick_no: number | null;
  trick_order: number | null;
  taken_by_seat: number | null;
  is_playable: boolean;
}

export interface GameEvent {
  id: number;
  game_id: number;
  hand_no: number;
  trick_no: number | null;
  actor_seat: number | null;
  actor_user_id: number | null;
  event_type: GameEventType;
  message: string;
  created_at: Date;
}

export interface GameState {
  game: {
    id: number;
    status: GameStatus;
    phase: GamePhase;
    started_at: Date | null;
    current_turn_seat: number | null;
    current_hand_no: number;
    current_trick_no: number;
    lead_seat: number | null;
    hearts_broken: boolean;
    pass_direction: PassDirection;
    target_score: number;
    last_event: string | null;
  };
  players: GamePlayer[];
  hand: GameCard[];
  playedCards: GameCard[];
  moveLog: GameEvent[];
  currentUserId: number;
  currentUserSeat: number;
  canPlay: boolean;
  canPass: boolean;
  hasPassed: boolean;
  requiredPassCount: number;
  statusText: string;
}
