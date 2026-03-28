import { fetchContacts } from '../api.js';

export function renderCRM() {
  return `
    <div class="page-header">
      <div class="page-title">CRM Contacts</div>
      <div class="page-sub">Every caller recorded automatically — name, phone, call history</div>
    </div>
    <div class="section-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="section-title" style="margin:0;border:none;padding:0;">All Contacts</div>
        <button class="btn btn-ghost btn-sm" id="refresh-crm">Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Total Calls</th><th>Last Seen</th><th>Status</th></tr></thead>
          <tbody id="crm-tbody"><tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);">Loading contacts...</td></tr></tbody>
        </table>
      </div>
    </div>`;
}

export async function initCRM() {
  const load = async () => {
    const tbody = document.getElementById('crm-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);">Loading...</td></tr>';
    try {
      const contacts = await fetchContacts();
      if (!contacts.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--muted);">No contacts yet. They appear automatically after calls.</td></tr>';
        return;
      }
      tbody.innerHTML = contacts.map(c => `
        <tr>
          <td style="font-weight:600;">${c.caller_name || '<span style="color:var(--muted);font-weight:400;">Unknown</span>'}</td>
          <td style="font-family:monospace;font-size:13px;">${c.phone_number || '—'}</td>
          <td style="text-align:center;"><span class="badge badge-blue">${c.total_calls}</span></td>
          <td style="color:var(--muted);font-size:12px;">${c.last_seen ? new Date(c.last_seen).toLocaleString('en-IN') : '—'}</td>
          <td>${c.is_booked ? '<span class="badge badge-green">Booked</span>' : '<span class="badge badge-gray">No booking</span>'}</td>
        </tr>`).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--red);">Error loading contacts.</td></tr>';
    }
  };
  await load();
  document.getElementById('refresh-crm')?.addEventListener('click', load);
}
