import { getConfig, saveConfig } from '../config.js';
import { showToast } from '../utils.js';

const LANG_PRESETS = {
  hinglish:    { flag: '\u{1F1EE}\u{1F1F3}', label: 'Hinglish',           sub: 'Hindi + English mix',   color: '#2563eb' },
  hindi:       { flag: '\u{1F1EE}\u{1F1F3}', label: 'Hindi',              sub: 'Pure Hindi',             color: '#0ea5e9' },
  english:     { flag: '\u{1F1EC}\u{1F1E7}', label: 'English (India)',     sub: 'Indian English',         color: '#3b82f6' },
  tamil:       { flag: '\u{1F1EE}\u{1F1F3}', label: 'Tamil',              sub: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD', color: '#f59e0b' },
  telugu:      { flag: '\u{1F1EE}\u{1F1F3}', label: 'Telugu',             sub: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41', color: '#10b981' },
  gujarati:    { flag: '\u{1F1EE}\u{1F1F3}', label: 'Gujarati',           sub: '\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0', color: '#ef4444' },
  bengali:     { flag: '\u{1F1EE}\u{1F1F3}', label: 'Bengali',            sub: '\u09AC\u09BE\u0982\u09B2\u09BE', color: '#f97316' },
  marathi:     { flag: '\u{1F1EE}\u{1F1F3}', label: 'Marathi',            sub: '\u092E\u0930\u093E\u0920\u0940', color: '#14b8a6' },
  kannada:     { flag: '\u{1F1EE}\u{1F1F3}', label: 'Kannada',            sub: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1', color: '#06b6d4' },
  malayalam:   { flag: '\u{1F1EE}\u{1F1F3}', label: 'Malayalam',          sub: '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02', color: '#ec4899' },
  multilingual:{ flag: '\u{1F30D}', label: 'Multilingual (Auto)', sub: "Detects caller's language", color: '#22c55e' },
};

const VOICE_MAP = { hinglish:'kavya', hindi:'ritu', english:'dev', tamil:'priya', telugu:'kavya', gujarati:'rohan', bengali:'neha', marathi:'shubh', kannada:'rahul', malayalam:'ritu', multilingual:'kavya' };
const LANG_MAP  = { hinglish:'hi-IN', hindi:'hi-IN', english:'en-IN', tamil:'ta-IN', telugu:'te-IN', gujarati:'gu-IN', bengali:'bn-IN', marathi:'mr-IN', kannada:'kn-IN', malayalam:'ml-IN', multilingual:'hi-IN' };

let currentPreset = 'hinglish';

function renderGrid() {
  const grid = document.getElementById('lang-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(LANG_PRESETS).map(([id, p]) => {
    const isActive = id === currentPreset;
    return `<div class="lang-card${isActive ? ' active' : ''}" data-lang="${id}" style="border-color:${isActive ? p.color : 'var(--border)'};">
      <div style="font-size:28px;margin-bottom:8px;">${p.flag}</div>
      <div style="font-weight:700;font-size:14px;color:${isActive ? p.color : 'var(--text)'}">${p.label}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px;">${p.sub}</div>
      ${isActive ? '<div style="font-size:10px;color:#22c55e;margin-top:6px;font-weight:600;">ACTIVE</div>' : ''}
    </div>`;
  }).join('');
  grid.querySelectorAll('.lang-card').forEach(card => {
    card.addEventListener('click', async () => {
      const id = card.dataset.lang;
      currentPreset = id;
      renderGrid();
      await saveConfig({
        lang_preset: id,
        tts_language: LANG_MAP[id],
        tts_voice: VOICE_MAP[id],
      });
      showToast(`${LANG_PRESETS[id].label} preset activated`);
    });
  });
}

export function renderLanguages() {
  return `
    <div class="page-header">
      <div class="page-title">Language Presets</div>
      <div class="page-sub">One-click language configuration — takes effect on the next call</div>
    </div>
    <div class="section-card">
      <div class="section-title">Select a Language Mode</div>
      <div id="lang-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;"></div>
    </div>
    <div class="section-card">
      <div class="section-title">About Multilingual Mode</div>
      <p style="font-size:13px;color:var(--muted);line-height:1.7;">
        In <strong style="color:var(--text);">Multilingual (Auto)</strong> mode the agent listens to the caller's first message and
        automatically replies in the same language for the rest of the call.<br><br>
        Language changes take effect on the <strong style="color:var(--accent);">next incoming call</strong>.
      </p>
    </div>`;
}

export async function initLanguages() {
  const config = getConfig();
  currentPreset = config.lang_preset || 'hinglish';
  renderGrid();
}
