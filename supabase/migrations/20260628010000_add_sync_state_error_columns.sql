-- add_sync_state_error_columns
-- Track the last sync error for the Google Calendar sync_state

ALTER TABLE public.sync_state
  ADD COLUMN last_error text,
  ADD COLUMN last_error_at timestamptz;
