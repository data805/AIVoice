import { fetchInboundCalls, fetchActiveInboundCalls, fetchInboundStats, getTranscript } from '../api.js';

function badgeFor(summary) {
  if (!summary) return '<span class="badge badge-gray">Ended</span>';
  if (summary.toLowerCase().includes('confirm')) return '<span class="badge badge-green">Booked</span>';
  if (summary.toLowerCase().includes('cancel')) return '<span class="badge badge-yellow">Cancelled</span>';
  return '<span class="badge badge-gray">Completed</span>';
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function timeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function renderInbound() {
  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="page-title">Inbound Calls</div>
          <div class="page-sub">Monitor and review all incoming calls handled by the AI agent</div>
        </div>
        <button class="btn btn-ghost" id="refresh-inbound">Refresh</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Inbound Calls</div>
        <div class="stat-value" id="inbound-total">&mdash;</div>
        <div class="stat-sub">Total received</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bookings</div>
        <div class="stat-value" id="inbound-bookings">&mdash;</div>
        <div class="stat-sub">Confirmed from inbound</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Duration</div>
        <div class="stat-value" id="inbound-avg-dur">&mdash;</div>
        <div class="stat-sub">Seconds per inbound call</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Booking Rate</div>
        <div class="stat-value" id="inbound-rate">&mdash;</div>
        <div class="stat-sub">Inbound conversion</div>
      </div>
    </div>

    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="border:none;padding:0;margin:0;">Live Inbound Calls</div>
        <div id="live-count" style="font-size:12px;color:var(--muted);"></div>
      </div>
      <div id="live-inbound-container">
        <div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">Checking for active calls...</div>
      </div>
    </div>

    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="border:none;padding:0;margin:0;">Inbound Call History</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Phone</th>
              <th>Caller</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Summary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="inbound-table-body">
            <tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted);">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderLiveCallCard(call) {
  const elapsed = call.started_at ? timeSince(call.started_at) : '';
  return `
    <div class="live-call-card">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="live-indicator"></span>
          <div>
            <div style="font-weight:600;font-size:14px;">${call.phone_number || 'Unknown Caller'}</div>
            <div style="font-size:12px;color:var(--muted);">${call.caller_name || 'Caller'}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--green);font-weight:600;">Active</div>
          <div style="font-size:11px;color:var(--muted);">Started ${elapsed}</div>
        </div>
      </div>
      ${call.room_name ? `<div style="font-size:11px;color:var(--muted);margin-top:8px;">Room: ${call.room_name}</div>` : ''}
    </div>`;
}

async function loadLiveCalls() {
  const container = document.getElementById('live-inbound-container');
  const countEl = document.getElementById('live-count');
  try {
    const calls = await fetchActiveInboundCalls();
    if (!calls.length) {
      container.innerHTML = '<div class="no-live-calls"><div style="font-size:20px;margin-bottom:8px;">No active inbound calls</div><div style="font-size:12px;color:var(--muted);">Live calls will appear here when they start</div></div>';
      countEl.textContent = '';
      return;
    }
    countEl.textContent = `${calls.length} active`;
    container.innerHTML = `<div class="live-calls-grid">${calls.map(renderLiveCallCard).join('')}</div>`;
  } catch {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">Could not load active calls</div>';
  }
}

async function loadInboundHistory() {
  const tbody = document.getElementById('inbound-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Loading...</td></tr>';
  try {
    const logs = await fetchInboundCalls();
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">No inbound calls found.</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(log => `
      <tr>
        <td style="color:var(--muted);white-space:nowrap">${new Date(log.created_at).toLocaleString()}</td>
        <td style="font-weight:600">${log.phone_number || 'Unknown'}</td>
        <td>${log.caller_name || '<span style="color:var(--muted)">--</span>'}</td>
        <td>${formatDuration(log.duration_seconds)}</td>
        <td>${badgeFor(log.summary)}</td>
        <td style="color:var(--muted);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${log.summary || ''}">${log.summary || '--'}</td>
        <td>${log.id ? `<button class="btn btn-ghost btn-sm view-inbound-transcript" data-id="${log.id}">Transcript</button>` : '--'}</td>
      </tr>`).join('');
    tbody.querySelectorAll('.view-inbound-transcript').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = await getTranscript(btn.dataset.id);
        document.getElementById('transcript-body').textContent = text;
        document.getElementById('transcript-modal').classList.add('open');
      });
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--red);">Error loading inbound calls.</td></tr>';
  }
}

async function loadInboundStats() {
  try {
    const stats = await fetchInboundStats();
    document.getElementById('inbound-total').textContent = stats.inboundCount ?? '--';
    document.getElementById('inbound-bookings').textContent = stats.inboundBookings ?? '--';
    document.getElementById('inbound-avg-dur').textContent = stats.avgInbound ? stats.avgInbound + 's' : '--';
    document.getElementById('inbound-rate').textContent = stats.inboundRate ? stats.inboundRate + '%' : '--';
  } catch {
    // silently fail stats
  }
}

export async function initInbound() {
  let pollTimer = null;

  const loadAll = async () => {
    await Promise.all([loadInboundStats(), loadInboundHistory(), loadLiveCalls()]);
  };

  await loadAll();

  pollTimer = setInterval(loadLiveCalls, 15000);

  document.getElementById('refresh-inbound')?.addEventListener('click', loadAll);

  const observer = new MutationObserver(() => {
    const container = document.getElementById('live-inbound-container');
    if (!container) {
      clearInterval(pollTimer);
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById('main') || document.body, { childList: true });
}
