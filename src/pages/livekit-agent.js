import { supabase } from '../supabase.js';
import { showToast } from '../utils.js';
import { getConfig } from '../config.js';

async function fetchAgentStatus() {
  const { data, error } = await supabase
    .from('agent_status')
    .select('*')
    .eq('agent_name', 'outbound-caller')
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchActiveRooms() {
  const { data, error } = await supabase
    .from('active_calls')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchRecentCalls(limit = 5) {
  const { data, error } = await supabase
    .from('call_logs')
    .select('id, phone_number, caller_name, duration_seconds, call_direction, sentiment, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getStatusBadge(status, heartbeat) {
  if (!status) {
    return '<span class="agent-status-badge agent-status-waiting">Not Registered</span>';
  }
  if (status === 'online') {
    const diff = heartbeat ? Date.now() - new Date(heartbeat).getTime() : Infinity;
    if (diff > 120000) {
      return '<span class="agent-status-badge agent-status-stale">Stale</span>';
    }
    return '<span class="agent-status-badge agent-status-online"><span class="status-dot-live"></span>Online</span>';
  }
  if (status === 'error') {
    return '<span class="agent-status-badge agent-status-error">Error</span>';
  }
  return '<span class="agent-status-badge agent-status-offline">Offline</span>';
}

export function renderLiveKitAgent() {
  const config = getConfig();
  const lkUrl = config.livekit_url || '';
  const lkKey = config.livekit_api_key || '';
  const hasCreds = lkUrl && lkKey;

  return `
    <div class="page-header">
      <div class="page-title">LiveKit Agent</div>
      <div class="page-sub">Monitor your AI voice agent connection and live activity</div>
    </div>

    <div class="agent-top-grid">
      <div class="agent-connection-card">
        <div class="section-title">Connection Status</div>
        <div class="agent-status-row">
          <div id="agent-status-badge">${getStatusBadge(null, null)}</div>
          <button class="btn btn-ghost btn-sm" id="refresh-agent-status">Refresh</button>
        </div>
        <div class="agent-info-grid">
          <div class="agent-info-item">
            <div class="agent-info-label">Project</div>
            <div class="agent-info-value" id="agent-project">${lkUrl ? lkUrl.replace('wss://', '').replace('.livekit.cloud', '') : '--'}</div>
          </div>
          <div class="agent-info-item">
            <div class="agent-info-label">Agent Name</div>
            <div class="agent-info-value">outbound-caller</div>
          </div>
          <div class="agent-info-item">
            <div class="agent-info-label">Last Heartbeat</div>
            <div class="agent-info-value" id="agent-heartbeat">--</div>
          </div>
          <div class="agent-info-item">
            <div class="agent-info-label">Uptime</div>
            <div class="agent-info-value" id="agent-uptime">--</div>
          </div>
        </div>
      </div>

      <div class="agent-stats-card">
        <div class="section-title">Agent Metrics</div>
        <div class="agent-metric-grid">
          <div class="agent-metric">
            <div class="agent-metric-value" id="metric-rooms">0</div>
            <div class="agent-metric-label">Active Rooms</div>
          </div>
          <div class="agent-metric">
            <div class="agent-metric-value" id="metric-total">0</div>
            <div class="agent-metric-label">Calls Handled</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card" id="creds-check-card">
      <div class="section-title">Configuration Check</div>
      <div class="config-check-grid" id="config-checks">
        <div class="config-check-item">
          <span class="config-check-icon ${lkUrl ? 'check-pass' : 'check-fail'}">${lkUrl ? '&#10003;' : '&#10007;'}</span>
          <span>LiveKit URL</span>
          <span class="config-check-val">${lkUrl ? lkUrl.replace('wss://', '') : 'Not configured'}</span>
        </div>
        <div class="config-check-item">
          <span class="config-check-icon ${lkKey ? 'check-pass' : 'check-fail'}">${lkKey ? '&#10003;' : '&#10007;'}</span>
          <span>API Key</span>
          <span class="config-check-val">${lkKey ? lkKey.substring(0, 8) + '...' : 'Not configured'}</span>
        </div>
        <div class="config-check-item">
          <span class="config-check-icon ${config.livekit_api_secret ? 'check-pass' : 'check-fail'}">${config.livekit_api_secret ? '&#10003;' : '&#10007;'}</span>
          <span>API Secret</span>
          <span class="config-check-val">${config.livekit_api_secret ? 'Configured' : 'Not configured'}</span>
        </div>
        <div class="config-check-item">
          <span class="config-check-icon ${config.openai_api_key ? 'check-pass' : 'check-fail'}">${config.openai_api_key ? '&#10003;' : '&#10007;'}</span>
          <span>OpenAI Key</span>
          <span class="config-check-val">${config.openai_api_key ? 'Configured' : 'Not configured'}</span>
        </div>
        <div class="config-check-item">
          <span class="config-check-icon ${config.sarvam_api_key ? 'check-pass' : 'check-fail'}">${config.sarvam_api_key ? '&#10003;' : '&#10007;'}</span>
          <span>Sarvam Key</span>
          <span class="config-check-val">${config.sarvam_api_key ? 'Configured' : 'Not configured'}</span>
        </div>
        <div class="config-check-item">
          <span class="config-check-icon ${config.sip_trunk_id ? 'check-pass' : 'check-fail'}">${config.sip_trunk_id ? '&#10003;' : '&#10007;'}</span>
          <span>SIP Trunk ID</span>
          <span class="config-check-val">${config.sip_trunk_id ? config.sip_trunk_id.substring(0, 12) + '...' : 'Not configured'}</span>
        </div>
      </div>
      ${!hasCreds ? `<div class="config-warning">LiveKit credentials are required. Go to <strong>API Credentials</strong> to set your LiveKit URL, API Key, and API Secret.</div>` : ''}
    </div>

    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="border:none;padding:0;margin:0;">Live Rooms</div>
        <button class="btn btn-ghost btn-sm" id="refresh-rooms">Refresh</button>
      </div>
      <div id="live-rooms-container">
        <div class="no-live-calls">Loading...</div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">Recent Activity</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Phone</th><th>Direction</th><th>Duration</th><th>Sentiment</th></tr></thead>
          <tbody id="agent-recent-body"><tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>`;
}

function renderRooms(rooms) {
  const container = document.getElementById('live-rooms-container');
  if (!container) return;
  if (!rooms.length) {
    container.innerHTML = '<div class="no-live-calls">No active rooms right now.</div>';
    return;
  }
  container.innerHTML = `<div class="live-calls-grid">${rooms.map(r => `
    <div class="live-call-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="live-indicator"></span>
        <span style="font-weight:600;font-size:13px;">${r.room_id || 'Unknown Room'}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);">
        <div>Phone: <span style="color:var(--text)">${r.phone || 'Unknown'}</span></div>
        <div>Direction: <span style="color:var(--text)">${r.call_direction || 'inbound'}</span></div>
        <div>Since: <span style="color:var(--text)">${r.started_at ? new Date(r.started_at).toLocaleTimeString() : '--'}</span></div>
      </div>
    </div>`).join('')}</div>`;
}

function sentimentBadge(s) {
  if (!s || s === 'unknown') return '<span class="badge badge-gray">--</span>';
  if (s === 'positive') return '<span class="badge badge-green">Positive</span>';
  if (s === 'negative' || s === 'frustrated') return '<span class="badge badge-red">' + s.charAt(0).toUpperCase() + s.slice(1) + '</span>';
  return '<span class="badge badge-gray">' + s.charAt(0).toUpperCase() + s.slice(1) + '</span>';
}

export async function initLiveKitAgent() {
  const loadStatus = async () => {
    try {
      const [status, rooms, recent] = await Promise.all([
        fetchAgentStatus(),
        fetchActiveRooms(),
        fetchRecentCalls(),
      ]);

      const badgeEl = document.getElementById('agent-status-badge');
      if (badgeEl && status) {
        badgeEl.innerHTML = getStatusBadge(status.status, status.last_heartbeat);
      }

      const heartbeatEl = document.getElementById('agent-heartbeat');
      if (heartbeatEl) heartbeatEl.textContent = status ? formatTimeAgo(status.last_heartbeat) : '--';

      const uptimeEl = document.getElementById('agent-uptime');
      if (uptimeEl) uptimeEl.textContent = status ? formatUptime(status.uptime_seconds) : '--';

      const roomsEl = document.getElementById('metric-rooms');
      if (roomsEl) roomsEl.textContent = rooms.length;

      const totalEl = document.getElementById('metric-total');
      if (totalEl) totalEl.textContent = status ? status.total_calls_handled : '0';

      renderRooms(rooms);

      const tbody = document.getElementById('agent-recent-body');
      if (tbody) {
        if (!recent.length) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No recent calls.</td></tr>';
        } else {
          tbody.innerHTML = recent.map(r => `
            <tr>
              <td style="color:var(--muted)">${formatTimeAgo(r.created_at)}</td>
              <td style="font-weight:600">${r.phone_number || 'Unknown'}</td>
              <td><span class="badge ${r.call_direction === 'outbound' ? 'badge-blue' : 'badge-gray'}">${r.call_direction || 'inbound'}</span></td>
              <td>${r.duration_seconds || 0}s</td>
              <td>${sentimentBadge(r.sentiment)}</td>
            </tr>`).join('');
        }
      }
    } catch (e) {
      const tbody = document.getElementById('agent-recent-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">Could not load data.</td></tr>';
    }
  };

  await loadStatus();
  document.getElementById('refresh-agent-status')?.addEventListener('click', loadStatus);
  document.getElementById('refresh-rooms')?.addEventListener('click', loadStatus);
}
