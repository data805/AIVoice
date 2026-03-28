/*
  # Create active_calls table

  1. New Tables
    - `active_calls` - tracks currently live calls
      - `room_id` (text, primary key) - LiveKit room name
      - `phone` (text) - caller phone number
      - `caller_name` (text)
      - `status` (text) - ringing, active, completed
      - `started_at` (timestamptz)
      - `last_updated` (timestamptz)
      - `call_direction` (text) - inbound or outbound
      - `campaign_id` (text) - for outbound campaigns
  2. Security
    - Enable RLS
    - Policies for anon upsert/select
*/

CREATE TABLE IF NOT EXISTS active_calls (
    room_id text PRIMARY KEY,
    phone text DEFAULT '',
    caller_name text DEFAULT '',
    status text DEFAULT 'ringing',
    started_at timestamptz DEFAULT now(),
    last_updated timestamptz DEFAULT now(),
    call_direction text DEFAULT 'inbound',
    campaign_id text DEFAULT ''
);

ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert active_calls"
    ON active_calls FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anon can update active_calls"
    ON active_calls FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon can read active_calls"
    ON active_calls FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anon can delete active_calls"
    ON active_calls FOR DELETE
    TO anon
    USING (true);
