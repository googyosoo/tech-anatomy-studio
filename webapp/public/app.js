/**
 * Anatomy Studio Frontend Application Logic (Advanced Pro Edition)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State Management
  const state = {
    theme: 'dark',
    viewerTheme: 'dark',
    activeTab: 'showcase',
    viewMode: 'solid', // 'solid' | 'xray' | 'explode'
    zoomLevel: 1.0,
    galleryItems: [],
    selectedShowcase: null,
    concepts: [],
    currentConceptId: 'token-bucket',
    currentFigureData: null,
    tunerParams: {
      azimuth: 42,
      elevation: 30,
      tokens: 6,
      pressure: 2.8,
      blueprintMode: false
    }
  };

  // DOM Elements
  const tabButtons = {
    showcase: document.getElementById('tab-btn-showcase'),
    studio: document.getElementById('tab-btn-studio'),
    tuner: document.getElementById('tab-btn-tuner'),
    export: document.getElementById('tab-btn-export')
  };

  const tabPanes = {
    showcase: document.getElementById('tab-content-showcase'),
    studio: document.getElementById('tab-content-studio'),
    tuner: document.getElementById('tab-content-tuner'),
    export: document.getElementById('tab-content-export')
  };

  // --- Tab Switching ---
  function switchTab(tabId) {
    state.activeTab = tabId;
    Object.keys(tabButtons).forEach(key => {
      const btn = tabButtons[key];
      const pane = tabPanes[key];
      if (key === tabId) {
        btn.classList.add('bg-neutral-800', 'text-white', 'shadow-sm', 'border', 'border-neutral-700/50');
        btn.classList.remove('text-neutral-400');
        pane.classList.remove('hidden');
      } else {
        btn.classList.remove('bg-neutral-800', 'text-white', 'shadow-sm', 'border', 'border-neutral-700/50');
        btn.classList.add('text-neutral-400');
        pane.classList.add('hidden');
      }
    });

    if (window.lucide) window.lucide.createIcons();

    if (tabId === 'tuner' && state.currentFigureData) {
      updateTunerPreview();
    }
  }

  Object.keys(tabButtons).forEach(key => {
    tabButtons[key].addEventListener('click', () => switchTab(key));
  });

  // --- Theme Toggle ---
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    document.documentElement.setAttribute('data-theme', state.theme);

    const sunIcon = themeToggleBtn.querySelector('.light-icon');
    const moonIcon = themeToggleBtn.querySelector('.dark-icon');
    if (state.theme === 'light') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }

    if (state.currentConceptId) {
      loadConceptFigure(state.currentConceptId);
    }
  });

  // --- Showcase Gallery Logic ---
  const showcaseCardsContainer = document.getElementById('showcase-cards');
  const showcaseIframe = document.getElementById('showcase-iframe');
  const activeModelTitle = document.getElementById('active-model-title');
  const activeModelBadge = document.getElementById('active-model-badge');
  const showcaseHint = document.getElementById('showcase-hint');
  const toggleViewerThemeBtn = document.getElementById('btn-toggle-viewer-theme');
  const viewerThemeLabel = document.getElementById('viewer-theme-label');
  const fullscreenViewerBtn = document.getElementById('btn-fullscreen-viewer');

  async function loadGallery() {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (!data.success) return;

      state.galleryItems = data.items;
      renderShowcaseCards(data.items);

      if (data.items.length > 0) {
        selectShowcaseItem(data.items[0]);
      }
    } catch (e) {
      console.error('Failed to load gallery:', e);
      showcaseCardsContainer.innerHTML = `<div class="p-4 text-xs text-rose-400">갤러리 목록을 불러오지 못했습니다.</div>`;
    }
  }

  function renderShowcaseCards(items) {
    showcaseCardsContainer.innerHTML = items.map((item, idx) => `
      <div class="showcase-card cursor-pointer p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800/80 hover:border-cyan-500/40 transition-all ${idx === 0 ? 'border-cyan-500/60 bg-neutral-800/90' : ''}" data-id="${item.id}">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-white">${item.title}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">${item.badge}</span>
        </div>
        <p class="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">${item.description}</p>
        <div class="flex items-center flex-wrap gap-1">
          ${item.tags.map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 font-mono">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');

    showcaseCardsContainer.querySelectorAll('.showcase-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const item = state.galleryItems.find(i => i.id === id);
        if (item) selectShowcaseItem(item);
      });
    });
  }

  function selectShowcaseItem(item) {
    state.selectedShowcase = item;

    showcaseCardsContainer.querySelectorAll('.showcase-card').forEach(card => {
      if (card.getAttribute('data-id') === item.id) {
        card.classList.add('border-cyan-500/60', 'bg-neutral-800/90');
      } else {
        card.classList.remove('border-cyan-500/60', 'bg-neutral-800/90');
      }
    });

    activeModelTitle.textContent = item.title;
    activeModelBadge.textContent = item.badge;
    showcaseHint.textContent = item.description;

    updateIframeSource();
  }

  function updateIframeSource() {
    if (!state.selectedShowcase) return;
    const url = state.viewerTheme === 'light' ? state.selectedShowcase.htmlLight : state.selectedShowcase.htmlDark;
    showcaseIframe.src = url;
    viewerThemeLabel.textContent = state.viewerTheme === 'light' ? 'Dark 버전 보기' : 'Light 버전 보기';
  }

  toggleViewerThemeBtn.addEventListener('click', () => {
    state.viewerTheme = state.viewerTheme === 'light' ? 'dark' : 'light';
    updateIframeSource();
  });

  fullscreenViewerBtn.addEventListener('click', () => {
    if (showcaseIframe.requestFullscreen) {
      showcaseIframe.requestFullscreen();
    }
  });

  // --- Concept Studio Logic ---
  const presetContainer = document.getElementById('preset-buttons-container');
  const customConceptInput = document.getElementById('custom-concept-input');
  const generateConceptBtn = document.getElementById('btn-generate-concept');
  const studioPlateContainer = document.getElementById('studio-plate-container');
  const zoomInnerWrapper = document.getElementById('zoom-inner-wrapper');
  const canvasPartsCount = document.getElementById('canvas-parts-count');
  const conceptMetaphorDesc = document.getElementById('concept-metaphor-desc');
  const codePreviewArea = document.getElementById('code-preview-area');

  // Zoom & View Mode Elements
  const btnModeSolid = document.getElementById('btn-mode-solid');
  const btnModeXray = document.getElementById('btn-mode-xray');
  const btnModeExplode = document.getElementById('btn-mode-explode');
  const btnZoom1x = document.getElementById('btn-zoom-1x');
  const btnZoom2x = document.getElementById('btn-zoom-2x');
  const btnZoom4x = document.getElementById('btn-zoom-4x');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  async function loadConcepts() {
    try {
      const res = await fetch('/api/concepts');
      const data = await res.json();
      if (!data.success) return;

      state.concepts = data.concepts;
      renderConceptPresets(data.concepts);

      if (data.concepts.length > 0) {
        loadConceptFigure(data.concepts[0].id);
      }
    } catch (e) {
      console.error('Failed to load concepts:', e);
    }
  }

  function renderConceptPresets(concepts) {
    presetContainer.innerHTML = concepts.map((c, idx) => `
      <button class="preset-btn p-2 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 hover:border-purple-500/50 text-left transition-all ${idx === 0 ? 'border-purple-500 bg-neutral-800' : ''}" data-id="${c.id}">
        <div class="text-[11px] font-bold text-white truncate">${c.title}</div>
        <div class="text-[9px] text-neutral-400 truncate mt-0.5">${c.cardFig}</div>
      </button>
    `).join('');

    presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('border-purple-500', 'bg-neutral-800'));
        btn.classList.add('border-purple-500', 'bg-neutral-800');
        loadConceptFigure(id);
      });
    });
  }

  async function loadConceptFigure(conceptId, customOpts = {}) {
    state.currentConceptId = conceptId;
    zoomInnerWrapper.innerHTML = `
      <div class="flex items-center space-x-2 text-cyan-400 text-sm animate-pulse py-16">
        <i data-lucide="loader" class="w-5 h-5 animate-spin"></i>
        <span>아이소메트릭 기하학 및 부품 계산 중...</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId,
          options: {
            theme: state.theme,
            azimuth: state.tunerParams.azimuth,
            elevation: state.tunerParams.elevation,
            tokens: state.tunerParams.tokens,
            pressure: state.tunerParams.pressure,
            ...customOpts
          }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error('Generation failed');

      state.currentFigureData = data.result;
      renderFigureResult(data.result);
    } catch (err) {
      console.error(err);
      zoomInnerWrapper.innerHTML = `<div class="p-4 text-xs text-rose-400">생성 실패: ${err.message}</div>`;
    }
  }

  function renderFigureResult(result) {
    const { template, plateHtml, stats } = result;

    zoomInnerWrapper.innerHTML = plateHtml;
    applyViewMode();
    applyZoom();

    if (result.standaloneHtml) {
      const scriptMatch = result.standaloneHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
      if (scriptMatch && scriptMatch[1]) {
        try {
          const fn = new Function(scriptMatch[1]);
          fn();
        } catch (e) {
          console.warn('Script execution notice:', e);
        }
      }
    }

    canvasPartsCount.textContent = `${stats.solidsCount} Solids · ${stats.partsTotal} Total Parts`;
    conceptMetaphorDesc.textContent = template.metaphor;

    updateCodePreview(result);
  }

  // View Mode Control
  function setViewMode(mode) {
    state.viewMode = mode;
    [btnModeSolid, btnModeXray, btnModeExplode].forEach(btn => {
      btn.classList.remove('bg-neutral-800', 'text-white');
      btn.classList.add('text-neutral-400');
    });

    if (mode === 'solid') btnModeSolid.classList.add('bg-neutral-800', 'text-white');
    if (mode === 'xray') btnModeXray.classList.add('bg-neutral-800', 'text-white');
    if (mode === 'explode') btnModeExplode.classList.add('bg-neutral-800', 'text-white');

    applyViewMode();
  }

  function applyViewMode() {
    studioPlateContainer.classList.remove('viewport-xray', 'viewport-exploded');
    if (state.viewMode === 'xray') {
      studioPlateContainer.classList.add('viewport-xray');
    } else if (state.viewMode === 'explode') {
      studioPlateContainer.classList.add('viewport-exploded');
    }
  }

  btnModeSolid.addEventListener('click', () => setViewMode('solid'));
  btnModeXray.addEventListener('click', () => setViewMode('xray'));
  btnModeExplode.addEventListener('click', () => setViewMode('explode'));

  // Zoom Control (Anatomy 4x Critical Zoom)
  function setZoom(level) {
    state.zoomLevel = level;
    [btnZoom1x, btnZoom2x, btnZoom4x].forEach(b => {
      b.classList.remove('bg-neutral-800', 'text-white');
      b.classList.add('text-neutral-400');
    });

    if (level === 1.0) btnZoom1x.classList.add('bg-neutral-800', 'text-white');
    if (level === 2.0) btnZoom2x.classList.add('bg-neutral-800', 'text-white');
    if (level === 4.0) btnZoom4x.classList.add('bg-neutral-800', 'text-white');

    applyZoom();
  }

  function applyZoom() {
    zoomInnerWrapper.style.transform = `scale(${state.zoomLevel})`;
  }

  btnZoom1x.addEventListener('click', () => setZoom(1.0));
  btnZoom2x.addEventListener('click', () => setZoom(2.0));
  btnZoom4x.addEventListener('click', () => setZoom(4.0));
  btnZoomReset.addEventListener('click', () => setZoom(1.0));

  generateConceptBtn.addEventListener('click', () => {
    const query = customConceptInput.value.trim();
    if (!query) {
      showToast('개념이나 알고리즘 이름을 입력해 주세요.');
      return;
    }
    loadConceptFigure('token-bucket', { customPrompt: query });
    showToast(`"${query}" 기계식 일러스트 생성 완료!`);
  });

  // --- Parametric Tuner Logic ---
  const sliderAzimuth = document.getElementById('slider-azimuth');
  const sliderElevation = document.getElementById('slider-elevation');
  const sliderTokens = document.getElementById('slider-tokens');
  const sliderPressure = document.getElementById('slider-pressure');
  const valAzimuth = document.getElementById('val-azimuth');
  const valElevation = document.getElementById('val-elevation');
  const valTokens = document.getElementById('val-tokens');
  const valPressure = document.getElementById('val-pressure');
  const btnToggleBlueprint = document.getElementById('btn-toggle-blueprint-mode');
  const tunerPreviewContainer = document.getElementById('tuner-preview-container');

  let debounceTimer = null;
  function debounceUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadConceptFigure(state.currentConceptId);
    }, 150);
  }

  sliderAzimuth.addEventListener('input', (e) => {
    state.tunerParams.azimuth = Number(e.target.value);
    valAzimuth.textContent = `${state.tunerParams.azimuth}°`;
    debounceUpdate();
  });

  sliderElevation.addEventListener('input', (e) => {
    state.tunerParams.elevation = Number(e.target.value);
    valElevation.textContent = `${state.tunerParams.elevation}°`;
    debounceUpdate();
  });

  sliderTokens.addEventListener('input', (e) => {
    state.tunerParams.tokens = Number(e.target.value);
    valTokens.textContent = `${state.tunerParams.tokens} units`;
    debounceUpdate();
  });

  sliderPressure.addEventListener('input', (e) => {
    state.tunerParams.pressure = Number(e.target.value);
    valPressure.textContent = `${state.tunerParams.pressure} bar`;
    debounceUpdate();
  });

  btnToggleBlueprint.addEventListener('click', () => {
    state.tunerParams.blueprintMode = !state.tunerParams.blueprintMode;
    btnToggleBlueprint.textContent = state.tunerParams.blueprintMode ? '청사진 모드 끄기' : '청사진 모드 켜기';
    btnToggleBlueprint.classList.toggle('bg-cyan-500', state.tunerParams.blueprintMode);
    btnToggleBlueprint.classList.toggle('text-black', state.tunerParams.blueprintMode);

    if (state.tunerParams.blueprintMode) {
      tunerPreviewContainer.classList.add('bg-[#0a192f]', 'border-[#64ffda]');
      tunerPreviewContainer.style.filter = 'drop-shadow(0 0 10px rgba(100,255,218,0.3))';
    } else {
      tunerPreviewContainer.classList.remove('bg-[#0a192f]', 'border-[#64ffda]');
      tunerPreviewContainer.style.filter = '';
    }
  });

  function updateTunerPreview() {
    if (state.currentFigureData) {
      tunerPreviewContainer.innerHTML = state.currentFigureData.plateHtml;
    }
  }

  // --- Export Suite Logic ---
  const btnExportHtml = document.getElementById('btn-export-html');
  const btnExportSvg = document.getElementById('btn-export-svg');
  const btnExportReact = document.getElementById('btn-export-react');
  const btnExportBlueprint = document.getElementById('btn-export-blueprint');
  const btnCopyCodeBlock = document.getElementById('btn-copy-code-block');

  async function triggerExport(format) {
    if (!state.currentFigureData) return;
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: state.currentConceptId,
          format,
          options: {
            theme: state.theme,
            azimuth: state.tunerParams.azimuth,
            elevation: state.tunerParams.elevation,
            tokens: state.tunerParams.tokens,
            pressure: state.tunerParams.pressure
          }
        })
      });

      const text = await res.text();

      if (format === 'react') {
        navigator.clipboard.writeText(text);
        showToast('React TSX 컴포넌트 코드가 클립보드에 복사되었습니다!');
        return;
      }

      const blob = new Blob([text], { type: res.headers.get('content-type') });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.currentConceptId}-${format}.${format === 'svg' ? 'svg' : 'html'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`${format.toUpperCase()} 파일 다운로드가 시작되었습니다.`);
    } catch (e) {
      console.error('Export failed:', e);
      showToast('내보내기에 실패했습니다.');
    }
  }

  btnExportHtml.addEventListener('click', () => triggerExport('html'));
  btnExportSvg.addEventListener('click', () => triggerExport('svg'));
  btnExportReact.addEventListener('click', () => triggerExport('react'));
  btnExportBlueprint.addEventListener('click', () => triggerExport('blueprint'));

  btnCopyCodeBlock.addEventListener('click', () => {
    navigator.clipboard.writeText(codePreviewArea.textContent);
    showToast('코드가 클립보드에 복사되었습니다!');
  });

  async function updateCodePreview(result) {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: result.id,
          format: 'react',
          options: { theme: state.theme }
        })
      });
      const code = await res.text();
      codePreviewArea.textContent = code;
    } catch (e) {
      console.warn('Failed to preview code:', e);
    }
  }

  // Toast Notification
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  let toastTimer = null;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.remove('translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-12', 'opacity-0');
    }, 2800);
  }

  // Start initialization
  loadGallery();
  loadConcepts();
});
