import { TRUSTED_SOURCES } from './data/sources.js';
import { loadAppState, persistAppState, persistApiKey } from './services/storage.js';
import { classifyAndSummarizeStory, fetchLiveHackerNewsStories } from './services/aiEngine.js';
import { renderStoryCard, renderTrustedSourcesList, buildExportMarkdown } from './ui/render.js';

let stories = [];
let savedIds = new Set();
let activeRegion = 'all';
let activePriority = 'all';
let minScore = 0;
let searchQuery = '';
let splitLayout = false;
let geminiApiKey = '';

function showToast(message) {
  const box = document.getElementById('toastBox');
  const text = document.getElementById('toastText');
  text.textContent = message;
  box.classList.remove('hidden');
  box.classList.add('flex');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    box.classList.add('hidden');
    box.classList.remove('flex');
  }, 3200);
}

function getFilteredStories() {
  return stories
    .filter(item => {
      if (activeRegion === 'saved' && !savedIds.has(item.id)) return false;
      if (activeRegion !== 'all' && activeRegion !== 'saved' && item.region !== activeRegion) return false;
      if (activePriority !== 'all' && item.priority !== activePriority) return false;
      if (item.score < minScore) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const hay = `${item.title} ${item.what} ${item.why} ${item.takeaway} ${item.category} ${item.sourceName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'p1' ? -1 : 1;
      return b.score - a.score;
    });
}

function updateCounters() {
  document.getElementById('count-all').textContent = stories.length;
  document.getElementById('count-global').textContent = stories.filter(s => s.region === 'global').length;
  document.getElementById('count-india').textContent = stories.filter(s => s.region === 'india').length;
  document.getElementById('count-tn').textContent = stories.filter(s => s.region === 'tn').length;
  document.getElementById('count-saved').textContent = savedIds.size;

  document.getElementById('statP1Count').textContent = stories.filter(s => s.priority === 'p1').length;
  document.getElementById('statP2Count').textContent = stories.filter(s => s.priority === 'p2').length;
  document.getElementById('statTNCount').textContent = stories.filter(s => s.region === 'tn').length;
  const enabledSources = TRUSTED_SOURCES.filter(s => s.enabled).length;
  document.getElementById('statSourceCount').textContent = `${enabledSources} whitelisted sources active`;
}

function syncTabStyles() {
  document.querySelectorAll('.region-tab').forEach(btn => {
    const reg = btn.getAttribute('data-region');
    btn.className = reg === activeRegion
      ? 'region-tab px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-indigo-600 text-white flex items-center gap-1.5'
      : 'region-tab px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5';
  });

  document.querySelectorAll('.priority-tab').forEach(btn => {
    const prio = btn.getAttribute('data-priority');
    btn.className = prio === activePriority
      ? 'priority-tab px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-white transition flex items-center gap-1'
      : 'priority-tab px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1';
  });
}

function renderFeed() {
  updateCounters();
  const container = document.getElementById('newsContainer');
  const filtered = getFilteredStories();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-900/70 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
        <p class="text-base font-semibold text-slate-200">No stories match your current filters</p>
        <p class="text-xs text-slate-400">Try resetting the search bar, lowering the minimum impact score, or switching region tabs.</p>
        <button id="resetFiltersBtn" type="button" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition">
          Reset Filters
        </button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeRegion = 'all';
        activePriority = 'all';
        minScore = 0;
        searchQuery = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('scoreFilter').value = '0';
        syncTabStyles();
        renderFeed();
      });
    }
    return;
  }

  if (splitLayout && activeRegion === 'all') {
    const tnList = filtered.filter(s => s.region === 'tn');
    const inList = filtered.filter(s => s.region === 'india');
    const glList = filtered.filter(s => s.region === 'global');

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="space-y-4">
          <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-300">Tamil Nadu (State)</span>
            <span class="text-xs font-semibold text-emerald-300">${tnList.length} stories</span>
          </div>
          ${tnList.map(item => renderStoryCard(item, savedIds)).join('')}
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-300">India (National)</span>
            <span class="text-xs font-semibold text-amber-300">${inList.length} stories</span>
          </div>
          ${inList.map(item => renderStoryCard(item, savedIds)).join('')}
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <span class="text-xs font-bold uppercase tracking-wider text-sky-300">Global &amp; Frontier Tech</span>
            <span class="text-xs font-semibold text-sky-300">${glList.length} stories</span>
          </div>
          ${glList.map(item => renderStoryCard(item, savedIds)).join('')}
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        ${filtered.map(item => renderStoryCard(item, savedIds)).join('')}
      </div>
    `;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function handleLiveFeedSync() {
  const btn = document.getElementById('syncLiveBtn');
  const label = document.getElementById('syncBtnLabel');
  const statusEl = document.getElementById('statSyncStatus');
  btn.disabled = true;
  label.textContent = 'Syncing...';

  try {
    const newCards = await fetchLiveHackerNewsStories(stories);
    if (newCards.length > 0) {
      stories.unshift(...newCards);
      persistAppState(stories, savedIds);
      renderFeed();
    }
    statusEl.textContent = `Synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    showToast(newCards.length > 0 ? `Pulled ${newCards.length} live tech stories into your briefing` : 'Feeds are already up to date');
  } catch (err) {
    statusEl.textContent = 'Verified Curated Mode';
    showToast('Using verified Oct 2026 baseline feed');
  } finally {
    btn.disabled = false;
    label.textContent = 'Sync Live Feeds';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const state = loadAppState();
  stories = state.stories;
  savedIds = state.savedIds;
  geminiApiKey = state.geminiApiKey;
  renderFeed();

  document.getElementById('regionTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.region-tab');
    if (!btn) return;
    activeRegion = btn.getAttribute('data-region');
    syncTabStyles();
    renderFeed();
  });

  document.getElementById('priorityTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.priority-tab');
    if (!btn) return;
    activePriority = btn.getAttribute('data-priority');
    syncTabStyles();
    renderFeed();
  });

  document.getElementById('scoreFilter').addEventListener('change', (e) => {
    minScore = parseFloat(e.target.value) || 0;
    renderFeed();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFeed();
  });

  document.getElementById('toggleLayoutBtn').addEventListener('click', () => {
    splitLayout = !splitLayout;
    if (splitLayout && activeRegion !== 'all') {
      activeRegion = 'all';
      syncTabStyles();
    }
    document.getElementById('layoutModeLabel').textContent = splitLayout ? 'Unified Grid' : '3-Column Split';
    renderFeed();
  });

  document.getElementById('newsContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('.bookmark-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-bookmark');
    if (savedIds.has(id)) {
      savedIds.delete(id);
      showToast('Removed from Saved Briefings');
    } else {
      savedIds.add(id);
      showToast('Saved story to your personal briefing');
    }
    persistAppState(stories, savedIds);
    renderFeed();
  });

  document.getElementById('syncLiveBtn').addEventListener('click', handleLiveFeedSync);

  // Analyze Modal
  const analyzeModal = document.getElementById('analyzeModal');
  document.getElementById('openAnalyzeBtn').addEventListener('click', () => {
    analyzeModal.classList.remove('hidden');
    analyzeModal.classList.add('flex');
  });
  document.getElementById('closeAnalyzeBtn').addEventListener('click', () => {
    analyzeModal.classList.add('hidden');
    analyzeModal.classList.remove('flex');
  });
  document.getElementById('fillSampleBtn').addEventListener('click', () => {
    document.getElementById('customTitle').value = 'TIDEL Park & IIT Madras Partner on Edge-AI Semiconductor Lab in Chennai';
    document.getElementById('customRegion').value = 'tn';
    document.getElementById('customSource').value = 'The Hindu';
    document.getElementById('customUrl').value = 'https://www.thehindu.com/news/national/tamil-nadu/';
    document.getElementById('customBody').value = 'A new collaborative Edge-AI and VLSI testing facility in Chennai will give Tamil Nadu hardware startups shared access to high-speed chip verification equipment and prototyping grants.';
  });
  document.getElementById('runAnalyzeBtn').addEventListener('click', () => {
    const title = document.getElementById('customTitle').value.trim();
    const body = document.getElementById('customBody').value.trim();
    const regionHint = document.getElementById('customRegion').value;
    const sourceName = document.getElementById('customSource').value.trim() || 'Custom Briefing';
    const sourceUrl = document.getElementById('customUrl').value.trim() || 'https://www.investingintamilnadu.com';

    if (!title) {
      showToast('Please enter a headline first');
      return;
    }

    const newCard = classifyAndSummarizeStory(title, body, regionHint, sourceName, sourceUrl);
    stories.unshift(newCard);
    persistAppState(stories, savedIds);
    renderFeed();
    analyzeModal.classList.add('hidden');
    analyzeModal.classList.remove('flex');
    document.getElementById('customTitle').value = '';
    document.getElementById('customBody').value = '';
    showToast('AI summary card generated and added to top of feed');
  });

  // Sources & AI Config Modal
  const sourcesModal = document.getElementById('sourcesModal');
  document.getElementById('openSourcesBtn').addEventListener('click', () => {
    document.getElementById('geminiKeyInput').value = geminiApiKey;
    document.getElementById('trustedSourcesList').innerHTML = renderTrustedSourcesList(TRUSTED_SOURCES);
    if (window.lucide) window.lucide.createIcons();
    sourcesModal.classList.remove('hidden');
    sourcesModal.classList.add('flex');
  });
  document.getElementById('closeSourcesBtn').addEventListener('click', () => {
    sourcesModal.classList.add('hidden');
    sourcesModal.classList.remove('flex');
  });
  document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
    geminiApiKey = document.getElementById('geminiKeyInput').value.trim();
    persistApiKey(geminiApiKey);
    showToast(geminiApiKey ? 'Gemini API key saved locally' : 'Cleared Gemini API key');
  });
  document.getElementById('trustedSourcesList').addEventListener('change', (e) => {
    const toggle = e.target.closest('.source-toggle');
    if (!toggle) return;
    const idx = parseInt(toggle.getAttribute('data-source-idx'), 10);
    if (TRUSTED_SOURCES[idx]) {
      TRUSTED_SOURCES[idx].enabled = toggle.checked;
      updateCounters();
    }
  });

  // Export Briefing Modal
  const exportModal = document.getElementById('exportModal');
  document.getElementById('exportDigestBtn').addEventListener('click', () => {
    document.getElementById('exportTextarea').value = buildExportMarkdown(getFilteredStories(), activeRegion, activePriority);
    exportModal.classList.remove('hidden');
    exportModal.classList.add('flex');
  });
  document.getElementById('closeExportBtn').addEventListener('click', () => {
    exportModal.classList.add('hidden');
    exportModal.classList.remove('flex');
  });
  document.getElementById('copyBriefingBtn').addEventListener('click', () => {
    const textarea = document.getElementById('exportTextarea');
    textarea.select();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value);
      } else {
        document.execCommand('copy');
      }
    } catch (e) {
      document.execCommand('copy');
    }
    showToast('Briefing copied to clipboard');
  });
  document.getElementById('downloadBriefingBtn').addEventListener('click', () => {
    const md = buildExportMarkdown(getFilteredStories(), activeRegion, activePriority);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulseai-daily-briefing-2026-10-16.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded briefing (.md)');
  });
});
