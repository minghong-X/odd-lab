CREATE TABLE IF NOT EXISTS battles (
 id text PRIMARY KEY, token_hash text NOT NULL, experiment text NOT NULL,
 left_id text NOT NULL, right_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 CONSTRAINT different_artifacts CHECK (left_id <> right_id)
);
CREATE TABLE IF NOT EXISTS votes (
 id text PRIMARY KEY, battle_id text NOT NULL REFERENCES battles(id), choice text NOT NULL CHECK (choice IN ('left','right','draw','neither')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vote_battle_unique ON votes(battle_id);
CREATE TABLE IF NOT EXISTS ratings (
 artifact_id text PRIMARY KEY, experiment text NOT NULL, score double precision NOT NULL DEFAULT 1500,
 matches integer NOT NULL DEFAULT 0, wins integer NOT NULL DEFAULT 0, draws integer NOT NULL DEFAULT 0, rejected integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS rating_events (
 id text PRIMARY KEY, vote_id text NOT NULL REFERENCES votes(id), artifact_id text NOT NULL,
 before double precision NOT NULL, after double precision NOT NULL, algorithm text NOT NULL DEFAULT 'elo-1500-k32-v1'
);
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS ratings_experiment ON ratings(experiment);
