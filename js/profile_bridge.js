/**
 * profile_bridge.js — HabitBit Profile Page
 * 
 * Integration bridge between main.js (closure-scoped) and
 * HabitViewControls (module-scoped). This file:
 *  1. Intercepts the habits API response to expose data globally
 *  2. Patches renderHabits to route through HabitViewControls
 *  3. Syncs delete mode state
 *  4. Exposes updateProgress reference
 *  5. Bootstraps HabitViewControls after main.js initializes
 * 
 * Load order: main.js → habitViewControls.js → profile_bridge.js
 */

(function () {
  'use strict';

  /* ================================================================
     GLOBAL STATE MIRRORS
     These mirror the closure-scoped state inside main.js so that
     HabitViewControls can read them without modifying main.js.
  ================================================================ */
  window._habitBitHabits      = [];
  window._habitBitDeleteMode  = false;
  window._habitBitSelected    = [];

  /* ================================================================
     FETCH INTERCEPTOR
     Intercepts the GET api/habits.php call to copy the habits
     array into window._habitBitHabits.
  ================================================================ */
  const _nativeFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await _nativeFetch.apply(this, args);

    try {
      const url    = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const method = (args[1]?.method || 'GET').toUpperCase();
      const isHabitsGet = url.includes('api/habits.php') &&
                          !url.includes('action=') &&
                          method === 'GET';

      if (isHabitsGet) {
        const clone = response.clone();
        clone.json().then(data => {
          if (Array.isArray(data)) {
            window._habitBitHabits = data.map(h => ({
              ...h,
              done:     !!h.is_done,
              repeat:   h.repeat_type,
              time:     h.time_slot,
              desc:     h.description,
              category: h.category || 'Personal',
              // completion_count may come from enriched API (see PHP patch below)
              completion_count: parseInt(h.completion_count, 10) || 0,
            }));
          }
        }).catch(() => {});
      }
    } catch (_) {}

    return response;
  };

  /* ================================================================
     RENDER PATCH
     After all DOMContentLoaded handlers have run (main.js sets
     window.renderHabits), we override it to route through
     HabitViewControls, which applies filter/sort/view before
     rendering.
  ================================================================ */
  function patchRenderHabits() {
    const _origRender = window.renderHabits;

    window.renderHabits = function () {
      // Use HabitViewControls for all rendering
      if (typeof HabitViewControls !== 'undefined') {
        HabitViewControls.refresh();
      } else if (typeof _origRender === 'function') {
        // Fallback: use original if module not loaded
        _origRender();
      }
    };
  }

  /* ================================================================
     PROGRESS TRACKER PATCH
     main.js's updateProgress is defined inside DOMContentLoaded.
     We intercept the DOM elements it writes to so we can call
     a re-render of progress from HabitViewControls if needed.
  ================================================================ */
  function patchUpdateProgress() {
    const progressBar   = document.getElementById('today-progress-bar');
    const progressCount = document.getElementById('today-progress-count');
    const progressText  = document.getElementById('today-progress-text');

    if (!progressBar) return;

    // We observe writes to the progress bar via a MutationObserver
    // so we know when main.js has updated progress (no patch needed,
    // main.js calls updateProgress internally; we just expose it).
    // actual updateProgress is called by main.js's loadHabits → renderHabits chain.
    // Our renderHabits override above calls HabitViewControls.refresh() which
    // does NOT call updateProgress itself — so we need to trigger it separately.

    // Solution: after HabitViewControls renders, we manually calculate and
    // update progress based on window._habitBitHabits (ALL habits, not filtered).
    window._habitBitUpdateProgress = function () {
      const habits = window._habitBitHabits || [];
      if (habits.length === 0) {
        if (progressBar)   progressBar.style.width = '0%';
        if (progressCount) progressCount.textContent = '0/0 Habits done';
        if (progressText)  progressText.textContent  = '0%';
        return;
      }
      const done  = habits.filter(h => h.done || h.is_done).length;
      const total = habits.length;
      const pct   = Math.round((done / total) * 100);

      if (progressBar)   progressBar.style.width  = pct + '%';
      if (progressCount) progressCount.textContent = `${done}/${total} Habits done`;
      if (progressText)  progressText.textContent  = pct + '%';
    };
  }

  /* ================================================================
     DELETE MODE SYNC
     main.js's toggleDeleteMode, toggleHabitSelection,
     cancelDeleteMode, confirmDeleteSelected are window globals.
     We wrap them to sync state to our mirror globals.
  ================================================================ */
  function patchDeleteMode() {
    // We can't access main.js's closure vars directly, but we can
    // detect delete mode by reading a sentinel on the DOM.
    // Strategy: Override the functions after main.js defines them.

    function wrapAfterDefined(fnName, wrapper) {
      const orig = window[fnName];
      if (typeof orig !== 'function') return;
      window[fnName] = function (...args) {
        const result = orig.apply(this, args);
        wrapper(...args);
        return result;
      };
    }

    wrapAfterDefined('toggleDeleteMode', () => {
      // Toggle mirror
      window._habitBitDeleteMode = !window._habitBitDeleteMode;
      if (!window._habitBitDeleteMode) window._habitBitSelected = [];
    });

    wrapAfterDefined('cancelDeleteMode', () => {
      window._habitBitDeleteMode = false;
      window._habitBitSelected   = [];
    });

    wrapAfterDefined('confirmDeleteSelected', () => {
      window._habitBitDeleteMode = false;
      window._habitBitSelected   = [];
    });

    wrapAfterDefined('toggleHabitSelection', (index) => {
      const arr = window._habitBitSelected;
      const idx = arr.indexOf(index);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(index);
    });
  }

  /* ================================================================
     BOOTSTRAP
     Run after both main.js and HabitViewControls have initialized.
  ================================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    // Give main.js DOMContentLoaded a chance to run first (it's sync,
    // but registered earlier; we use setTimeout to be safe).
    setTimeout(() => {
      patchRenderHabits();
      patchUpdateProgress();
      patchDeleteMode();

      // Initialize HabitViewControls UI
      if (typeof HabitViewControls !== 'undefined') {
        HabitViewControls.init();
      }

      // Trigger initial load (main.js calls loadHabits in its DOMContentLoaded,
      // which already happened — we re-render using whatever data was fetched).
      // If habits are already loaded, render immediately.
      if (window._habitBitHabits && window._habitBitHabits.length > 0) {
        if (typeof HabitViewControls !== 'undefined') {
          HabitViewControls.refresh();
        }
        if (typeof window._habitBitUpdateProgress === 'function') {
          window._habitBitUpdateProgress();
        }
      }
    }, 200);
  });

})();
