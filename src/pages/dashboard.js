import { fetchStats, fetchCallLogs, getTranscript } from '../api.js';

function badgeFor(summary) {
  if (!summary) return '<span class="badge badge-gray">Ended</span>';
  if (summary.toLowerCase().includes('confirm')) return '<span class="badge badge-green">Booked</span>';
  if (summary.toLowerCase().includes('cancel')) return '<span class="badge badge-yellow">Cancelled</span>';
  return '<span class="badge badge-gray">Completed</span>';
}

export function renderDashboard() {
  return `
    <div class="page-header">
      <div class="page-title">Dashboard</div>
      <div class="page-sub">Real-time overview of your AI voice agent performance</div>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Total Calls</div><div class="stat-value" id="stat-calls">&mdash;</div><div class="stat-sub">All time</div></div>
      <div class="stat-card"><div class="stat-label">Bookings Made</div><div class="stat-value" id="stat-bookings">&mdash;</div><div class="stat-sub">Confirmed appointments</div></div>
      <div class="stat-card"><div class="stat-label">Avg Duration</div><div class="stat-value" id="stat-duration">&mdash;</div><div class="stat-sub">Seconds per call</div></div>
      <div class="stat-card"><div class="stat-label">Booking Rate</div><div class="stat-value" id="stat-rate">&mdash;</div><div class="stat-sub">Calls that converted</div></div>
    </div>
    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="border:none;padding:0;margin:0;">Recent Calls</div>
        <button class="btn btn-ghost btn-sm" id="refresh-dash">Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Phone</th><th>Direction</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="dash-table-body"><tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>`;
}

export async function initDashboard() {
  const load = async () => {
    try {
      const [stats, logs] = await Promise.all([fetchStats(), fetchCallLogs()]);
      document.getElementById('stat-calls').textContent = stats.total_calls ?? '—';
      document.getElementById('stat-bookings').textContent = stats.total_bookings ?? '—';
      document.getElementById('stat-duration').textContent = stats.avg_duration ? stats.avg_duration + 's' : '—';
      document.getElementById('stat-rate').textContent = stats.booking_rate ? stats.booking_rate + '%' : '—';
      const tbody = document.getElementById('dash-table-body');
      if (!logs.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">No calls yet.</td></tr>';
        return;
      }
      tbody.innerHTML = logs.slice(0, 10).map(log => `
        <tr>
          <td style="color:var(--muted)">${new Date(log.created_at).toLocaleString()}</td>
          <td style="font-weight:600">${log.phone_number || 'Unknown'}</td>
          <td><span class="badge ${log.call_direction === 'outbound' ? 'badge-blue' : 'badge-gray'}">${log.call_direction || 'inbound'}</span></td>
          <td>${log.duration_seconds || 0}s</td>
          <td>${badgeFor(log.summary)}</td>
          <td>${log.id ? `<button class="btn btn-ghost btn-sm view-transcript" data-id="${log.id}">Transcript</button>` : ''}</td>
        </tr>`).join('');
      tbody.querySelectorAll('.view-transcript').forEach(btn => {
        btn.addEventListener('click', async () => {
          const text = await getTranscript(btn.dataset.id);
          document.getElementById('transcript-body').textContent = text;
          document.getElementById('transcript-modal').classList.add('open');
        });
      });
    } catch (e) {
      const tbody = document.getElementById('dash-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">Could not load data.</td></tr>';
    }
  };
  await load();
  document.getElementById('refresh-dash')?.addEventListener('click', load);
}
