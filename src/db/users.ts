// TODO [Person 1]:
// Implement the following database functions for the "users" table.
//
// Contract:
// - Table: users
// - Columns:
//   - id (primary key, auto-increment)
//   - email (varchar, unique, not null)
//   - password_hash (varchar, not null)
//   - display_name (varchar, not null)
//   - created_at (timestamp, default CURRENT_TIMESTAMP)
//
// Functions:
//
// existing(email):
// - returns true if a user with the given email exists
//
// create(email, passwordHash, displayName):
// - inserts a new user
// - returns a safe User object (no password_hash)
//
// findByEmail(email):
// - returns the full DbUser (including password_hash)
// - returns null if not found
//
// Do NOT modify this contract without team agreement.

import db from "./connection.js";
import type { DbUser, User } from "../types/types.js";

export function existing(_email: string): Promise<boolean> {
  void db;
  throw new Error("TODO [Person 1]: existing(email) not implemented");
}

export function create(_email: string, _passwordHash: string, _displayName: string): Promise<User> {
  void db;
  throw new Error("TODO [Person 1]: create(email, passwordHash, displayName) not implemented");
}

export function findByEmail(_email: string): Promise<DbUser | null> {
  void db;
  throw new Error("TODO [Person 1]: findByEmail(email) not implemented");
}
