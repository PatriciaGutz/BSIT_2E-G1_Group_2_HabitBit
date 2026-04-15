/**
 * habitViewControls.js — HabitBit Profile Page
 * Handles: View Toggle (Grid/List), Filter (Completed/In-Progress), Sort
 * 
 * Designed to integrate cleanly with existing main.js
 * Exposes: HabitViewControls (singleton)
 */

const HabitViewControls = (() => {
  /* ================================================================
     STATE
  ================================================================ */
  const state = {
    currentView: 'grid',   // 'grid' | 'list'
    activeFilter: 'all',   // 'all' | 'completed' | 'in-progress'
    activeSort: 'default', // 'default' | 'alpha' | 'most-completed'
    animating: false,
  };

  /* ================================================================
     DOM REFS (resolved lazily after DOMContentLoaded)
  ================================================================ */
  let els = {};

  function resolveEls() {
    els = {
      habitList:      document.getElementById('habit-list'),
      viewGridBtn:    document.getElementById('viewGridBtn'),
      viewListBtn:    document.getElementById('viewListBtn'),
      filterBtn:      document.getElementById('filterBtn'),
      filterDropdown: document.getElementById('filterDropdown'),
      sortBtn:        document.getElementById('sortBtn'),
      sortDropdown:   document.getElementById('sortDropdown'),
      filterBadge:    document.getElementById('filterBadge'),
      controlsBar:    document.getElementById('habitControlsBar'),
    };
  }

  /* ================================================================
     VIEW TOGGLE
  ================================================================ */
  function setView(view) {
    if (state.currentView === view || state.animating) return;
    state.currentView = view;
    _persistState();

    // Update button active states
    els.viewGridBtn?.classList.toggle('hvc-btn--active', view === 'grid');
    els.viewListBtn?.classList.toggle('hvc-btn--active', view === 'list');

    // Re-render with animation
    _animatedRender();
  }

  /* ================================================================
     FILTER
  ================================================================ */
  function setFilter(filter) {
    state.activeFilter = filter;
    _persistState();

    // Update badge visibility
    const badge = els.filterBadge;
    if (badge) {
      badge.style.display = filter === 'all' ? 'none' : 'flex';
      badge.textContent = filter === 'completed' ? '✓' : '…';
    }

    // Update dropdown item active states
    document.querySelectorAll('[data-filter]').forEach(el => {
      el.classList.toggle('hvc-dropdown__item--active', el.dataset.filter === filter);
    });

    closeAllDropdowns();
    _animatedRender();
  }

  /* ================================================================
     SORT
  ================================================================ */
  function setSort(sort) {
    state.activeSort = sort;
    _persistState();

    // Update sort button label
    const labels = {
      default:        'Sort',
      alpha:          'A–Z',
      'most-completed': 'Most',
    };
    const sortLabel = document.getElementById('sortLabel');
    if (sortLabel) sortLabel.textContent = labels[sort] || 'Sort';

    // Update dropdown item active states
    document.querySelectorAll('[data-sort]').forEach(el => {
      el.classList.toggle('hvc-dropdown__item--active', el.dataset.sort === sort);
    });

    closeAllDropdowns();
    _animatedRender();
  }

  /* ================================================================
     DROPDOWN TOGGLE
  ================================================================ */
  function toggleFilterDropdown(e) {
    e.stopPropagation();
    const isOpen = els.filterDropdown?.classList.contains('hvc-dropdown--open');
    closeAllDropdowns();
    if (!isOpen) els.filterDropdown?.classList.add('hvc-dropdown--open');
  }

  function toggleSortDropdown(e) {
    e.stopPropagation();
    const isOpen = els.sortDropdown?.classList.contains('hvc-dropdown--open');
    closeAllDropdowns();
    if (!isOpen) els.sortDropdown?.classList.add('hvc-dropdown--open');
  }

  function closeAllDropdowns() {
    els.filterDropdown?.classList.remove('hvc-dropdown--open');
    els.sortDropdown?.classList.remove('hvc-dropdown--open');
  }

  /* ================================================================
     CORE: APPLY FILTER + SORT TO HABITS ARRAY
  ================================================================ */
  function getProcessedHabits(habits) {
    if (!habits || !Array.isArray(habits)) return [];

    // 1. Filter
    let filtered = habits.filter(h => {
      if (state.activeFilter === 'completed')   return !!h.done || !!h.is_done;
      if (state.activeFilter === 'in-progress') return !h.done && !h.is_done;
      return true;
    });

    // 2. Sort
    if (state.activeSort === 'alpha') {
      filtered = [...filtered].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      );
    } else if (state.activeSort === 'most-completed') {
      filtered = [...filtered].sort((a, b) =>
        (b.completion_count || 0) - (a.completion_count || 0)
      );
    } else if (state.activeSort === 'default') {
      // Keep original order (or sort by recently completed first)
      filtered = [...filtered].sort((a, b) => {
        const aDone = !!(a.done || a.is_done);
        const bDone = !!(b.done || b.is_done);
        if (aDone !== bDone) return aDone ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }

  /* ================================================================
     RENDER GRID VIEW (enhanced card rendering)
  ================================================================ */
  function renderGridView(habits, deleteMode, selectedToDelete) {
    const CARD_COLORS = ['#fab59e', '#a0eefc', '#c9f1a5', '#f5e199', '#d9c2f0'];
    const CATEGORY_ICONS = {
      Health: '❤️', Study: '📚', Fitness: '🏋️', Work: '💼', Personal: '⭐',
    };

    if (habits.length === 0) return _emptyState();

    const cards = habits.map((h, i) => {
      // Find original index for edit/delete actions
      const origIndex = window._habitBitHabits
        ? window._habitBitHabits.indexOf(h)
        : i;
      const bg = CARD_COLORS[i % CARD_COLORS.length];
      const icon = CATEGORY_ICONS[h.category] || '⭐';
      const isSelected = selectedToDelete?.includes(origIndex);
      const isDone = !!(h.done || h.is_done);

      const actionBtn = deleteMode
        ? `<button class="hvc-card__select-btn ${isSelected ? 'hvc-card__select-btn--selected' : ''}"
             onclick="event.stopPropagation(); toggleHabitSelection(${origIndex})">
             ${isSelected ? '<i class="bi bi-check-lg"></i>' : ''}
           </button>`
        : `<div class="dropdown position-absolute" style="top:12px;right:12px;z-index:10;">
             <button class="btn btn-sm dropdown-toggle" type="button"
               data-bs-toggle="dropdown" aria-expanded="false" style="color:#333;">
               <i class="bi bi-three-dots-vertical"></i>
             </button>
             <ul class="dropdown-menu dropdown-menu-end">
               <li><button class="dropdown-item" onclick="toggleDone(${origIndex})">
                 ${isDone ? 'Mark as Undone' : 'Mark as Done'}</button></li>
               <li><button class="dropdown-item" onclick="editHabit(${origIndex})">Edit</button></li>
               <li><button class="dropdown-item text-danger" onclick="deleteHabit(${h.id})">Delete</button></li>
             </ul>
           </div>`;

      return `
        <div class="habit-card ${isDone ? 'done-habit' : ''} ${deleteMode ? 'delete-mode-card' : ''} hvc-card-enter"
             style="background-color:${bg}; cursor:${deleteMode ? 'pointer' : 'default'};
                    border:${deleteMode ? '2px dashed #d33' : 'none'}; animation-delay:${i * 40}ms;"
             onclick="${deleteMode ? `toggleHabitSelection(${origIndex})` : ''}">
          ${actionBtn}
          <div class="habit-icon-circle">${icon}</div>
          <div class="habit-title ${isDone ? 'crossed-out' : ''}">${h.title}</div>
          <div class="habit-meta">
            <span>${h.category || 'Personal'}</span><br>
            <i class="bi bi-clock"></i> ${h.time_slot || h.time || ''}
          </div>
          ${isDone ? '<div class="position-absolute bottom-0 start-0 m-3" style="font-size:1.4rem;">✅</div>' : ''}
        </div>`;
    }).join('');

    return `<div class="row hvc-grid">${cards}</div>`;
  }

  /* ================================================================
     RENDER LIST VIEW
  ================================================================ */
  function renderListView(habits, deleteMode, selectedToDelete) {
    const CATEGORY_ICONS = {
      Health: '❤️', Study: '📚', Fitness: '🏋️', Work: '💼', Personal: '⭐',
    };
    const CATEGORY_COLORS = {
      Health: '#ff6b6b', Study: '#4dabf7', Fitness: '#51cf66',
      Work: '#ffd43b', Personal: '#cc5de8',
    };

    if (habits.length === 0) return _emptyState();

    const rows = habits.map((h, i) => {
      const origIndex = window._habitBitHabits
        ? window._habitBitHabits.indexOf(h)
        : i;
      const icon = CATEGORY_ICONS[h.category] || '⭐';
      const isDone = !!(h.done || h.is_done);
      const catColor = CATEGORY_COLORS[h.category] || '#868e96';
      const isSelected = selectedToDelete?.includes(origIndex);

      return `
        <div class="hvc-list-row hvc-card-enter ${isDone ? 'hvc-list-row--done' : ''} ${deleteMode ? 'hvc-list-row--delete' : ''}"
             style="animation-delay:${i * 35}ms;"
             onclick="${deleteMode ? `toggleHabitSelection(${origIndex})` : ''}">
          ${deleteMode
            ? `<div class="hvc-list-row__checkbox ${isSelected ? 'hvc-list-row__checkbox--checked' : ''}"
                    onclick="event.stopPropagation(); toggleHabitSelection(${origIndex})">
                 ${isSelected ? '<i class="bi bi-check-lg"></i>' : ''}
               </div>`
            : `<div class="hvc-list-row__icon" title="${h.category || 'Personal'}">${icon}</div>`
          }
          
          <div class="hvc-list-row__title ${isDone ? 'hvc-list-row__title--done' : ''}">
            ${h.title}
            ${isDone ? '<span class="hvc-list-row__done-badge">Done</span>' : ''}
          </div>

          <div class="hvc-list-row__category">
            <span class="hvc-category-pill" style="background:${catColor}20;color:${catColor};border-color:${catColor}40;">
              ${h.category || 'Personal'}
            </span>
          </div>

          <div class="hvc-list-row__repeat">
            <i class="bi bi-arrow-repeat me-1" style="color:#6c757d;font-size:0.75rem;"></i>
            ${h.repeat_type || h.repeat || 'Daily'}
          </div>

          ${!deleteMode ? `
          <div class="hvc-list-row__actions">
            <div class="dropdown">
              <button class="btn btn-sm" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots-vertical" style="color:#999;"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" onclick="toggleDone(${origIndex})">
                  ${isDone ? 'Mark as Undone' : 'Mark as Done'}</button></li>
                <li><button class="dropdown-item" onclick="editHabit(${origIndex})">Edit</button></li>
                <li><button class="dropdown-item text-danger" onclick="deleteHabit(${h.id})">Delete</button></li>
              </ul>
            </div>
          </div>` : ''}
        </div>`;
    }).join('');

    return `<div class="hvc-list">${rows}</div>`;
  }

  /* ================================================================
     EMPTY STATE UI
  ================================================================ */
  function _emptyState() {
    const messages = {
      all:          { icon: '🌱', title: 'No habits yet', sub: 'Tap + to create your first habit!' },
      completed:    { icon: '🏆', title: 'No completed habits', sub: 'Complete a habit to see it here.' },
      'in-progress':{ icon: '⏳', title: 'All caught up!', sub: 'No habits are in progress right now.' },
    };
    const { icon, title, sub } = messages[state.activeFilter] || messages.all;

    return `
      <div class="hvc-empty-state">
        <div class="hvc-empty-state__icon">${icon}</div>
        <div class="hvc-empty-state__title">${title}</div>
        <div class="hvc-empty-state__sub">${sub}</div>
      </div>`;
  }

  /* ================================================================
     ANIMATED RENDER (main entry point called by renderHabits patch)
  ================================================================ */
  function _animatedRender() {
    if (!els.habitList) return;
    if (state.animating) return;

    state.animating = true;
    els.habitList.classList.add('hvc-list-container--fading');

    setTimeout(() => {
      _doRender();
      els.habitList.classList.remove('hvc-list-container--fading');
      state.animating = false;
    }, 180);
  }

  function _doRender() {
    if (!els.habitList) return;

    // Access the global habits array from main.js
    const rawHabits = window._habitBitHabits || [];
    const deleteMode = window._habitBitDeleteMode || false;
    const selected   = window._habitBitSelected || [];

    const processed = getProcessedHabits(rawHabits);

    // Delete controls (if in delete mode)
    const deleteControls = deleteMode && rawHabits.length > 0
      ? `<div class="d-flex justify-content-end gap-2 mb-3">
           <button class="btn btn-danger btn-sm rounded-pill px-3" onclick="confirmDeleteSelected()">Delete Selected</button>
           <button class="btn btn-secondary btn-sm rounded-pill px-3" onclick="cancelDeleteMode()">Cancel</button>
         </div>`
      : '';

    // Results summary bar
    const summary = rawHabits.length > 0
      ? `<div class="hvc-results-bar">
           <span>${processed.length} of ${rawHabits.length} habit${rawHabits.length !== 1 ? 's' : ''}</span>
           ${state.activeFilter !== 'all'
             ? `<button class="hvc-results-bar__clear" onclick="HabitViewControls.setFilter('all')">
                  <i class="bi bi-x-circle"></i> Clear filter
                </button>`
             : ''}
         </div>`
      : '';

    const content = state.currentView === 'list'
      ? renderListView(processed, deleteMode, selected)
      : renderGridView(processed, deleteMode, selected);

    els.habitList.innerHTML = deleteControls + summary + content;
    els.habitList.dataset.view = state.currentView;
  }

  /* ================================================================
     STATE PERSISTENCE (sessionStorage)
  ================================================================ */
  function _persistState() {
    try {
      sessionStorage.setItem('hvc_state', JSON.stringify({
        view: state.currentView,
        filter: state.activeFilter,
        sort: state.activeSort,
      }));
    } catch (_) {}
  }

  function _restoreState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('hvc_state') || '{}');
      if (saved.view)   state.currentView  = saved.view;
      if (saved.filter) state.activeFilter = saved.filter;
      if (saved.sort)   state.activeSort   = saved.sort;
    } catch (_) {}
  }

  /* ================================================================
     INIT
  ================================================================ */
  function init() {
    resolveEls();
    _restoreState();

    // Set initial button states
    els.viewGridBtn?.classList.toggle('hvc-btn--active', state.currentView === 'grid');
    els.viewListBtn?.classList.toggle('hvc-btn--active', state.currentView === 'list');

    if (els.filterBadge) {
      els.filterBadge.style.display = state.activeFilter === 'all' ? 'none' : 'flex';
    }

    // Restore sort label
    const labels = { default: 'Sort', alpha: 'A–Z', 'most-completed': 'Most' };
    const sortLabel = document.getElementById('sortLabel');
    if (sortLabel) sortLabel.textContent = labels[state.activeSort] || 'Sort';

    // Mark active dropdown items
    document.querySelectorAll('[data-filter]').forEach(el => {
      el.classList.toggle('hvc-dropdown__item--active', el.dataset.filter === state.activeFilter);
    });
    document.querySelectorAll('[data-sort]').forEach(el => {
      el.classList.toggle('hvc-dropdown__item--active', el.dataset.sort === state.activeSort);
    });

    // Close dropdowns on outside click
    document.addEventListener('click', closeAllDropdowns);

    // Patch window.renderHabits to go through our controller
    _patchRenderHabits();
  }

  /* ================================================================
     PATCH renderHabits (integrates with existing main.js)
     We intercept the original renderHabits and redirect rendering
     through our view controller. The global habits array is exposed
     via window._habitBitHabits so our module can access it.
  ================================================================ */
  function _patchRenderHabits() {
    const originalRender = window.renderHabits;

    window.renderHabits = function () {
      // Expose state needed by our renderer
      // (main.js uses module-scoped vars, so we hook into the re-render cycle)
      // After original loadHabits sets window._habitBitHabits, we render.
      if (typeof originalRender === 'function') {
        // We DON'T call original — we take over rendering entirely for profile page
        // But we still call updateProgress which is part of original
      }

      _doRender();

      // Call updateProgress if it exists (side-effect from original renderHabits)
      if (typeof window._habitBitUpdateProgress === 'function') {
        window._habitBitUpdateProgress();
      }
    };
  }

  /* ================================================================
     PUBLIC API
  ================================================================ */
  return {
    init,
    setView,
    setFilter,
    setSort,
    toggleFilterDropdown,
    toggleSortDropdown,
    closeAllDropdowns,
    getProcessedHabits,
    // Expose for inline onclick in rendered rows
    refresh: _animatedRender,
  };
})();
