
document.addEventListener("DOMContentLoaded", () => {
  /* ================================================================
     CATEGORY → ICON MAP
  ================================================================ */
  const CATEGORY_ICONS = {
    Health: "❤️",
    Study: "📚",
    Fitness: "🏋️",
    Work: "💼",
    Personal: "⭐",
  };

  function categoryToIcon(cat) {
    return CATEGORY_ICONS[cat] || "⭐";
  }

  /* ================================================================
     STATE
  ================================================================ */
  let habits = [];
  let deleteMode = false;
  let selectedToDelete = [];
  let editIndex = null;

  // Calendar state
  const today = new Date();
  let currentMonth = today.getMonth(); // 0-based
  let currentYear = today.getFullYear();
  let currentView = "month";
  let calendarData = {}; // { "YYYY-MM-DD": percent }

  // Weekly tracker state
  let weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); 

  /* ================================================================
     DOM REFS
  ================================================================ */
  const elements = {
    modal: document.getElementById("habitModal"),
    list: document.getElementById("habit-list"),
    bar: document.getElementById("today-progress-bar"),
    count: document.getElementById("today-progress-count"),
    text: document.getElementById("today-progress-text"),
    modalTitle: document.querySelector("#habitModal h2"),
    inputs: {
      category: document.getElementById("habitCategory"),
      title: document.getElementById("habitTitle"),
      repeat: document.getElementById("habitRepeat"),
      hour: document.getElementById("habitHour"),
      minute: document.getElementById("habitMinute"),
      period: document.getElementById("habitPeriod"),
      desc: document.getElementById("habitDesc"),
    },
  };

  /* ================================================================
     HABIT MODAL
  ================================================================ */
  window.openHabitModal = () => {
    const fab = document.getElementById("fabMenu");
    if (fab) fab.classList.remove("open");

    editIndex = null;
    if (!elements.modal) return;

    elements.modalTitle.innerText = "Create new Habit";

    // Reset all inputs
    if (elements.inputs.category) elements.inputs.category.value = "Personal";
    if (elements.inputs.title) elements.inputs.title.value = "";
    if (elements.inputs.repeat) elements.inputs.repeat.value = "Daily";
    if (elements.inputs.hour) elements.inputs.hour.value = "";
    if (elements.inputs.minute) elements.inputs.minute.value = "";
    if (elements.inputs.period) elements.inputs.period.value = "AM";
    if (elements.inputs.desc) elements.inputs.desc.value = "";

    const descBox = document.getElementById("descBox");
    if (descBox) descBox.style.display = "none";

    // Update icon preview
    updateCategoryPreview();
    elements.modal.style.display = "flex";
  };

  window.closeHabitModal = () => {
    if (elements.modal) elements.modal.style.display = "none";
    editIndex = null;
  };

  window.toggleDesc = () => {
    const box = document.getElementById("descBox");
    if (box)
      box.style.display = box.style.display === "block" ? "none" : "block";
  };

  // Live icon preview when category changes
  window.updateCategoryPreview = () => {
    const cat = elements.inputs.category?.value || "Personal";
    const preview = document.getElementById("categoryIconPreview");
    if (preview) preview.innerText = categoryToIcon(cat);
  };

  window.editHabit = (index) => {
    editIndex = index;
    const h = habits[index];

    if (elements.inputs.category)
      elements.inputs.category.value = h.category || "Personal";
    if (elements.inputs.title) elements.inputs.title.value = h.title || "";
    if (elements.inputs.repeat)
      elements.inputs.repeat.value = h.repeat_type || h.repeat || "Daily";
    if (elements.inputs.desc)
      elements.inputs.desc.value = h.description || h.desc || "";

    // Parse time_slot "7:00 AM"
    const timeStr = h.time_slot || h.time || "";
    const timeParts = timeStr.split(" ");
    if (timeParts.length === 2) {
      const hm = timeParts[0].split(":");
      if (hm.length === 2) {
        if (elements.inputs.hour)
          elements.inputs.hour.value = parseInt(hm[0], 10);
        if (elements.inputs.minute) elements.inputs.minute.value = hm[1];
        if (elements.inputs.period) elements.inputs.period.value = timeParts[1];
      }
    }

    const descBox = document.getElementById("descBox");
    if (descBox && (h.description || h.desc)) descBox.style.display = "block";

    updateCategoryPreview();
    if (elements.modal) elements.modal.style.display = "flex";
    if (elements.modalTitle) elements.modalTitle.innerText = "Edit Habit";
  };

  /* ================================================================
     LOAD HABITS
  ================================================================ */
  async function loadHabits() {
    try {
      const res = await fetch("api/habits.php");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      habits = raw.map((h) => ({
        ...h,
        done: !!h.is_done,
        repeat: h.repeat_type,
        time: h.time_slot,
        desc: h.description,
        category: h.category || "Personal",
      }));
    } catch (err) {
      console.error("loadHabits error:", err);
      habits = [];
    }
    await Promise.all([
      loadCalendarData(currentYear, currentMonth + 1),
      loadWeekData(weekStart),
    ]);
    renderHabits();
    updateProgress();
    renderWeeklyGrid();
  }

  /* ================================================================
     SAVE HABIT (create / update)
  ================================================================ */
  window.saveHabit = async () => {
    const { category, title, repeat, hour, minute, period, desc } =
      elements.inputs;

    // Validation
    if (!title || !title.value.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Missing title",
        text: "Please enter a habit title.",
        confirmButtonColor: "#ffb347",
      });
    }

    const hourValue = parseInt(hour?.value, 10);
    const minuteValue = parseInt(minute?.value, 10);

    if (isNaN(hourValue) || hourValue < 1 || hourValue > 12) {
      return Swal.fire({
        icon: "error",
        title: "Invalid hour",
        text: "Please enter an hour from 1 to 12.",
        confirmButtonColor: "#ffb347",
      });
    }
    if (isNaN(minuteValue) || minuteValue < 0 || minuteValue > 59) {
      return Swal.fire({
        icon: "error",
        title: "Invalid minutes",
        text: "Please enter minutes from 0 to 59.",
        confirmButtonColor: "#ffb347",
      });
    }

    const formattedTime = `${hourValue}:${String(minuteValue).padStart(2, "0")} ${period?.value || "AM"}`;
    const selectedCat = category?.value || "Personal";

    const habitData = {
      category: selectedCat,
      title: title.value.trim(),
      repeat_type: repeat?.value || "Daily",
      time_slot: formattedTime,
      description: desc?.value || "",
    };

    if (editIndex !== null) {
      habitData.id = habits[editIndex].id;
    }

    try {
      const method = editIndex !== null ? "PUT" : "POST";
      const response = await fetch("api/habits.php", {
        method,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(habitData),
      });

      const result = await response.json();

      if (result.success) {
        closeHabitModal();
        await loadHabits();
        Swal.fire({
          icon: "success",
          title: "Saved!",
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        // Ito ang sasalo sa error message galing sa PHP check natin
        Swal.fire({
          icon: "error",
          title: "Conflict",
          text: result.error || "Save failed",
          confirmButtonColor: "#ffb347",
        });
      }
    } catch (err) {
      console.error("Critical Error:", err);
      Swal.fire({
        icon: "error",
        title: "System Error",
        text: "The server returned an invalid response. Please check your PHP code or XAMPP logs.",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  /* ================================================================
     RENDER HABITS
  ================================================================ */
  const CARD_COLORS = ["#fab59e", "#a0eefc", "#c9f1a5", "#f5e199", "#d9c2f0"];

  window.renderHabits = function () {
    if (!elements.list) return;

    if (habits.length === 0) {
      elements.list.innerHTML = `<p class="text-center text-muted p-4">No habits yet. Tap + to start!</p>`;
      updateProgress();
      return;
    }

    const deleteControls = deleteMode
      ? `<div class="d-flex justify-content-end gap-2 mb-3">
           <button class="btn btn-danger btn-sm rounded-pill px-3" onclick="confirmDeleteSelected()">Delete Selected</button>
           <button class="btn btn-secondary btn-sm rounded-pill px-3" onclick="cancelDeleteMode()">Cancel</button>
         </div>`
      : "";

    const cards = habits
      .map((h, i) => {
        const bg = CARD_COLORS[i % CARD_COLORS.length];
        const icon = categoryToIcon(h.category || "Personal");
        const isSelected = selectedToDelete.includes(i);

        const actionBtn = deleteMode
          ? `<button
             class="btn rounded-circle d-flex align-items-center justify-content-center position-absolute"
             style="width:32px;height:32px;border:2px solid #333; top:15px; right:15px;
                    background:${isSelected ? "#d33" : "#fff"};
                    color:${isSelected ? "#fff" : "#333"};z-index:10;"
             onclick="event.stopPropagation(); toggleHabitSelection(${i})"
           >${isSelected ? "✓" : ""}</button>`
          : `<div class="dropdown position-absolute" style="top:15px; right:15px; z-index:10;">
             <button class="btn btn-sm dropdown-toggle" type="button"
                     data-bs-toggle="dropdown" aria-expanded="false" style="color:#333;">
               <i class="bi bi-three-dots-vertical"></i>
             </button>
             <ul class="dropdown-menu dropdown-menu-end">
               <li><button class="dropdown-item" onclick="toggleDone(${i})">
                 ${h.done ? "Mark as Undone" : "Mark as Done"}
               </button></li>
               <li><button class="dropdown-item" onclick="editHabit(${i})">Edit</button></li>
               <li><button class="dropdown-item text-danger" onclick="deleteHabit(${i})">Delete</button></li>
             </ul>
           </div>`;

        // Vertical card
        return `
          <div class="habit-card ${h.done ? "done-habit" : ""} ${deleteMode ? "delete-mode-card" : ""}"
               style="background-color:${bg}; cursor:${deleteMode ? "pointer" : "default"};
                      border:${deleteMode ? "2px dashed #d33" : "none"};"
               onclick="${deleteMode ? `toggleHabitSelection(${i})` : ""}">
            
            ${actionBtn}

            <div class="habit-icon-circle">
               ${icon}
            </div>

            <div class="habit-title ${h.done ? "crossed-out" : ""}">
              ${h.title}
            </div>

            <div class="habit-meta">
              <span>${h.category || "Personal"}</span><br>
              <i class="bi bi-clock"></i> ${h.time || h.time_slot || ""}
            </div>

            ${h.done ? `<div class="position-absolute bottom-0 start-0 m-3" style="font-size:1.4rem;">✅</div>` : ""}
      
          </div>`;
      })
      .join("");

    elements.list.innerHTML = `${deleteControls}<div class="row">${cards}</div>`;
    updateProgress();
  };

  /* ================================================================
     TOGGLE DONE 
  ================================================================ */
 window.toggleDone = async (i) => {
  const habit = habits[i];
  if (!habit?.id)
    return Swal.fire({
      icon: "warning",
      text: "No habit ID",
      confirmButtonColor: "#ffb347",
    });

  const newDone = !habit.done;
  
  // If undoing, use the recorded completion date; if completing, use today.
  const targetDate = !newDone && habit.completed_at ? habit.completed_at : formatDate(new Date());
  const action = newDone ? "complete" : "uncomplete";

  try {
    const res = await fetch(`api/habits.php?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habit.id, date: targetDate }),
    });
    const result = await res.json();

    if (result.success) {
      await loadHabits();
      Swal.fire({
        icon: newDone ? "success" : "info",
        title: newDone ? "✅ Done!" : "↩️ Undone",
        timer: 1200,
        showConfirmButton: false,
      });
    } else {
      // This will catch the PHP error if the user tries to mark it done on the wrong day
      Swal.fire({
        icon: "error",
        text: result.error || "API Error",
        confirmButtonColor: "#ffb347",
      });
    }
  } catch (err) {
    console.error("toggleDone error:", err);
    Swal.fire({
      icon: "error",
      title: "Network error",
      confirmButtonColor: "#ffb347",
    });
  }
};

  /* ================================================================
     COMPLETE ALL
  ================================================================ */
  window.completeAll = async () => {
    if (!habits.length) return;
    const today = formatDate(new Date());

    try {
      await Promise.all(
        habits.map((h) =>
          fetch("api/habits.php?action=complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ habit_id: h.id, date: today }),
          }),
        ),
      );
      await loadHabits();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Complete failed",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  /* ================================================================
     DELETE HABITS
  ================================================================ */
  window.deleteHabit = async (i) => {
    const habit = habits[i];
    if (!habit?.id) return;

    const conf = await Swal.fire({
      title: "Delete habit?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#333",
      confirmButtonText: "Yes, delete",
    });
    if (!conf.isConfirmed) return;

    try {
      const res = await fetch("api/habits.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ id: habit.id }),
      });
      const result = await res.json();
      if (result.success) {
        await loadHabits();
      } else {
        Swal.fire({
          icon: "error",
          text: result.error,
          confirmButtonColor: "#ffb347",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Network error",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  window.toggleDeleteMode = () => {
    if (!habits.length) {
      return Swal.fire({
        icon: "info",
        title: "No habits yet",
        confirmButtonColor: "#ffb347",
      });
    }
    deleteMode = !deleteMode;
    selectedToDelete = [];
    const fab = document.getElementById("fabMenu");
    if (fab) fab.classList.remove("open");
    renderHabits();
  };

  window.toggleHabitSelection = (i) => {
    if (!deleteMode) return;
    const idx = selectedToDelete.indexOf(i);
    if (idx > -1) selectedToDelete.splice(idx, 1);
    else selectedToDelete.push(i);
    renderHabits();
  };

  window.confirmDeleteSelected = async () => {
    if (!selectedToDelete.length) {
      return Swal.fire({
        icon: "warning",
        title: "None selected",
        confirmButtonColor: "#ffb347",
      });
    }

    const conf = await Swal.fire({
      title: `Delete ${selectedToDelete.length} habit(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#333",
      confirmButtonText: "Yes, delete",
    });
    if (!conf.isConfirmed) return;

    const ids = selectedToDelete.map((i) => habits[i]?.id).filter(Boolean);

    try {
      await Promise.all(
        ids.map((id) =>
          fetch("api/habits.php", {
            method: "DELETE",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ id }),
          }),
        ),
      );
    } catch (err) {
      console.error("Bulk delete error:", err);
    }

    deleteMode = false;
    selectedToDelete = [];
    await loadHabits();
    Swal.fire({
      icon: "success",
      title: "Deleted!",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  window.cancelDeleteMode = () => {
    deleteMode = false;
    selectedToDelete = [];
    renderHabits();
  };

  /* ================================================================
     PROGRESS BAR
  ================================================================ */
  function updateProgress() {
    if (!elements.bar) return;
    const done = habits.filter((h) => h.is_done || h.done).length;
    const total = habits.length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    elements.bar.style.width = `${percent}%`;
    if (elements.count)
      elements.count.innerText = `${done}/${total} Habits done`;
    if (elements.text) elements.text.innerText = `${percent}%`;
  }

  /* ================================================================
     UPDATE PROFILE
  ================================================================ */
  window.updateProfile = async () => {
    const firstName = document.getElementById("editFirstName")?.value.trim();
    const lastName = document.getElementById("editLastName")?.value.trim();

    if (!firstName || !lastName) {
      return Swal.fire({
        icon: "warning",
        title: "Both fields are required",
        confirmButtonColor: "#ffb347",
      });
    }

    try {
      const res = await fetch("api/update_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      });
      const result = await res.json();

      if (result.success) {
        const profileName = document.getElementById("profileName");
        const profileAvatar = document.getElementById("profileAvatar");
        const fullName = `${firstName} ${lastName}`;

        if (profileName) profileName.innerText = fullName;
        if (profileAvatar)
          profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=77D0A0&color=fff`;

        document.getElementById("editProfileModal").style.display = "none";
        Swal.fire({
          icon: "success",
          title: "Profile updated!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          text: result.message || "Update failed",
          confirmButtonColor: "#ffb347",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Network error",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  /* ================================================================
     LOGIN STREAK  (localStorage — lightweight, non-critical)
  ================================================================ */
  function updateConsecutiveDays() {
    const todayStr = formatDate(new Date());
    const lastLogin = localStorage.getItem("lastLoginDate");
    let streak = parseInt(localStorage.getItem("loginStreak"), 10) || 0;

    if (lastLogin !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      streak = lastLogin === formatDate(yesterday) ? streak + 1 : 1;
      localStorage.setItem("lastLoginDate", todayStr);
      localStorage.setItem("loginStreak", streak);
    }

    const el = document.getElementById("login-streak");
    if (el) el.innerHTML = `🔥 ${streak}`;
  }
  updateConsecutiveDays();

  /* ================================================================
     HELPERS
  ================================================================ */
  function formatDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getProgressColor(pct) {
    if (pct === 100) return "bg-success text-white";
    if (pct >= 75) return "bg-info text-white";
    if (pct >= 50) return "bg-warning text-dark";
    if (pct > 0) return "bg-peach";
    return "bg-light";
  }

  /* ================================================================
     MONTHLY NAMES
  ================================================================ */
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /* ================================================================
     CALENDAR — LOAD DATA FROM API
  ================================================================ */
  async function loadCalendarData(year, month) {
    try {
      const res = await fetch(
        `api/habits.php?action=calendar&year=${year}&month=${month}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      calendarData = json.data || {};
    } catch (err) {
      console.error("loadCalendarData error:", err);
      calendarData = {};
    }
    buildCalendar();
  }

  /* ================================================================
     CALENDAR — BUILD VIEW  (month or year)
  ================================================================ */
  window.buildCalendar = function () {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;

    if (currentView === "month") {
      buildMonthView(currentMonth, currentYear);
    } else {
      buildYearView(currentYear);
    }
  };

  function buildMonthView(month, year) {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;

    grid.innerHTML = "";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(7,1fr)";
    grid.style.gap = "5px";

    // Day headers
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
      const el = document.createElement("div");
      el.className = "fw-bold text-muted small text-center";
      el.textContent = day;
      grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before 1st
    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(document.createElement("div"));
    }

    const todayStr = formatDate(today);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const pct = calendarData[dateStr] ?? 0;
      const color = getProgressColor(pct);
      const isToday = dateStr === todayStr;

      const cell = document.createElement("div");
      cell.className = `cal-box calendar-day rounded ${color} ${isToday ? "border border-dark" : ""}`;
      cell.innerHTML = `
        <div class="calendar-day">
          <div class="day-num">${day}</div>
          <div class="day-pct">${pct}%</div>
        </div>`;
      grid.appendChild(cell);
    }

    const label = document.getElementById("month-label");
    if (label) label.innerText = `${MONTH_NAMES[month]} ${year}`;
  }

  function buildYearView(year) {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(4,1fr)";
    grid.style.gap = "8px";
    grid.innerHTML = "";

    for (let m = 0; m < 12; m++) {
      const card = document.createElement("div");
      card.className = "border rounded p-2 text-center small";
      card.style.cursor = "pointer";

      // Count days with any completion in this month
      const prefix = `${year}-${String(m + 1).padStart(2, "0")}-`;
      const activeDays = Object.keys(calendarData).filter(
        (k) => k.startsWith(prefix) && calendarData[k] > 0,
      ).length;
      const totalDays = new Date(year, m + 1, 0).getDate();
      const pct = totalDays ? Math.round((activeDays / totalDays) * 100) : 0;
      const color = getProgressColor(pct);

      card.innerHTML = `
        <div class="fw-bold">${MONTH_NAMES[m].slice(0, 3)}</div>
        <div class="mt-1 px-1 py-1 rounded ${color}" style="font-size:0.7rem;">
          ${pct}%
        </div>`;

      card.addEventListener("click", () => {
        currentMonth = m;
        currentView = "month";
        document.getElementById("viewMonth")?.classList.add("active");
        document.getElementById("viewYear")?.classList.remove("active");
        buildMonthView(m, year);
        const label = document.getElementById("month-label");
        if (label) label.innerText = `${MONTH_NAMES[m]} ${year}`;
      });

      grid.appendChild(card);
    }

    const label = document.getElementById("month-label");
    if (label) label.innerText = `${year}`;
  }

  /* ================================================================
     CALENDAR NAV
  ================================================================ */
  window.changeMonth = async (dir) => {
    if (currentView === "month") {
      currentMonth += dir;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      await loadCalendarData(currentYear, currentMonth + 1);
    } else {
      currentYear += dir;
      await loadCalendarData(currentYear, 1); // load whole year data
      buildCalendar();
    }
  };

  // Month / Year toggle buttons
  document.getElementById("viewMonth")?.addEventListener("click", function () {
    currentView = "month";
    this.classList.add("active");
    document.getElementById("viewYear")?.classList.remove("active");
    loadCalendarData(currentYear, currentMonth + 1);
  });

  document
    .getElementById("viewYear")
    ?.addEventListener("click", async function () {
      currentView = "year";
      this.classList.add("active");
      document.getElementById("viewMonth")?.classList.remove("active");
      // For year view, fetch all 12 months — simplest: fetch current month and build from stored
      // We'll load all months for the year by making 12 requests combined
      calendarData = {};
      for (let m = 1; m <= 12; m++) {
        try {
          const res = await fetch(
            `api/habits.php?action=calendar&year=${currentYear}&month=${m}`,
          );
          const json = await res.json();
          Object.assign(calendarData, json.data || {});
        } catch (_) {
          /* ignore */
        }
      }
      buildCalendar();
    });

  /* ================================================================
     WEEKLY TRACKER
  ================================================================ */
  function renderWeeklyGrid() {
    const gridEl = document.getElementById("weekly-grid");
    if (!gridEl) return;

    gridEl.innerHTML = "";
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayStr = formatDate(today);

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dateStr = formatDate(day);
      const pct = calendarData[dateStr] ?? 0;
      const color = getProgressColor(pct);
      const isToday = dateStr === todayStr;

      const div = document.createElement("div");
      // Added 'active-day' for the current date highlight and 'border-dark' for the border
      div.className = `day-item ${color}${isToday ? " active-day" : ""}`;

      div.innerHTML = `
    <span class="day-name">${DAY_NAMES[i]}</span>
    <span class="day-number">${day.getDate()}</span>
    `;
      gridEl.appendChild(div);
    }

    const label = document.getElementById("week-label");
    if (label) {
      label.innerText = `Week of ${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()}`;
    }
  }

  async function loadWeekData(weekStartDate) {
    const months = new Set();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      const dateStr = formatDate(date);
      dates.push(dateStr);
      months.add(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      );
    }

    // Load all relevant months
    for (const monthStr of months) {
      const [year, month] = monthStr.split("-").map(Number);
      try {
        const res = await fetch(
          `api/habits.php?action=calendar&year=${year}&month=${month}`,
        );
        if (res.ok) {
          const json = await res.json();
          Object.assign(calendarData, json.data || {});
        }
      } catch (err) {
        console.error("loadWeekData month error:", err);
      }
    }
  }

  window.changeWeek = async (dir) => {
    weekStart.setDate(weekStart.getDate() + dir * 7);
    await loadWeekData(weekStart);
    renderWeeklyGrid();
  };
  /* ================================================================
     FAB MENU
  ================================================================ */
  window.toggleMenu = () => {
    const fab = document.getElementById("fabMenu");
    if (fab) fab.classList.toggle("open");
  };

  window.moveNavIndicator = (percent) => {
    const nav = document.querySelector(".app-nav");
    if (nav) nav.style.setProperty("--active-offset", `${percent}%`);
  };

  /* ================================================================
     BOOTSTRAP
  ================================================================ */
  loadHabits();
  updateConsecutiveDays();
});
