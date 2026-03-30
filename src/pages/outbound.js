import { createCampaign, fetchCampaigns, fetchCampaignDetail, dispatchCampaignCall } from '../api.js';
import { showToast } from '../utils.js';
import { getConfig } from '../config.js';

export function renderOutbound() {
  const config = getConfig();
  const agentPhone = config.agent_phone_number || '';
  const sipTrunkOutbound = config.sip_trunk_id_outbound || config.sip_trunk_id_inbound || '';
  const missingSetup = !agentPhone || !sipTrunkOutbound;

  return `
    <div class="page-header">
      <div class="page-title">Outbound Calls</div>
      <div class="page-sub">Create and manage outbound call campaigns tracked in Supabase</div>
    </div>

    ${missingSetup ? `
    <div class="section-card" style="border-left:3px solid var(--yellow);">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:16px;color:var(--yellow);">&#9888;</span>
        <div>
          <div style="font-weight:600;margin-bottom:4px;">Setup required before launching campaigns</div>
          <div style="font-size:13px;color:var(--muted);">Go to <strong>API Credentials</strong> and set the <strong>Agent Phone Number</strong> and <strong>Outbound SIP Trunk ID</strong> under the LiveKit section.</div>
        </div>
      </div>
    </div>` : ''}

    <div class="section-card">
      <div class="section-title">Create Campaign</div>
      <div class="form-group">
        <label>Campaign Name</label>
        <input type="text" id="campaign-name" placeholder="e.g. March Follow-Up Calls">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone Numbers (one per line)</label>
          <textarea id="campaign-nums" rows="5" placeholder="+91XXXXXXXXXX&#10;+91YYYYYYYYYY"></textarea>
          <div class="hint">Each line must start with + and country code</div>
        </div>
        <div>
          <div class="form-group">
            <label>Agent Phone Number (Caller ID)</label>
            <input type="text" id="campaign-agent-phone" value="${agentPhone}" placeholder="+91XXXXXXXXXX">
            <div class="hint">The number shown as caller ID when dialling out. Set once in API Credentials to pre-fill.</div>
          </div>
          <div class="form-group">
            <label>Custom Opening Line (optional)</label>
            <input type="text" id="campaign-first-line" placeholder="Leave blank for default">
          </div>
          <div class="form-group">
            <label>Custom Instructions (optional)</label>
            <textarea id="campaign-instructions" rows="3" placeholder="Override the default agent prompt for this campaign"></textarea>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" id="create-campaign-btn">Launch Campaign</button>
      <div id="campaign-create-status" style="margin-top:12px;font-size:13px;"></div>
    </div>

    <div class="section-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="section-title" style="margin:0;border:none;padding:0;">Campaign History</div>
        <button class="btn btn-ghost btn-sm" id="refresh-campaigns">Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Total</th><th>Completed</th><th>Booked</th><th>Caller ID</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody id="campaigns-tbody">
            <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted);">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section-card" id="campaign-detail-card" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="section-title" style="margin:0;border:none;padding:0;" id="campaign-detail-title">Campaign Detail</div>
        <button class="btn btn-ghost btn-sm" id="close-campaign-detail">Close</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Phone</th><th>Status</th><th>Duration</th><th>Booked</th><th>Sentiment</th></tr></thead>
          <tbody id="campaign-detail-tbody"></tbody>
        </table>
      </div>
    </div>`;
}

async function loadCampaigns() {
  const tbody = document.getElementById('campaigns-tbody');
  try {
    const campaigns = await fetchCampaigns();
    if (!campaigns.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted);">No campaigns yet. Create one above.</td></tr>';
      return;
    }
    const statusBadges = {
      draft: '<span class="badge badge-gray">Draft</span>',
      active: '<span class="badge badge-yellow">Active</span>',
      paused: '<span class="badge badge-gray">Paused</span>',
      completed: '<span class="badge badge-green">Completed</span>',
    };
    tbody.innerHTML = campaigns.map(c => `<tr>
      <td style="font-weight:600;">${c.name || 'Untitled'}</td>
      <td>${statusBadges[c.status] || `<span class="badge badge-gray">${c.status}</span>`}</td>
      <td>${c.total_numbers || 0}</td>
      <td>${c.calls_completed || 0}</td>
      <td>${c.calls_booked || 0}</td>
      <td style="font-family:monospace;font-size:12px;color:var(--muted);">${c.agent_phone_number || '—'}</td>
      <td style="color:var(--muted);font-size:12px;">${c.created_at ? new Date(c.created_at).toLocaleString() : ''}</td>
      <td><button class="btn btn-ghost btn-sm view-campaign" data-id="${c.id}">View</button></td>
    </tr>`).join('');
    tbody.querySelectorAll('.view-campaign').forEach(btn => {
      btn.addEventListener('click', () => viewCampaign(btn.dataset.id));
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--red);">Error loading campaigns</td></tr>';
  }
}

async function viewCampaign(id) {
  const card = document.getElementById('campaign-detail-card');
  const tbody = document.getElementById('campaign-detail-tbody');
  card.style.display = 'block';
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">Loading...</td></tr>';
  try {
    const data = await fetchCampaignDetail(id);
    if (data.campaign) {
      document.getElementById('campaign-detail-title').textContent = data.campaign.name || 'Campaign Detail';
    }
    const results = data.results;
    if (!results.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No call results yet</td></tr>';
      return;
    }
    const sBadges = {
      pending: '<span class="badge badge-gray">Pending</span>',
      dispatched: '<span class="badge badge-yellow">Dispatched</span>',
      connected: '<span class="badge badge-yellow">Connected</span>',
      completed: '<span class="badge badge-green">Completed</span>',
      failed: '<span class="badge badge-red">Failed</span>',
    };
    tbody.innerHTML = results.map(r => `<tr>
      <td style="font-family:monospace;">${r.phone_number}</td>
      <td>${sBadges[r.status] || `<span class="badge badge-gray">${r.status}</span>`}</td>
      <td>${r.duration_seconds || '—'}s</td>
      <td>${r.was_booked ? '<span class="badge badge-green">Yes</span>' : '<span class="badge badge-gray">No</span>'}</td>
      <td style="color:var(--muted);">${r.sentiment || '—'}</td>
    </tr>`).join('');
    card.scrollIntoView({ behavior: 'smooth' });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--red);">Error loading campaign</td></tr>';
  }
}

async function dispatchAllCalls(campaign, results) {
  const config = getConfig();
  const sipTrunkId = config.sip_trunk_id_outbound || config.sip_trunk_id_inbound || '';
  const agentPhone = campaign.agent_phone_number || config.agent_phone_number || '';
  if (!sipTrunkId || !agentPhone) {
    return { dispatched: 0, failed: 0, error: 'Missing agent phone number or outbound SIP trunk' };
  }
  let dispatched = 0;
  let failed = 0;
  for (const result of results) {
    try {
      await dispatchCampaignCall(campaign.id, result.id, result.phone_number, agentPhone, sipTrunkId);
      dispatched++;
    } catch {
      failed++;
    }
  }
  return { dispatched, failed };
}

export async function initOutbound() {
  await loadCampaigns();

  document.getElementById('refresh-campaigns')?.addEventListener('click', loadCampaigns);
  document.getElementById('close-campaign-detail')?.addEventListener('click', () => {
    document.getElementById('campaign-detail-card').style.display = 'none';
  });

  document.getElementById('create-campaign-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('campaign-name').value.trim();
    const nums = document.getElementById('campaign-nums').value.trim();
    const firstLine = document.getElementById('campaign-first-line').value.trim();
    const instructions = document.getElementById('campaign-instructions').value.trim();
    const agentPhoneNumber = document.getElementById('campaign-agent-phone').value.trim();
    const el = document.getElementById('campaign-create-status');

    if (!nums) { el.textContent = 'Enter at least one phone number'; el.style.color = 'var(--red)'; return; }
    if (!agentPhoneNumber) { el.textContent = 'Agent phone number is required'; el.style.color = 'var(--red)'; return; }

    el.textContent = 'Creating campaign...';
    el.style.color = 'var(--muted)';

    try {
      const campaign = await createCampaign({ name, numbers: nums, firstLine, instructions, agentPhoneNumber });

      el.textContent = `Campaign "${campaign.name}" created with ${campaign.total_numbers} numbers. Dispatching calls...`;
      el.style.color = 'var(--muted)';

      const { results } = await fetchCampaignDetail(campaign.id);
      const { dispatched, failed, error } = await dispatchAllCalls(campaign, results || []);

      if (error) {
        el.textContent = `Campaign created — dispatch skipped: ${error}`;
        el.style.color = 'var(--yellow)';
        showToast('Campaign created — configure credentials to dispatch calls');
      } else {
        el.textContent = `Launched: ${dispatched} call${dispatched !== 1 ? 's' : ''} dispatched${failed > 0 ? `, ${failed} failed` : ''}.`;
        el.style.color = dispatched > 0 ? 'var(--green)' : 'var(--red)';
        showToast(`${dispatched} call${dispatched !== 1 ? 's' : ''} dispatched`);
      }

      document.getElementById('campaign-name').value = '';
      document.getElementById('campaign-nums').value = '';
      document.getElementById('campaign-first-line').value = '';
      document.getElementById('campaign-instructions').value = '';
      await loadCampaigns();
    } catch (e) {
      el.textContent = 'Failed: ' + e.message;
      el.style.color = 'var(--red)';
    }
  });
}
