/*
  # Create outbound_campaigns table

  1. New Tables
    - `outbound_campaigns` - manages outbound call campaigns
      - `id` (uuid, primary key)
      - `name` (text) - campaign name
      - `status` (text) - draft, active, paused, completed
      - `phone_numbers` (text[]) - array of numbers to call
      - `total_numbers` (integer) - total numbers in campaign
      - `calls_completed` (integer) - how many calls finished
      - `calls_succeeded` (integer) - calls that connected
      - `calls_booked` (integer) - calls that resulted in booking
      - `custom_first_line` (text) - optional custom greeting
      - `custom_instructions` (text) - optional custom agent prompt
      - `schedule_at` (timestamptz) - when to start calling
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. New Tables
    - `outbound_call_results` - per-number results within a campaign
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, FK)
      - `phone_number` (text)
      - `status` (text) - pending, dispatched, connected, completed, failed
      - `dispatch_id` (text) - LiveKit dispatch ID
      - `room_name` (text) - LiveKit room
      - `duration_seconds` (integer)
      - `was_booked` (boolean)
      - `sentiment` (text)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  3. Security
    - Enable RLS on both tables
    - Policies for anon access (agent runs as anon)
*/

CREATE TABLE IF NOT EXISTS outbound_campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL DEFAULT '',
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    phone_numbers text[] DEFAULT '{}',
    total_numbers integer DEFAULT 0,
    calls_completed integer DEFAULT 0,
    calls_succeeded integer DEFAULT 0,
    calls_booked integer DEFAULT 0,
    custom_first_line text DEFAULT '',
    custom_instructions text DEFAULT '',
    schedule_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE outbound_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert campaigns"
    ON outbound_campaigns FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anon can read campaigns"
    ON outbound_campaigns FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anon can update campaigns"
    ON outbound_campaigns FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE TABLE IF NOT EXISTS outbound_call_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES outbound_campaigns(id),
    phone_number text NOT NULL DEFAULT '',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'connected', 'completed', 'failed')),
    dispatch_id text DEFAULT '',
    room_name text DEFAULT '',
    duration_seconds integer DEFAULT 0,
    was_booked boolean DEFAULT false,
    sentiment text DEFAULT 'unknown',
    error_message text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbound_results_campaign ON outbound_call_results (campaign_id);
CREATE INDEX IF NOT EXISTS idx_outbound_results_phone ON outbound_call_results (phone_number);
CREATE INDEX IF NOT EXISTS idx_outbound_results_status ON outbound_call_results (status);

ALTER TABLE outbound_call_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert call results"
    ON outbound_call_results FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anon can read call results"
    ON outbound_call_results FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anon can update call results"
    ON outbound_call_results FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);
