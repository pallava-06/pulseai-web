/**
 * UI Presentation & DOM Rendering Module.
 */
export function getRegionBadge(region) {
  if (region === 'tn') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Tamil Nadu</span>`;
  }
  if (region === 'india') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">India</span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">Global</span>`;
}

export function getPriorityBadge(priority) {
  if (priority === 'p1') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">P1 • Tech &amp; AI</span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">P2 • Infra, Econ &amp; Policy</span>`;
}

export function renderStoryCard(item, savedIds) {
  const isSaved = savedIds.has(item.id);
  const scoreColor = item.score >= 9.2
    ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
    : 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30';

  return `
    <article class="bg-slate-900/95 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition shadow-sm hover:shadow-xl hover:shadow-indigo-950/20">
      <div>
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex flex-wrap items-center gap-1.5">
            ${getRegionBadge(item.region)}
            ${getPriorityBadge(item.priority)}
            <span class="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800">${item.category}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-md text-[11px] font-bold border ${scoreColor}" title="AI Impact Score">
              ⚡ ${item.score.toFixed(1)}
            </span>
            <button
              type="button"
              data-bookmark="${item.id}"
              class="bookmark-btn p-1.5 rounded-lg border ${isSaved ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'} transition"
              title="${isSaved ? 'Remove from Saved' : 'Save Story'}"
            >
              <i data-lucide="bookmark" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <h3 class="text-sm sm:text-base font-bold text-white leading-snug mb-3.5">
          <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-indigo-300 transition">
            ${item.title}
          </a>
        </h3>

        <div class="space-y-2.5 text-xs sm:text-[13px] leading-relaxed bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/80">
          <div class="flex items-start gap-2">
            <span class="shrink-0 uppercase tracking-wider font-bold text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 mt-0.5">What</span>
            <p class="text-slate-200">${item.what}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="shrink-0 uppercase tracking-wider font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 mt-0.5">Why</span>
            <p class="text-slate-300">${item.why}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="shrink-0 uppercase tracking-wider font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mt-0.5">Takeaway</span>
            <p class="text-emerald-200/90 font-medium">${item.takeaway}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 pt-3.5 mt-4 border-t border-slate-800/70 text-xs text-slate-400">
        <div class="flex items-center gap-2 truncate">
          <span class="font-semibold text-slate-300 truncate">${item.sourceName}</span>
          <span>•</span>
          <span>${item.date}</span>
        </div>
        <a
          href="${item.sourceUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          <span>Read Source</span>
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
        </a>
      </div>
    </article>
  `;
}

export function renderTrustedSourcesList(sources) {
  return sources.map((src, idx) => `
    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
      <div class="pr-2">
        <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-white hover:text-indigo-300 transition flex items-center gap-1">
          <span>${src.name}</span>
          <i data-lucide="external-link" class="w-3 h-3 text-slate-500"></i>
        </a>
        <p class="text-[11px] text-slate-400 mt-0.5">${src.region} • ${src.tier}</p>
      </div>
      <input type="checkbox" data-source-idx="${idx}" class="source-toggle w-4 h-4 accent-indigo-600 rounded cursor-pointer" ${src.enabled ? 'checked' : ''} />
    </div>
  `).join('');
}

export function buildExportMarkdown(filteredStories, activeRegion, activePriority) {
  const lines = [
    `# PulseAI Daily Executive Briefing (Oct 16, 2026)`,
    `Filter: Region=${activeRegion.toUpperCase()} | Priority=${activePriority.toUpperCase()} | Stories=${filteredStories.length}`,
    ``
  ];
  filteredStories.forEach((s, idx) => {
    lines.push(`## ${idx + 1}. [${s.region.toUpperCase()} | ${s.priority.toUpperCase()} | ⚡ ${s.score.toFixed(1)}] ${s.title}`);
    lines.push(`- **What:** ${s.what}`);
    lines.push(`- **Why:** ${s.why}`);
    lines.push(`- **Takeaway:** ${s.takeaway}`);
    lines.push(`- **Source:** ${s.sourceName} (${s.date}) — ${s.sourceUrl}`);
    lines.push(``);
  });
  return lines.join('\n');
}
