/*
  # Create agent_status table

  1. New Tables
    - `agent_status`
      - `id` (uuid, primary key) - Unique identifier
      - `agent_name` (text) - Name of the LiveKit agent worker
      - `status` (text) - Current status: online, offline, error
      - `livekit_url` (text) - Connected LiveKit Cloud URL
      - `last_heartbeat` (timestamptz) - Last time agent reported in
      - `rooms_active` (integer) - Number of active rooms/calls
      - `total_calls_handled` (integer) - Lifetime call count
      - `uptime_seconds` (integer) - Current session uptime
      - `version` (text) - Agent software version
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `agent_status` table
    - Add policy for authenticated users to read agent status
    - Add policy for service role to manage agent status
    - Add policy for anon users to read and upsert (agent worker uses anon key)
*/

CREATE TABLE IF NOT EXISTS agent_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL DEFAULT 'outbound-caller',
  status text NOT NULL DEFAULT 'offline',
  livekit_url text DEFAULT '',
  last_heartbeat timestamptz DEFAULT now(),
  rooms_active integer DEFAULT 0,
  total_calls_handled integer DEFAULT 0,
  uptime_seconds integer DEFAULT 0,
  version text DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon to read agent status"
  ON agent_status
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to upsert agent status"
  ON agent_status
  FOR INSERT
  TO anon
  WITH CHECK (agent_name IS NOT NULL);

CREATE POLICY "Allow anon to update agent status"
  ON agent_status
  FOR UPDATE
  TO anon
  USING (agent_name IS NOT NULL)
  WITH CHECK (agent_name IS NOT NULL);

CREATE POLICY "Allow authenticated to read agent status"
  ON agent_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);