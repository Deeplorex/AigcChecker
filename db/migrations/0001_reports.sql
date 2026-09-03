CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  locale text,
  payload jsonb NOT NULL
);
