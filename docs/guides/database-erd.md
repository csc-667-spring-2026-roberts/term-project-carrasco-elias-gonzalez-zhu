# Pull Request Guide

**CSC 667 Term Project**

- **Last Updated:** 2026-04-02
- **Latest Changes:**
  - removed `games.host_user_id`
  - standardized `game_players` → `game_users`
  - creator/host is now derived from earliest `joined_at` in `game_users`
  - added case-insensitive email index
  - added relationship indexes for performance

This document shows the current database schema for the Hearts project.

**Note:** This is a reference diagram. The source of truth is the migrations.

---

## Full Schema Diagram

**Click the diagram below to view a full-size version:**

<a href="./full-schema.svg">
  <img src="./full-schema.svg" width="1000" />
</a>
