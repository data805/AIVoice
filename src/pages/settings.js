import { showToast } from '../utils.js';
import { getConfig, saveConfig } from '../config.js';

export function renderAgentSettings(config) {
  return `
    <div class="page-header">
      <div class="page-title">Agent Settings</div>
      <div class="page-sub">Configure AI personality, opening line, and sensitivity</div>
    </div>
    <div class="section-card">
      <div class="section-title">Opening Greeting</div>
      <div class="form-group">
        <label>First Line (What the agent says when a call connects)</label>
        <input type="text" id="first_line" value="${(config.first_line || '').replace(/"/g, '&quot;')}" placeholder="Namaste! This is Aryan from RapidX AI...">
        <div class="hint">This is the very first thing the agent says. Keep it concise and warm.</div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-title">System Prompt</div>
      <div class="form-group">
        <label>Master System Prompt</label>
        <textarea id="agent_instructions" rows="16" placeholder="Enter the AI's full personality and instructions...">${config.agent_instructions || ''}</textarea>
        <div class="hint">Date and time context are injected automatically.</div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-title">Listening Sensitivity</div>
      <div class="form-group" style="max-width:220px;">
        <label>Endpointing Delay (seconds)</label>
        <input type="number" id="stt_min_endpointing_delay" step="0.05" min="0.1" max="3.0" value="${config.stt_min_endpointing_delay || 0.6}">
        <div class="hint">Seconds the AI waits after silence before responding.</div>
      </div>
    </div>
    <div class="save-bar">
      <span class="save-status" id="save-status-agent">Saved!</span>
      <button class="btn btn-primary" id="save-agent">Save Agent Settings</button>
    </div>`;
}

export function renderModels(config) {
  const sel = (key, val) => config[key] === val ? 'selected' : '';
  return `
    <div class="page-header">
      <div class="page-title">Models & Voice</div>
      <div class="page-sub">Select the LLM brain and TTS voice persona</div>
    </div>
    <div class="section-card">
      <div class="section-title">Language Model (LLM)</div>
      <div class="form-group" style="max-width:360px;">
        <label>OpenAI Model</label>
        <select id="llm_model">
          <option value="gpt-4o-mini" ${sel('llm_model', 'gpt-4o-mini')}>gpt-4o-mini — Fast & Cheap</option>
          <option value="gpt-4o" ${sel('llm_model', 'gpt-4o')}>gpt-4o — Balanced</option>
          <option value="gpt-4.1" ${sel('llm_model', 'gpt-4.1')}>gpt-4.1 — Latest</option>
          <option value="gpt-4.1-mini" ${sel('llm_model', 'gpt-4.1-mini')}>gpt-4.1-mini — Fast & Latest</option>
        </select>
      </div>
    </div>
    <div class="section-card">
      <div class="section-title">Voice Synthesis (Sarvam bulbul:v3)</div>
      <div class="form-row" style="max-width:720px;">
        <div class="form-group">
          <label>Speaker Voice</label>
          <select id="tts_voice">
            <option value="kavya" ${sel('tts_voice', 'kavya')}>Kavya — Female, Friendly</option>
            <option value="rohan" ${sel('tts_voice', 'rohan')}>Rohan — Male, Balanced</option>
            <option value="priya" ${sel('tts_voice', 'priya')}>Priya — Female, Warm</option>
            <option value="shubh" ${sel('tts_voice', 'shubh')}>Shubh — Male, Formal</option>
            <option value="shreya" ${sel('tts_voice', 'shreya')}>Shreya — Female, Clear</option>
            <option value="ritu" ${sel('tts_voice', 'ritu')}>Ritu — Female, Soft</option>
            <option value="rahul" ${sel('tts_voice', 'rahul')}>Rahul — Male, Deep</option>
            <option value="amit" ${sel('tts_voice', 'amit')}>Amit — Male, Casual</option>
            <option value="neha" ${sel('tts_voice', 'neha')}>Neha — Female, Energetic</option>
            <option value="dev" ${sel('tts_voice', 'dev')}>Dev — Male, Professional</option>
          </select>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="tts_language">
            <option value="hi-IN" ${sel('tts_language', 'hi-IN')}>Hindi (hi-IN)</option>
            <option value="en-IN" ${sel('tts_language', 'en-IN')}>English India (en-IN)</option>
            <option value="ta-IN" ${sel('tts_language', 'ta-IN')}>Tamil (ta-IN)</option>
            <option value="te-IN" ${sel('tts_language', 'te-IN')}>Telugu (te-IN)</option>
            <option value="kn-IN" ${sel('tts_language', 'kn-IN')}>Kannada (kn-IN)</option>
            <option value="ml-IN" ${sel('tts_language', 'ml-IN')}>Malayalam (ml-IN)</option>
            <option value="mr-IN" ${sel('tts_language', 'mr-IN')}>Marathi (mr-IN)</option>
            <option value="gu-IN" ${sel('tts_language', 'gu-IN')}>Gujarati (gu-IN)</option>
            <option value="bn-IN" ${sel('tts_language', 'bn-IN')}>Bengali (bn-IN)</option>
          </select>
        </div>
      </div>
    </div>
    <div class="save-bar">
      <span class="save-status" id="save-status-models">Saved!</span>
      <button class="btn btn-primary" id="save-models">Save Model Settings</button>
    </div>`;
}

export function renderCredentials(config) {
  const v = (key) => (config[key] || '').replace(/"/g, '&quot;');
  return `
    <div class="page-header">
      <div class="page-title">API Credentials</div>
      <div class="page-sub">Credentials saved here are stored in config.json and used by the Python agent.</div>
    </div>
    <div class="section-card">
      <div class="section-title">LiveKit</div>
      <div class="form-row">
        <div class="form-group"><label>LiveKit URL</label><input type="text" id="livekit_url" value="${v('livekit_url')}"></div>
        <div class="form-group"><label>SIP Trunk ID</label><input type="text" id="sip_trunk_id" value="${v('sip_trunk_id')}"></div>
        <div class="form-group"><label>API Key</label><input type="password" id="livekit_api_key" value="${v('livekit_api_key')}"></div>
        <div class="form-group"><label>API Secret</label><input type="password" id="livekit_api_secret" value="${v('livekit_api_secret')}"></div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-title">AI Providers</div>
      <div class="form-row">
        <div class="form-group"><label>OpenAI API Key</label><input type="password" id="openai_api_key" value="${v('openai_api_key')}"></div>
        <div class="form-group"><label>Sarvam API Key</label><input type="password" id="sarvam_api_key" value="${v('sarvam_api_key')}"></div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-title">Integrations</div>
      <div class="form-row">
        <div class="form-group"><label>Cal.com API Key</label><input type="password" id="cal_api_key" value="${v('cal_api_key')}"></div>
        <div class="form-group"><label>Cal.com Event Type ID</label><input type="text" id="cal_event_type_id" value="${v('cal_event_type_id')}"></div>
        <div class="form-group"><label>Telegram Bot Token</label><input type="password" id="telegram_bot_token" value="${v('telegram_bot_token')}"></div>
        <div class="form-group"><label>Telegram Chat ID</label><input type="text" id="telegram_chat_id" value="${v('telegram_chat_id')}"></div>
      </div>
    </div>
    <div class="save-bar">
      <span class="save-status" id="save-status-credentials">Saved!</span>
      <button class="btn btn-primary" id="save-credentials">Save Credentials</button>
    </div>`;
}

export function initAgentSettings() {
  document.getElementById('save-agent')?.addEventListener('click', async () => {
    const payload = {
      first_line: document.getElementById('first_line').value,
      agent_instructions: document.getElementById('agent_instructions').value,
      stt_min_endpointing_delay: parseFloat(document.getElementById('stt_min_endpointing_delay').value),
    };
    await saveConfig(payload);
    const el = document.getElementById('save-status-agent');
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
    showToast('Agent settings saved');
  });
}

export function initModels() {
  document.getElementById('save-models')?.addEventListener('click', async () => {
    const payload = {
      llm_model: document.getElementById('llm_model').value,
      tts_voice: document.getElementById('tts_voice').value,
      tts_language: document.getElementById('tts_language').value,
    };
    await saveConfig(payload);
    const el = document.getElementById('save-status-models');
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
    showToast('Model settings saved');
  });
}

export function initCredentials() {
  document.getElementById('save-credentials')?.addEventListener('click', async () => {
    const get = (id) => document.getElementById(id)?.value || '';
    const payload = {
      livekit_url: get('livekit_url'), sip_trunk_id: get('sip_trunk_id'),
      livekit_api_key: get('livekit_api_key'), livekit_api_secret: get('livekit_api_secret'),
      openai_api_key: get('openai_api_key'), sarvam_api_key: get('sarvam_api_key'),
      cal_api_key: get('cal_api_key'), cal_event_type_id: get('cal_event_type_id'),
      telegram_bot_token: get('telegram_bot_token'), telegram_chat_id: get('telegram_chat_id'),
    };
    await saveConfig(payload);
    const el = document.getElementById('save-status-credentials');
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
    showToast('Credentials saved');
  });
}
