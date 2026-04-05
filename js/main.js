document.addEventListener("DOMContentLoaded", () => {
  /* -------- HABITS LOGIC -------- */
  let deleteMode = false;
  let selectedToDelete = [];
  let habits = [];
  let editIndex = null;

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
      hour: document.getElementById("habitHour"),
      minute: document.getElementById("habitMinute"),
      period: document.getElementById("habitPeriod"),
      desc: document.getElementById("habitDesc"),
    },
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

      if (elements.inputs.repeat) elements.inputs.repeat.value = "Daily";
      if (elements.inputs.hour) elements.inputs.hour.value = "";
      if (elements.inputs.minute) elements.inputs.minute.value = "";
      if (elements.inputs.period) elements.inputs.period.value = "AM";
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
    elements.inputs.repeat.value = habit.repeat_type || habit.repeat || "Daily";
    elements.inputs.desc.value = habit.description || habit.desc || "";

    if (habit.time_slot || habit.time) {
      const timeStr = habit.time_slot || habit.time;
      const timeParts = timeStr.split(" ");
      if (timeParts.length === 2) {
        const hm = timeParts[0].split(":");
        const period = timeParts[1];

        if (hm.length === 2) {
          elements.inputs.hour.value = String(parseInt(hm[0], 10));
          elements.inputs.minute.value = hm[1];
          elements.inputs.period.value = period;
        }
      }
    }

    if (elements.modal) elements.modal.style.display = "flex";
    elements.modalTitle.innerText = "Edit Habit";

    const descBox = document.getElementById("descBox");
    if ((habit.description || habit.desc) && descBox)
      descBox.style.display = "block";
  };

  async function loadHabits() {
    try {
      const response = await fetch("api/habits.php");
      console.log("Load habits status:", response.status);
      if (!response.ok) {
        console.error("Load habits failed:", await response.text());
      }
      if (response.ok) {
        habits = await response.json();
        // Map DB fields to JS expected fields (preserve is_done)
        habits = habits.map((h) => ({
          ...h,
          done: !!h.is_done,
          repeat: h.repeat_type,
          time: h.time_slot,
          desc: h.description,
        }));
      }
    } catch (error) {
      console.error("Load habits failed:", error);
      habits = [];
    }
    renderHabits();
    buildCalendar();
    renderWeeklyGrid();
  }

  window.saveHabit = async () => {
    const { icon, title, repeat, hour, minute, period, desc } = elements.inputs;

    if (!icon.value.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Missing a bit!",
        text: "Please enter a habit icon (emoji).",
        confirmButtonColor: "#ffb347",
      });
    }

    if (!title.value.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Missing a bit!",
        text: "Please enter a habit title.",
        confirmButtonColor: "#ffb347",
      });
    }

    const hourValue = parseInt(hour.value, 10);
    const minuteValue = parseInt(minute.value, 10);

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
        title: "Invalid minute",
        text: "Please enter minutes from 0 to 59.",
        confirmButtonColor: "#ffb347",
      });
    }

    const formattedTime = `${hourValue}:${String(minuteValue).padStart(2, "0")} ${period.value}`;

    const habitData = {
      icon: icon.value.trim() || "✨",
      title: title.value.trim(),
      repeat_type: repeat.value || "Daily",
      time_slot: formattedTime,
      description: desc.value || "",
      is_done: editIndex !== null ? habits[editIndex].is_done || 0 : 0,
    };

    try {
      const response = await fetch("api/habits.php", {
        method: editIndex !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          ...habitData,
          id: editIndex !== null ? habits[editIndex].id : "",
        }),
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
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: result.error || "Save failed",
          confirmButtonColor: "#ffb347",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Network error",
        text: "Check server connection",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  // Update renderHabits
  window.renderHabits = function () {
    if (!elements.list) return;

    const cardColors = ["#f7c6b6", "#bfeaf2", "#d8f3c0", "#fbe7a1", "#d9c2f0"];

    if (habits.length === 0) {
      elements.list.innerHTML = `<p class="text-center text-muted p-4">No habits yet. Tap + to start!</p>`;
      updateProgress();
      return;
    }

    elements.list.innerHTML = `
  ${
    deleteMode
      ? `
    <div class="d-flex justify-content-end gap-2 mb-3">
      <button class="btn btn-danger btn-sm rounded-pill px-3" onclick="confirmDeleteSelected()">Delete Selected</button>
      <button class="btn btn-secondary btn-sm rounded-pill px-3" onclick="cancelDeleteMode()">Cancel</button>
    </div>
  `
      : ""
  }
  <div class="row g-3">
      ${habits
        .map((h, i) => {
          const bgColor = cardColors[i % cardColors.length];

          return `
            <div class="col-md-6">
  <div 
  class="habit-card ${deleteMode ? "delete-mode-card" : ""}" 
  style="background-color: ${bgColor}; color: #333; cursor: ${deleteMode ? "pointer" : "default"}; border: ${deleteMode ? "2px dashed #d33" : "none"};"
>
                <div class="habit-text-section">
                  <div class="habit-title ${h.done ? "crossed-out" : ""}" style="color:#333;">
                    ${h.icon || "✨"} ${h.title}
                  </div>
                  <div class="habit-meta" style="color:#333;">
                    <i class="bi bi-calendar3"></i> Repeat: ${h.repeat}
                  </div>
                  <div class="habit-meta" style="color:#333;">
                    ${h.time}
                  </div>
                </div>

                ${
                  deleteMode
                    ? `
      <button
        class="btn rounded-circle d-flex align-items-center justify-content-center"
        style="
          width: 32px;
          height: 32px;
          border: 2px solid #333;
          background: ${selectedToDelete.includes(i) ? "#d33" : "#fff"};
          color: ${selectedToDelete.includes(i) ? "#fff" : "#333"};
          flex-shrink: 0;
        "
        onclick="event.stopPropagation(); toggleHabitSelection(${i})"
      >
        ${selectedToDelete.includes(i) ? "✓" : ""}
      </button>
    `
                    : `
      <div class="dropdown">
        <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="color:#333;">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <button class="dropdown-item" onclick="toggleDone(${i})">
              ${h.done ? "Mark as Undone" : "Mark as Done"}
            </button>
          </li>
          <li>
            <button class="dropdown-item" onclick="editHabit(${i})">
              Edit
            </button>
          </li>
          <li>
            <button class="dropdown-item text-danger" onclick="deleteHabit(${i})">
              Delete
            </button>
          </li>
        </ul>
      </div>
    `
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

    updateProgress();
  };

  window.toggleDone = async (i) => {
    const habit = habits[i];
    if (!habit.id)
      return Swal.fire({
        icon: "warning",
        text: "No ID",
        confirmButtonColor: "#ffb347",
      });

    const currentDoneState = habit.is_done || habit.done || false;
    const newDone = !currentDoneState;

    console.log("=== TOGGLE DEBUG ===");
    console.log(
      "Habit:",
      habit.id,
      "Current:",
      currentDoneState,
      "→ New:",
      newDone,
    );
    console.log(
      "Total habits:",
      habits.length,
      "is_done count:",
      habits.filter((h) => h.is_done).length,
    );

    try {
      const response = await fetch("api/habits.php", {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          id: habit.id,
          title: habit.title || "Untitled",
          is_done: newDone ? 1 : 0,
        }),
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("API result:", result);

      if (result.success) {
        console.log("Reloading habits...");
        await loadHabits();
        console.log(
          "Post-reload habits:",
          habits.length,
          "done:",
          habits.filter((h) => h.is_done).length,
        );
        console.log(
          "Expected %:",
          Math.round(
            (habits.filter((h) => h.is_done).length / habits.length) * 100,
          ),
        );

        Swal.fire({
          icon: newDone ? "success" : "info",
          title: newDone ? "✅ Done!" : "↩️ Undone",
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        console.error("API failed:", result);
        Swal.fire({
          icon: "error",
          text: result.error || "API Error",
          confirmButtonColor: "#ffb347",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  window.deleteHabit = async (i) => {
    const habit = habits[i];
    if (!habit || !habit.id) {
      Swal.fire({
        icon: "warning",
        title: "No habit selected",
        confirmButtonColor: "#ffb347",
      });
      return;
    }

    Swal.fire({
      title: "Delete habit?",
      text: "Are you sure? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#333",
      confirmButtonText: "Yes, delete it.",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch("api/habits.php", {
            method: "DELETE",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ id: habit.id }),
          });

          const result = await response.json();
          if (result.success) {
            await loadHabits();
          } else {
            Swal.fire({
              icon: "error",
              text: result.error,
              confirmButtonColor: "#ffb347",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Network error",
            confirmButtonColor: "#ffb347",
          });
        }
      }
    });
  };

  window.toggleDeleteMode = () => {
    if (!habits || habits.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No habits yet",
        text: "There is no habit to delete.",
        confirmButtonColor: "#ffb347",
      });
      return;
    }

    deleteMode = !deleteMode;
    selectedToDelete = [];

    const fabMenu = document.getElementById("fabMenu");
    if (fabMenu) fabMenu.classList.remove("open");

    renderHabits();
  };

  window.toggleHabitSelection = (i) => {
    if (!deleteMode) return;

    const index = selectedToDelete.indexOf(i);

    if (index > -1) {
      selectedToDelete.splice(index, 1);
    } else {
      selectedToDelete.push(i);
    }

    renderHabits();
  };

  window.confirmDeleteSelected = () => {
    if (!deleteMode) return;

    if (selectedToDelete.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No habits selected",
        text: "Please select at least one habit to delete.",
        confirmButtonColor: "#ffb347",
      });
      return;
    }

    Swal.fire({
      title: "Delete selected habits?",
      text: `You selected ${selectedToDelete.length} habit(s). This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#333",
      confirmButtonText: "Yes, delete them",
    }).then((result) => {
      if (result.isConfirmed) {
        habits = habits.filter((_, index) => !selectedToDelete.includes(index));

        deleteMode = false;
        selectedToDelete = [];

        renderHabits();

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Selected habits have been removed.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  window.cancelDeleteMode = () => {
    deleteMode = false;
    selectedToDelete = [];
    renderHabits();
  };

  window.completeAll = async () => {
    if (habits.length === 0) return;

    try {
      const promises = habits.map((h) =>
        fetch("api/habits.php", {
          method: "PUT",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            id: h.id,
            title: h.title,
            is_done: 1,
          }),
        }),
      );
      await Promise.all(promises);
      await loadHabits();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Complete failed",
        confirmButtonColor: "#ffb347",
      });
    }
  };

  function updateProgress() {
    if (!elements.bar) return;
    const done = habits.filter((h) => h.is_done).length;
    const total = habits.length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    elements.bar.style.width = `${percent}%`;
    elements.count.innerText = `${done}/${total} Habits done`;
    elements.text.innerText = `${percent}%`;
  }

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
  const grid = document.getElementById("calendar-grid");

  const today = new Date();

  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let currentView = "month";

  let weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  function formatDate(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function getDayProgress(dateStr) {
    console.log("getDayProgress for date:", dateStr);
    if (habits.length === 0) return 0;

    // Per-day tracking: only today gets current progress
    const todayStr = new Date().toISOString().split("T")[0];

    if (dateStr === todayStr) {
      let todayDone = 0;
      habits.forEach((h) => {
        if (h.is_done) todayDone++;
      });
      const percent =
        habits.length > 0 ? Math.round((todayDone / habits.length) * 100) : 0;
      console.log("TODAY progress:", percent + "%");
      return percent;
    }

    // Other days: 0% (no historical data)
    console.log(dateStr, "no data → 0%");
    return 0;
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
      const isToday = day.toDateString() === new Date().toDateString();

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

  