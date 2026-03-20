document.addEventListener("DOMContentLoaded", () => {
  const HABIT_PALETTE = [
    "#77d0a0",
    "#ffb347",
    "#2ca3ff",
    "#ffccbc",
    "#b2ebf2",
    "#8b4dff",
  ];

  window.checkAndResetDailyHabits = function () {
    const todayStr = new Date().toDateString();
    const lastResetDate = localStorage.getItem("lastResetDate");

    if (lastResetDate !== todayStr) {
      habits.forEach((habit) => {
        habit.done = false;
      }); // Reset status
      localStorage.setItem("habits", JSON.stringify(habits));
      localStorage.setItem("lastResetDate", todayStr);
    }
  };

  /* -------- HABITS LOGIC -------- */
  let habits = JSON.parse(localStorage.getItem("habits")) || [];
  let editIndex = null;

  checkAndResetDailyHabits();

  const elements = {
    modal: document.getElementById("habitModal"),
    list: document.getElementById("habit-list"),
    bar: document.getElementById("today-progress-bar"),
    count: document.getElementById("today-progress-count"),
    text: document.getElementById("today-progress-text"),
    modalTitle: document.querySelector("#habitModal h2"),
    inputs: {
      icon: document.getElementById("habitIcon"),
      title: document.getElementById("habitTitle"),
      repeat: document.getElementById("habitRepeat"),
      time: document.getElementById("habitTime"),
      desc: document.getElementById("habitDesc"),
    },
  };

  window.updateProgress = () => {
    if (!elements.bar) return;
    const done = habits.filter((h) => h.done).length;
    const total = habits.length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    elements.bar.style.width = `${percent}%`;
    elements.count.innerText = `${done}/${total} Habits done`;
    elements.text.innerText = `${percent}%`;
  };

  window.getHabitColor = (percent) => {
    if (percent >= 100) return HABIT_PALETTE[0]; // Green
    if (percent >= 75) return HABIT_PALETTE[2]; // Blue
    if (percent >= 50) return HABIT_PALETTE[1]; // Orange
    return "#f8f9fa";
  };

  window.renderHabits = function () {
    if (!elements.list) return;

    if (habits.length === 0) {
      elements.list.innerHTML = `<p class="text-center text-muted p-4">No habits yet. Tap + to start!</p>`;
      updateProgress();
      return;
    }

    elements.list.innerHTML = habits
      .map((h, i) => {
        const progress =
          h.progress !== undefined ? h.progress : h.done ? 100 : 0;
        const bgColor = getHabitColor(progress);
        const textClass = progress >= 75 ? "text-white" : "text-dark";

        return `
        <div class="habit-card ${textClass}" style="background-color: ${bgColor}">
            <div class="card-content d-flex align-items-center gap-2">
                <span class="fs-3">${h.icon || "✨"}</span>
                <div class="d-flex flex-column text-start">
                    <span class="fw-bold">${h.title}</span>
                    <small style="opacity: 0.8">${h.repeat} • ${h.time}</small>
                </div>
            </div>

            <div class="dropdown">
                <button class="btn dropdown-toggle border-0" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><button class="dropdown-item" onclick="editHabit(${i})"><i class="bi bi-pencil me-2"></i>Edit</button></li>
                    <li><button class="dropdown-item" onclick="toggleDone(${i})"><i class="bi bi-check2-circle me-2"></i>Status</button></li>
                    <li><button class="dropdown-item text-danger" onclick="deleteHabit(${i})"><i class="bi bi-trash me-2"></i>Delete</button></li>
                </ul>
            </div>
        </div>`;
      })
      .join("");

    updateProgress();
  };

  window.toggleMenu = () => {
    const fabMenu = document.getElementById("fabMenu");
    if (fabMenu) {
      fabMenu.classList.toggle("open");
    }
  };

  window.openHabitModal = () => {
    const fabMenu = document.getElementById("fabMenu");
    if (fabMenu) fabMenu.classList.remove("open");

    if (elements.modal) {
      elements.modal.style.display = "flex";
      elements.modalTitle.innerText = "Create new Habit";

      editIndex = null;

      Object.values(elements.inputs).forEach((input) => {
        if (input) input.value = "";
      });
    }
  };
  window.closeHabitModal = () => {
    if (elements.modal) elements.modal.style.display = "none";
    editIndex = null;
    Object.values(elements.inputs).forEach((input) => {
      if (input) input.value = "";
    });
    const descBox = document.getElementById("descBox");
    if (descBox) descBox.style.display = "none";
  };

  window.toggleDesc = () => {
    const box = document.getElementById("descBox");
    if (box)
      box.style.display = box.style.display === "block" ? "none" : "block";
  };

  window.editHabit = (index) => {
    editIndex = index;
    const habit = habits[index];

    if (elements.inputs.icon) elements.inputs.icon.value = habit.icon || "";
    elements.inputs.title.value = habit.title;
    elements.inputs.repeat.value = habit.repeat;
    elements.inputs.time.value = habit.time;
    elements.inputs.desc.value = habit.desc || "";

    if (elements.modal) elements.modal.style.display = "flex";
    elements.modalTitle.innerText = "Edit Habit";

    const descBox = document.getElementById("descBox");
    if (habit.desc && descBox) descBox.style.display = "block";
  };

  window.saveHabit = () => {
    const { icon, title, repeat, time, desc } = elements.inputs;

    if (!title.value.trim()) {
      return Swal.fire({ icon: "error", title: "Missing title!" });
    }

    const habitData = {
      icon: icon.value.trim() || "✨",
      title: title.value.trim(),
      repeat: repeat.value || "Daily",
      time: time.value || "12:00",
      desc: desc.value,
      done: editIndex !== null ? habits[editIndex].done : false,
      //for new color of habits
      color:
        editIndex !== null
          ? habits[editIndex].color
          : HABIT_PALETTE[Math.floor(Math.random() * HABIT_PALETTE.length)],
    };

    if (editIndex === null) habits.push(habitData);
    else habits[editIndex] = habitData;

    localStorage.setItem("habits", JSON.stringify(habits));
    closeHabitModal();
    renderHabits();
  };

  // Update renderHabits
  window.renderHabits = function () {
    if (!elements.list) return;
    if (habits.length === 0) {
      elements.list.innerHTML = `<div class="text-center text-muted p-5 w-100">No habits yet. Tap + to start!</div>`;
      updateProgress();
      return;
    }

    let html = '<div class="row g-3">';
    html += habits
      .map((h, i) => {
        const bgColor = h.color || HABIT_PALETTE[0];
        const isDoneClass = h.done ? "crossed-out" : "";

        return `
        <div class="col-6">
            <div class="habit-card" style="background-color: ${bgColor}">
                <div class="habit-text-section ${isDoneClass}">
                    <div class="fw-bold text-truncate">${h.icon} ${h.title}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">
                        <i class="bi bi-calendar"></i> Repeat: ${h.repeat}
                    </div>
                    <small style="opacity: 0.8">${h.time}</small>
                </div>

                <div class="dropdown">
                    <button class="btn btn-link text-dark p-0 border-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical fs-5"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow">
                        <li><button class="dropdown-item" onclick="editHabit(${i})"><i class="bi bi-pencil-square me-2"></i>Edit</button></li>
                        <li><button class="dropdown-item" onclick="toggleDone(${i})">
                            <i class="bi ${h.done ? "bi-x-circle" : "bi-check-circle"} me-2"></i>
                            ${h.done ? "Mark Incomplete" : "Mark as Complete"}
                        </button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item text-danger" onclick="deleteHabit(${i})"><i class="bi bi-trash3 me-2"></i>Delete</button></li>
                    </ul>
                </div>
            </div>
        </div>`;
      })
      .join("");
    html += "</div>";
    elements.list.innerHTML = html;
    updateProgress();
  };

  window.toggleDone = (i) => {
    const todayStr = new Date().toISOString().split("T")[0];
    habits[i].done = !habits[i].done;

    if (!habits[i].history) habits[i].history = {};
    habits[i].history[todayStr] = habits[i].done;

    localStorage.setItem("habits", JSON.stringify(habits));

    renderHabits();
    buildCalendar();
    renderWeeklyGrid();
  };

  window.deleteHabit = (i) => {
    Swal.fire({
      title: "Delete habit?",
      text: "Are you sure? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#333",
      confirmButtonText: "Yes, delete it.",
    }).then((result) => {
      if (result.isConfirmed) {
        habits.splice(i, 1);
        localStorage.setItem("habits", JSON.stringify(habits));
        renderHabits();
      }
    });
  };

  window.completeAll = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    habits.forEach((h) => {
      h.done = true;
      if (!h.history) h.history = {};
      h.history[todayStr] = true;
    });
    localStorage.setItem("habits", JSON.stringify(habits));
    renderHabits();
    window.buildCalendar = buildCalendar;
    window.renderWeeklyGrid = renderWeeklyGrid;
  };

  /* -------- LOGIN STREAK -------- */
  function updateConsecutiveDays() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const lastLoginStr = localStorage.getItem("lastLoginDate");
    let streak = parseInt(localStorage.getItem("loginStreak")) || 0;

    if (lastLoginStr === todayStr) {
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      streak = lastLoginStr === yesterdayStr ? streak + 1 : 1;
      localStorage.setItem("lastLoginDate", todayStr);
      localStorage.setItem("loginStreak", streak);
    }

    const streakEl = document.getElementById("login-streak");
    if (streakEl) streakEl.innerText = `🔥 ${streak}`;
  }

  updateConsecutiveDays();

  /* -------- CALENDAR & WEEKLY GRID -------- */
  const monthNames = [
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

  const today = new Date();

  const grid = document.getElementById("calendar-grid");
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let currentView = "month";

  let weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  function formatDate(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function getDayProgress(dateStr) {
    if (habits.length === 0) return 0;
    let done = 0;
    habits.forEach((h) => {
      if (h.history && h.history[dateStr]) done++;
    });
    return Math.round((done / habits.length) * 100);
  }

  function getProgressColor(percent) {
    if (percent === 100) return "bg-success text-white";
    if (percent >= 75) return "bg-info text-white";
    if (percent >= 50) return "bg-warning text-dark";
    if (percent > 0) return "bg-peach";
    return "bg-light";
  }

  function renderWeeklyGrid() {
    const gridEl = document.getElementById("weekly-grid");
    if (!gridEl) return;
    gridEl.innerHTML = "";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dateStr = formatDate(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
      );
      const percent = getDayProgress(dateStr);
      const colorClass = getProgressColor(percent);
      const isToday = day.toDateString() === today.toDateString();

      const dayDiv = document.createElement("div");
      dayDiv.className = `text-center day-item flex-fill px-2 py-3 rounded ${colorClass} ${isToday ? "border border-dark" : ""}`;
      dayDiv.innerHTML = `${dayNames[i]}<br><span class="fw-bold">${day.getDate()}</span>`;
      gridEl.appendChild(dayDiv);
    }

    const weekLabel = document.getElementById("week-label");
    if (weekLabel) {
      weekLabel.innerText = `Week of ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()}`;
    }
  }

  window.changeWeek = (dir) => {
    weekStart.setDate(weekStart.getDate() + dir * 7);
    renderWeeklyGrid();
  };

  function buildMonthView(month, year) {
    if (!grid) return;
    grid.innerHTML = "";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(7,1fr)";
    grid.style.gap = "5px";

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(
      (h) =>
        (grid.innerHTML += `<div class="fw-bold text-muted small text-center">${h}</div>`),
    );

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) grid.innerHTML += "<div></div>";

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const percent = getDayProgress(dateStr);
      const color = getProgressColor(percent);
      const border =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
          ? "border border-dark rounded"
          : "";
      grid.innerHTML += `<div class="cal-box ${color} ${border} text-center"><div>${day}<div class="small fw-bold">${percent}%</div></div></div>`;
    }
  }

  function buildYearView(year) {
    if (!grid) return;
    grid.innerHTML = "";
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.justifyContent = "center";
    grid.style.gap = "15px";

    for (let m = 0; m < 12; m++) {
      const monthBox = document.createElement("div");
      monthBox.className = "month-box p-2 rounded-3 shadow-sm border";
      monthBox.style.width = "220px";
      monthBox.style.flexShrink = "0";
      monthBox.innerHTML = `<div class="month-label fw-bold text-center mb-1">${monthNames[m]}</div>`;
      const monthGrid = document.createElement("div");
      monthGrid.style.display = "grid";
      monthGrid.style.gridTemplateColumns = "repeat(7,1fr)";
      monthGrid.style.gap = "3px";

      const firstDay = new Date(year, m, 1).getDay();
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) monthGrid.innerHTML += "<div></div>";

      const today = new Date();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(year, m, day);
        const percent = getDayProgress(dateStr);
        const color = getProgressColor(percent);
        const border =
          day === today.getDate() &&
          m === today.getMonth() &&
          year === today.getFullYear()
            ? "border border-dark rounded"
            : "";
        monthGrid.innerHTML += `<div class="cal-box ${color} ${border}" title="${percent}%">${day}</div>`;
      }

      monthBox.appendChild(monthGrid);
      grid.appendChild(monthBox);
    }
  }

  function updateMonthLabel() {
    const label = document.getElementById("month-label");
    if (!label) return;
    label.innerText =
      currentView === "month"
        ? `${monthNames[currentMonth]} ${currentYear}`
        : `Year: ${currentYear}`;
  }

  window.changeMonth = (dir) => {
    if (currentView === "month") {
      currentMonth += dir;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    } else currentYear += dir;
    buildCalendar();
  };

  function toggleCalendarView(view) {
    currentView = view;
    const viewMonthBtn = document.getElementById("viewMonth");
    const viewYearBtn = document.getElementById("viewYear");
    if (viewMonthBtn && viewYearBtn) {
      viewMonthBtn.classList.toggle("active", view === "month");
      viewYearBtn.classList.toggle("active", view === "year");
    }
    buildCalendar();
  }

  function buildCalendar() {
    if (currentView === "month") buildMonthView(currentMonth, currentYear);
    else buildYearView(currentYear);
    updateMonthLabel();
  }

  function renderWeeklyProgress() {
    /* optional extra, can implement later */
  }

  /* -------- BUTTONS -------- */
  const fabBtn = document.querySelector(".fab-btn");
  if (fabBtn) fabBtn.addEventListener("click", () => window.openHabitModal());
  const viewMonthBtn = document.getElementById("viewMonth");
  const viewYearBtn = document.getElementById("viewYear");
  if (viewMonthBtn)
    viewMonthBtn.addEventListener("click", () => toggleCalendarView("month"));
  if (viewYearBtn)
    viewYearBtn.addEventListener("click", () => toggleCalendarView("year"));

  /* --initial render-- */
  renderHabits();
  buildCalendar();
  renderWeeklyGrid();
});

/* -- Nav bar dash icon --*/
window.moveNavIndicator = (percent) => {
  const navBar = document.querySelector(".app-nav");
  if (navBar) {
    navBar.style.setProperty("--active-offset", percent + "%");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("profile.php")) {
    moveNavIndicator(72.5);
  } else if (path.includes("dashboard.php")) {
    moveNavIndicator(27.5);
  } else {
    // Default to + icon if no specific page matches
    moveNavIndicator(50);
  }
});
