import { supabase } from './supabase.js';

export async function fetchStats() {
  const { data, error } = await supabase
    .from('call_logs')
    .select('duration_seconds, summary');
  if (error) throw error;
  const rows = data || [];
  const total = rows.length;
  const bookings = rows.filter(r => (r.summary || '').includes('Confirmed')).length;
  const durations = rows.filter(r => r.duration_seconds).map(r => r.duration_seconds);
  const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const rate = total ? Math.round((bookings / total) * 100) : 0;
  return { total_calls: total, total_bookings: bookings, avg_duration: avgDur, booking_rate: rate };
}

export async function fetchCallLogs(limit = 50) {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function fetchBookings() {
  const { data, error } = await supabase
    .from('call_logs')
    .select('id, phone_number, summary, created_at')
    .ilike('summary', '%Confirmed%')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function fetchContacts() {
  const { data, error } = await supabase
    .from('call_logs')
    .select('phone_number, caller_name, summary, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = data || [];
  const contacts = {};
  for (const r of rows) {
    const phone = r.phone_number || 'unknown';
    if (!contacts[phone]) {
      contacts[phone] = {
        phone_number: phone,
        caller_name: r.caller_name || '',
        total_calls: 0,
        last_seen: r.created_at,
        is_booked: false,
      };
    }
    const c = contacts[phone];
    c.total_calls++;
    if (!c.caller_name && r.caller_name) c.caller_name = r.caller_name;
    if (r.summary && r.summary.includes('Confirmed')) c.is_booked = true;
  }
  return Object.values(contacts).sort((a, b) => (b.last_seen || '').localeCompare(a.last_seen || ''));
}

export async function fetchCampaigns() {
  const { data, error } = await supabase
    .from('outbound_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function fetchCampaignDetail(campaignId) {
  const { data: campaign } = await supabase
    .from('outbound_campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle();
  const { data: results } = await supabase
    .from('outbound_call_results')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true });
  return { campaign, results: results || [] };
}

export async function createCampaign({ name, numbers, firstLine, instructions }) {
  const phoneNumbers = numbers
    .split('\n')
    .map(n => n.trim())
    .filter(n => n.startsWith('+'));
  if (!phoneNumbers.length) throw new Error('No valid phone numbers');

  const { data: campaign, error } = await supabase
    .from('outbound_campaigns')
    .insert({
      name: name || 'Untitled Campaign',
      status: 'active',
      phone_numbers: phoneNumbers,
      total_numbers: phoneNumbers.length,
      custom_first_line: firstLine || '',
      custom_instructions: instructions || '',
    })
    .select()
    .single();
  if (error) throw error;

  const callResults = phoneNumbers.map(phone => ({
    campaign_id: campaign.id,
    phone_number: phone,
    status: 'pending',
  }));
  await supabase.from('outbound_call_results').insert(callResults);

  return campaign;
}

export async function fetchActiveCalls() {
  const { data, error } = await supabase
    .from('active_calls')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTranscript(logId) {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('id', logId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return 'No transcript found.';
  let text = `Call Log - ${data.created_at || ''}\n`;
  text += `Phone: ${data.phone_number || 'Unknown'}\n`;
  text += `Duration: ${data.duration_seconds || 0}s\n`;
  text += `Direction: ${data.call_direction || 'inbound'}\n`;
  text += `Summary: ${data.summary || ''}\n\n`;
  text += '--- TRANSCRIPT ---\n';
  text += data.transcript || 'No transcript available.';
  return text;
}
