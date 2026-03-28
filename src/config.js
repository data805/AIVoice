let _config = {};

export async function loadConfig() {
  try {
    const res = await fetch('/config.json');
    if (res.ok) {
      _config = await res.json();
    }
  } catch {
    _config = {};
  }
  return _config;
}

export function getConfig() {
  return { ..._config };
}

export async function saveConfig(updates) {
  Object.assign(_config, updates);
  try {
    const body = JSON.stringify(_config, null, 4);
    const blob = new Blob([body], { type: 'application/json' });
    const stored = JSON.parse(localStorage.getItem('agent_config') || '{}');
    Object.assign(stored, updates);
    localStorage.setItem('agent_config', JSON.stringify(stored));
  } catch {
    // localStorage fallback
  }
  Object.assign(_config, updates);
}

export function initConfigFromStorage() {
  try {
    const stored = JSON.parse(localStorage.getItem('agent_config') || '{}');
    Object.assign(_config, stored);
  } catch {
    // no-op
  }
}
