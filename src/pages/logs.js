import { fetchCallLogs, getTranscript } from '../api.js';

function badgeFor(summary) {
  if (!summary) return '<span class="badge badge-gray">Ended</span>';
  if (summary.toLowerCase().includes('confirm')) return '<span class="badge badge-green">Booked</span>';
  if (summary.toLowerCase().includes('cancel')) return '<span class="badge badge-yellow">Cancelled</span>';
  return '<span class="badge badge-gray">Completed</span>';
}

export function renderLogs() {
  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="page-title">Call Logs</div>
          <div class="page-sub">Full history of all calls and transcripts</div>
        </div>
        <button class="btn btn-ghost" id="refresh-logs">Refresh</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Date & Time</th><th>Phone</th><th>Direction</th><th>Duration</th><th>Status</th><th>Summary</th><th>Actions</th></tr>
        </thead>
        <tbody id="logs-table-body"><tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted);">Loading...</td></tr></tbody>
      </table>
    </div>`;
}

export async function initLogs() {
  const load = async () => {
    const tbody = document.getElementById('logs-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">Loading...</td></tr>';
    try {
      const logs = await fetchCallLogs();
      if (!logs.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);">No call logs found.</td></tr>';
        return;
      }
      tbody.innerHTML = logs.map(log => `
        <tr>
          <td style="color:var(--muted);white-space:nowrap">${new Date(log.created_at).toLocaleString()}</td>
          <td style="font-weight:600">${log.phone_number || 'Unknown'}</td>
          <td><span class="badge ${log.call_direction === 'outbound' ? 'badge-blue' : 'badge-gray'}">${log.call_direction || 'inbound'}</span></td>
          <td>${log.duration_seconds || 0}s</td>
          <td>${badgeFor(log.summary)}</td>
          <td style="color:var(--muted);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${log.summary || ''}">${log.summary || '—'}</td>
          <td>${log.id ? `<button class="btn btn-ghost btn-sm view-transcript" data-id="${log.id}">Transcript</button>` : '—'}</td>
        </tr>`).join('');
      tbody.querySelectorAll('.view-transcript').forEach(btn => {
        btn.addEventListener('click', async () => {
          const text = await getTranscript(btn.dataset.id);
          document.getElementById('transcript-body').textContent = text;
          document.getElementById('transcript-modal').classList.add('open');
        });
      });
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--red);">Error loading logs.</td></tr>';
    }
  };
  await load();
  document.getElementById('refresh-logs')?.addEventListener('click', load);
}
