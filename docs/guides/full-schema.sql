-- ============================================================
-- FULL PROJECT SCHEMA (WORK IN PROGRESS)
-- ============================================================
-- Last Updated: 2026-04-01
-- Latest Changes: case-insensitive email + games index
--
-- Reference schema for the Hearts project.
-- Source of truth: migrations/
-- ============================================================

BEGIN;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  suit VARCHAR(10) NOT NULL,
  rank INT NOT NULL,
  CONSTRAINT cards_suit_check CHECK (suit IN ('clubs', 'diamonds', 'hearts', 'spades')),
  CONSTRAINT cards_rank_check CHECK (rank BETWEEN 2 AND 14),
  CONSTRAINT cards_unique UNIQUE (suit, rank)
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  host_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL,
  max_players INT NOT NULL DEFAULT 4,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  current_hand_no INT,
  current_turn_seat INT,
  CONSTRAINT games_status_check CHECK (status IN ('waiting', 'in_progress', 'finished')),
  CONSTRAINT games_max_players_check CHECK (max_players BETWEEN 2 AND 4),
  CONSTRAINT games_turn_seat_check CHECK (
    current_turn_seat IS NULL OR current_turn_seat BETWEEN 0 AND 3
  )
);

CREATE TABLE game_players (
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat INT NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (game_id, user_id),
  CONSTRAINT game_players_game_seat_unique UNIQUE (game_id, seat),
  CONSTRAINT game_players_seat_check CHECK (seat BETWEEN 0 AND 3)
);

CREATE TABLE hands (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hand_no INT NOT NULL,
  dealer_seat INT NOT NULL,
  pass_direction VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  CONSTRAINT hands_game_hand_unique UNIQUE (game_id, hand_no),
  CONSTRAINT hands_dealer_seat_check CHECK (dealer_seat BETWEEN 0 AND 3),
  CONSTRAINT hands_pass_direction_check CHECK (
    pass_direction IN ('left', 'right', 'across', 'hold')
  )
);

CREATE TABLE tricks (
  id SERIAL PRIMARY KEY,
  hand_id INT NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  trick_no INT NOT NULL,
  lead_seat INT NOT NULL,
  winning_seat INT,
  led_suit VARCHAR(10),
  current_turn_seat INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  CONSTRAINT tricks_hand_trick_unique UNIQUE (hand_id, trick_no),
  CONSTRAINT tricks_lead_seat_check CHECK (lead_seat BETWEEN 0 AND 3),
  CONSTRAINT tricks_winning_seat_check CHECK (
    winning_seat IS NULL OR winning_seat BETWEEN 0 AND 3
  ),
  CONSTRAINT tricks_current_turn_seat_check CHECK (
    current_turn_seat IS NULL OR current_turn_seat BETWEEN 0 AND 3
  ),
  CONSTRAINT tricks_led_suit_check CHECK (
    led_suit IS NULL OR led_suit IN ('clubs', 'diamonds', 'hearts', 'spades')
  )
);

CREATE TABLE hand_cards (
  hand_id INT NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  card_id INT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  owner_seat INT,
  location VARCHAR(20) NOT NULL,
  current_trick_id INT REFERENCES tricks(id) ON DELETE SET NULL,
  position_index INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (hand_id, card_id),
  CONSTRAINT hand_cards_owner_seat_check CHECK (
    owner_seat IS NULL OR owner_seat BETWEEN 0 AND 3
  ),
  CONSTRAINT hand_cards_location_check CHECK (
    location IN ('player_hand', 'passing', 'trick', 'taken')
  ),
  CONSTRAINT hand_cards_position_index_check CHECK (
    position_index IS NULL OR position_index BETWEEN 0 AND 12
  )
);

CREATE TABLE passes (
  id SERIAL PRIMARY KEY,
  hand_id INT NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  from_seat INT NOT NULL,
  to_seat INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT passes_from_seat_check CHECK (from_seat BETWEEN 0 AND 3),
  CONSTRAINT passes_to_seat_check CHECK (to_seat BETWEEN 0 AND 3),
  CONSTRAINT passes_not_same_seat CHECK (from_seat <> to_seat)
);

CREATE TABLE pass_cards (
  pass_id INT NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
  card_id INT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pass_id, card_id)
);

CREATE TABLE trick_plays (
  trick_id INT NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  play_order INT NOT NULL,
  seat INT NOT NULL,
  card_id INT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (trick_id, play_order),
  CONSTRAINT trick_plays_trick_seat_unique UNIQUE (trick_id, seat),
  CONSTRAINT trick_plays_trick_card_unique UNIQUE (trick_id, card_id),
  CONSTRAINT trick_plays_order_check CHECK (play_order BETWEEN 1 AND 4),
  CONSTRAINT trick_plays_seat_check CHECK (seat BETWEEN 0 AND 3)
);

CREATE TABLE hand_scores (
  hand_id INT NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  seat INT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (hand_id, seat),
  CONSTRAINT hand_scores_seat_check CHECK (seat BETWEEN 0 AND 3),
  CONSTRAINT hand_scores_points_check CHECK (points >= 0)
);

CREATE INDEX idx_session_expire ON session(expire);
CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));
CREATE INDEX idx_games_host_user_id ON games(host_user_id);
CREATE INDEX idx_games_waiting ON games(status) WHERE status = 'waiting';
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_hand_cards_current_trick_id ON hand_cards(current_trick_id);
CREATE INDEX idx_passes_hand_id ON passes(hand_id);
CREATE INDEX idx_pass_cards_card_id ON pass_cards(card_id);
CREATE INDEX idx_trick_plays_card_id ON trick_plays(card_id);

COMMIT;