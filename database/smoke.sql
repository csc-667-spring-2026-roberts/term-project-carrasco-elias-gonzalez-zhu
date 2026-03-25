-- Reset demo table
DROP TABLE IF EXISTS games;

-- Recreate minimal games table
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert realistic demo row
INSERT INTO games (name, status)
VALUES ('Hearts Match - Round 1', 'waiting');