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
      <div class="section-title">TTS Provider</div>
      <div class="form-row" style="max-width:720px;">
        <div class="form-group">
          <label>TTS Engine</label>
          <select id="tts_provider" onchange="window._onTTSProviderChange(this.value)">
            <option value="sarvam" ${sel('tts_provider', 'sarvam')}>Sarvam bulbul:v3 — Indian Languages</option>
            <option value="elevenlabs" ${sel('tts_provider', 'elevenlabs')}>ElevenLabs — Premium Quality</option>
            <option value="chatterbox" ${sel('tts_provider', 'chatterbox')}>Chatterbox — Self-hosted Open Source</option>
          </select>
          <div class="hint">ElevenLabs recommended for English. Sarvam for Indian languages. Chatterbox requires a self-hosted GPU server.</div>
        </div>
      </div>
    </div>

    <div id="sarvam-voice-panel" style="${['elevenlabs','chatterbox'].includes(config.tts_provider) ? 'display:none' : ''}">
      <div class="section-card">
        <div class="section-title">Sarvam Voice</div>
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
    </div>

    <div id="elevenlabs-panel" style="${config.tts_provider === 'elevenlabs' ? '' : 'display:none'}">
      <div class="section-card">
        <div class="section-title">ElevenLabs Voice</div>
        <div class="form-row" style="max-width:720px;">
          <div class="form-group">
            <label>Model</label>
            <select id="elevenlabs_model">
              <option value="eleven_turbo_v2_5" ${sel('elevenlabs_model', 'eleven_turbo_v2_5')}>Turbo v2.5 — Fastest, low-latency</option>
              <option value="eleven_turbo_v2" ${sel('elevenlabs_model', 'eleven_turbo_v2')}>Turbo v2 — Fast</option>
              <option value="eleven_multilingual_v2" ${sel('elevenlabs_model', 'eleven_multilingual_v2')}>Multilingual v2 — Best quality</option>
              <option value="eleven_flash_v2_5" ${sel('elevenlabs_model', 'eleven_flash_v2_5')}>Flash v2.5 — Ultra-fast</option>
            </select>
            <div class="hint">Turbo v2.5 is recommended for voice agents — lowest latency.</div>
          </div>
          <div class="form-group">
            <label>Voice ID</label>
            <input type="text" id="elevenlabs_voice_id" value="${(config.elevenlabs_voice_id || '21m00Tcm4TlvDq8ikWAM').replace(/"/g, '&quot;')}" placeholder="21m00Tcm4TlvDq8ikWAM">
            <div class="hint">Find voice IDs at elevenlabs.io/voice-library. Default is Rachel.</div>
          </div>
        </div>
        <div class="el-voice-presets">
          <div class="hint" style="margin-bottom:8px;">Popular voice IDs (click to copy):</div>
          <div class="el-preset-grid">
            <button class="el-preset-btn" data-id="21m00Tcm4TlvDq8ikWAM">Rachel — Calm Female</button>
            <button class="el-preset-btn" data-id="AZnzlk1XvdvUeBnXmlld">Domi — Strong Female</button>
            <button class="el-preset-btn" data-id="EXAVITQu4vr4xnSDxMaL">Bella — Warm Female</button>
            <button class="el-preset-btn" data-id="ErXwobaYiN019PkySvjV">Antoni — Professional Male</button>
            <button class="el-preset-btn" data-id="VR6AewLTigWG4xSOukaG">Arnold — Deep Male</button>
            <button class="el-preset-btn" data-id="pNInz6obpgDQGcFmaJgB">Adam — Neutral Male</button>
            <button class="el-preset-btn" data-id="yoZ06aMxZJJ28mfd3POQ">Sam — Casual Male</button>
            <button class="el-preset-btn" data-id="jBpfuIE2acCO8z3wKNLl">Freya — Upbeat Female</button>
          </div>
        </div>
      </div>
    </div>

    <div id="chatterbox-panel" style="${config.tts_provider === 'chatterbox' ? '' : 'display:none'}">
      <div class="section-card">
        <div class="section-title">Chatterbox Settings</div>
        <div class="form-row" style="max-width:720px;">
          <div class="form-group">
            <label>Chatterbox Server URL</label>
            <input type="text" id="chatterbox_server_url" value="${(config.chatterbox_server_url || 'http://localhost:8000').replace(/"/g, '&quot;')}" placeholder="http://your-gpu-server:8000">
            <div class="hint">Your self-hosted Chatterbox inference server address.</div>
          </div>
          <div class="form-group">
            <label>Voice / Reference Clip Name</label>
            <input type="text" id="chatterbox_voice" value="${(config.chatterbox_voice || 'default').replace(/"/g, '&quot;')}" placeholder="default">
            <div class="hint">Voice name configured on your Chatterbox server.</div>
          </div>
          <div class="form-group">
            <label>Emotion Exaggeration (0 – 1)</label>
            <input type="number" id="chatterbox_exaggeration" min="0" max="1" step="0.05" value="${config.chatterbox_exaggeration ?? 0.5}">
            <div class="hint">Higher = more expressive. 0.5 is neutral.</div>
          </div>
          <div class="form-group">
            <label>CFG Weight (0 – 1)</label>
            <input type="number" id="chatterbox_cfg_weight" min="0" max="1" step="0.05" value="${config.chatterbox_cfg_weight ?? 0.5}">
            <div class="hint">Lower values (~0.3) help with fast-paced voices.</div>
          </div>
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
      <div class="section-title">Phone Provider</div>
      <div class="form-group" style="max-width:320px;">
        <label>Telephony Provider</label>
        <select id="phone_provider" onchange="window._onPhoneProviderChange(this.value)">
          <option value="livekit" ${(config.phone_provider || 'livekit') === 'livekit' ? 'selected' : ''}>LiveKit SIP — Native integration</option>
          <option value="twilio" ${config.phone_provider === 'twilio' ? 'selected' : ''}>Twilio — Global PSTN coverage</option>
        </select>
        <div class="hint">LiveKit SIP uses your existing SIP trunk. Twilio provides phone numbers in 100+ countries.</div>
      </div>
    </div>

    <div id="livekit-cred-panel" style="${config.phone_provider === 'twilio' ? 'display:none' : ''}">
      <div class="section-card">
        <div class="section-title">LiveKit</div>
        <div class="form-row">
          <div class="form-group"><label>LiveKit URL</label><input type="text" id="livekit_url" value="${v('livekit_url')}"></div>
          <div class="form-group"><label>API Key</label><input type="password" id="livekit_api_key" value="${v('livekit_api_key')}"></div>
          <div class="form-group"><label>API Secret</label><input type="password" id="livekit_api_secret" value="${v('livekit_api_secret')}"></div>
        </div>
        <div style="margin-top:4px;padding-top:16px;border-top:1px solid var(--border);">
          <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">SIP Trunks</div>
          <div class="form-row">
            <div class="form-group">
              <label>Inbound SIP Trunk ID</label>
              <input type="text" id="sip_trunk_id_inbound" value="${v('sip_trunk_id_inbound') || v('sip_trunk_id')}" placeholder="ST_xxxxxxxx">
              <div class="hint">LiveKit SIP trunk that receives incoming calls to your phone number.</div>
            </div>
            <div class="form-group">
              <label>Outbound SIP Trunk ID</label>
              <input type="text" id="sip_trunk_id_outbound" value="${v('sip_trunk_id_outbound')}" placeholder="ST_xxxxxxxx">
              <div class="hint">LiveKit SIP trunk used to place outbound calls. Can be the same as inbound or a separate trunk.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="twilio-cred-panel" style="${config.phone_provider === 'twilio' ? '' : 'display:none'}">
      <div class="section-card">
        <div class="section-title">Twilio</div>
        <div class="form-row">
          <div class="form-group"><label>Account SID</label><input type="text" id="twilio_account_sid" value="${v('twilio_account_sid')}" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"><div class="hint">Find at console.twilio.com — Dashboard.</div></div>
          <div class="form-group"><label>Auth Token</label><input type="password" id="twilio_auth_token" value="${v('twilio_auth_token')}" placeholder="Your Twilio auth token"><div class="hint">Keep secret. Never share this value.</div></div>
          <div class="form-group"><label>Twilio Phone Number</label><input type="text" id="twilio_phone_number" value="${v('twilio_phone_number')}" placeholder="+1XXXXXXXXXX"><div class="hint">Your Twilio inbound/outbound number with country code.</div></div>
          <div class="form-group"><label>Twilio Webhook Base URL</label><input type="text" id="twilio_webhook_url" value="${v('twilio_webhook_url')}" placeholder="https://your-server.com"><div class="hint">Your agent server URL. Twilio calls this for voice webhooks.</div></div>
        </div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-title">AI Providers</div>
      <div class="form-row">
        <div class="form-group"><label>OpenAI API Key</label><input type="password" id="openai_api_key" value="${v('openai_api_key')}"></div>
        <div class="form-group"><label>ElevenLabs API Key</label><input type="password" id="elevenlabs_api_key" value="${v('elevenlabs_api_key')}"><div class="hint">Required when TTS provider is set to ElevenLabs. Get from elevenlabs.io/api.</div></div>
        <div class="form-group"><label>Sarvam API Key (STT)</label><input type="password" id="sarvam_api_key" value="${v('sarvam_api_key')}"><div class="hint">Used for Indian-language speech recognition (STT). Required unless using Deepgram.</div></div>
        <div class="form-group"><label>Chatterbox Server URL (TTS)</label><input type="text" id="cred_chatterbox_server_url" value="${v('chatterbox_server_url') || 'http://localhost:8000'}"><div class="hint">Your self-hosted Chatterbox GPU server. Only needed if TTS provider is set to Chatterbox.</div></div>
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
  window._onTTSProviderChange = (val) => {
    const sarvamPanel = document.getElementById('sarvam-voice-panel');
    const elPanel = document.getElementById('elevenlabs-panel');
    const cbPanel = document.getElementById('chatterbox-panel');
    if (sarvamPanel) sarvamPanel.style.display = val === 'sarvam' ? '' : 'none';
    if (elPanel) elPanel.style.display = val === 'elevenlabs' ? '' : 'none';
    if (cbPanel) cbPanel.style.display = val === 'chatterbox' ? '' : 'none';
  };

  document.querySelectorAll('.el-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const voiceInput = document.getElementById('elevenlabs_voice_id');
      if (voiceInput) voiceInput.value = btn.dataset.id;
      document.querySelectorAll('.el-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('save-models')?.addEventListener('click', async () => {
    const ttsProvider = document.getElementById('tts_provider')?.value || 'sarvam';
    const payload = {
      llm_model: document.getElementById('llm_model')?.value || 'gpt-4o-mini',
      tts_provider: ttsProvider,
      tts_voice: document.getElementById('tts_voice')?.value || 'kavya',
      tts_language: document.getElementById('tts_language')?.value || 'hi-IN',
      elevenlabs_model: document.getElementById('elevenlabs_model')?.value || 'eleven_turbo_v2_5',
      elevenlabs_voice_id: document.getElementById('elevenlabs_voice_id')?.value || '21m00Tcm4TlvDq8ikWAM',
      chatterbox_server_url: document.getElementById('chatterbox_server_url')?.value || 'http://localhost:8000',
      chatterbox_voice: document.getElementById('chatterbox_voice')?.value || 'default',
      chatterbox_exaggeration: parseFloat(document.getElementById('chatterbox_exaggeration')?.value || '0.5'),
      chatterbox_cfg_weight: parseFloat(document.getElementById('chatterbox_cfg_weight')?.value || '0.5'),
    };
    await saveConfig(payload);
    const el = document.getElementById('save-status-models');
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
    showToast('Model settings saved');
  });
}

export function initCredentials() {
  window._onPhoneProviderChange = (val) => {
    const lkPanel = document.getElementById('livekit-cred-panel');
    const twPanel = document.getElementById('twilio-cred-panel');
    if (lkPanel) lkPanel.style.display = val === 'livekit' ? '' : 'none';
    if (twPanel) twPanel.style.display = val === 'twilio' ? '' : 'none';
  };

  document.getElementById('save-credentials')?.addEventListener('click', async () => {
    const get = (id) => document.getElementById(id)?.value || '';
    const payload = {
      phone_provider: get('phone_provider') || 'livekit',
      livekit_url: get('livekit_url'),
      livekit_api_key: get('livekit_api_key'), livekit_api_secret: get('livekit_api_secret'),
      sip_trunk_id_inbound: get('sip_trunk_id_inbound'), sip_trunk_id_outbound: get('sip_trunk_id_outbound'),
      twilio_account_sid: get('twilio_account_sid'),
      twilio_auth_token: get('twilio_auth_token'),
      twilio_phone_number: get('twilio_phone_number'),
      twilio_webhook_url: get('twilio_webhook_url'),
      openai_api_key: get('openai_api_key'),
      elevenlabs_api_key: get('elevenlabs_api_key'),
      sarvam_api_key: get('sarvam_api_key'),
      chatterbox_server_url: get('cred_chatterbox_server_url'),
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
