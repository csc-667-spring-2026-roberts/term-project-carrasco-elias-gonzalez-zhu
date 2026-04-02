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

export interface Game {
  id: number;
  status: GameStatus;
  created_at: Date;
}

export interface GameListItem {
  id: number;
  status: GameStatus;
  created_at: Date;
  creator_email: string;
  player_count: number;
}
