import { loadConfig, initConfigFromStorage } from './config.js';
import { renderDashboard, initDashboard } from './pages/dashboard.js';
import { renderCalendar, initCalendar } from './pages/calendar.js';
import { renderLogs, initLogs } from './pages/logs.js';
import { renderCRM, initCRM } from './pages/crm.js';
import { renderOutbound, initOutbound } from './pages/outbound.js';
import { renderLanguages, initLanguages } from './pages/languages.js';
import {
  renderAgentSettings, renderModels, renderCredentials,
  initAgentSettings, initModels, initCredentials,
} from './pages/settings.js';

const mainEl = document.getElementById('main');
let currentPage = 'dashboard';
let config = {};

const pageRenderers = {
  dashboard:   () => renderDashboard(),
  calendar:    () => renderCalendar(),
  agent:       () => renderAgentSettings(config),
  models:      () => renderModels(config),
  credentials: () => renderCredentials(config),
  logs:        () => renderLogs(),
  crm:         () => renderCRM(),
  outbound:    () => renderOutbound(),
  languages:   () => renderLanguages(),
};

const pageInitializers = {
  dashboard:   initDashboard,
  calendar:    initCalendar,
  agent:       initAgentSettings,
  models:      initModels,
  credentials: initCredentials,
  logs:        initLogs,
  crm:         initCRM,
  outbound:    initOutbound,
  languages:   initLanguages,
};

async function navigateTo(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  const renderer = pageRenderers[pageId];
  if (renderer) {
    mainEl.innerHTML = renderer();
    const initializer = pageInitializers[pageId];
    if (initializer) await initializer();
  }
}

function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });
}

function setupModals() {
  document.getElementById('close-day-modal')?.addEventListener('click', () => {
    document.getElementById('day-modal').classList.remove('open');
  });
  document.getElementById('day-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('day-modal')) {
      document.getElementById('day-modal').classList.remove('open');
    }
  });
  document.getElementById('close-transcript-modal')?.addEventListener('click', () => {
    document.getElementById('transcript-modal').classList.remove('open');
  });
  document.getElementById('transcript-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('transcript-modal')) {
      document.getElementById('transcript-modal').classList.remove('open');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('day-modal')?.classList.remove('open');
      document.getElementById('transcript-modal')?.classList.remove('open');
    }
  });
}

async function boot() {
  config = await loadConfig();
  initConfigFromStorage();
  setupNavigation();
  setupModals();
  await navigateTo('dashboard');
}

boot();
