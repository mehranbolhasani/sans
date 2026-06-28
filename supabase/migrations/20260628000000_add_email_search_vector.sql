-- add_email_search_vector
-- Full-text search across emails (subject + body_text)

ALTER TABLE emails ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS emails_search_vector_idx
  ON emails USING GIN(search_vector);

-- Populate existing rows
UPDATE emails
SET search_vector = to_tsvector('english',
  coalesce(subject, '') || ' ' || coalesce(body_text, '')
);

-- Trigger to keep it updated on insert/update
CREATE OR REPLACE FUNCTION emails_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.subject, '') || ' ' || coalesce(NEW.body_text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER emails_search_vector_update
  BEFORE INSERT OR UPDATE OF subject, body_text ON emails
  FOR EACH ROW EXECUTE FUNCTION emails_search_vector_trigger();
