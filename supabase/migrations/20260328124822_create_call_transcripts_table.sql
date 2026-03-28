/*
  # Create call_transcripts table

  1. New Tables
    - `call_transcripts` - real-time transcript streaming per message
      - `id` (uuid, primary key)
      - `call_room_id` (text) - LiveKit room name
      - `phone` (text) - caller phone
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - transcript text
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS
    - Policies for anon insert/select
*/

CREATE TABLE IF NOT EXISTS call_transcripts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    call_room_id text NOT NULL,
    phone text DEFAULT '',
    role text CHECK (role IN ('user', 'assistant')),
    content text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_transcripts_room ON call_transcripts (call_room_id);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_phone ON call_transcripts (phone);

ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert transcripts"
    ON call_transcripts FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anon can read transcripts"
    ON call_transcripts FOR SELECT
    TO anon
    USING (true);
