/*DAILY QUOTES LOGIC*/
const quotes = [
  "Philippians 4:13 - I can do all things through Christ who strengthens me.",
  "Every habit is a bit of progress toward the person you are becoming.",
  "You are not slow, you are on God's time.",
  "Consistency beats intensity, keep going!",
  "HabitBit: Where small bits create big breakthroughs.",
  "A bit of progress is still progress.",
  "Track today, improve tomorrow.",
];

const today = new Date();
const month = today.getMonth();
const date = today.getDate();
let finalQuote = "";

if (month === 11 && date === 25) {
  finalQuote = "🎄 Merry Christmas! Celebrate with joy and better habits!";
} else if (month === 0 && date === 1) {
  finalQuote =
    "🎆 Happy New Year! New Year, New Bits. Build your future today!";
} else {
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  finalQuote = quotes[dayOfYear % quotes.length];
}

const dailyQuoteEl = document.getElementById("daily-quote");
if (dailyQuoteEl) {
  dailyQuoteEl.innerText = finalQuote;
}

/*CALENDAR LOGIC */
const grid = document.getElementById("calendar-grid");
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

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

function updateMonthLabel() {
  const monthLabelEl = document.getElementById("month-label");
  if (monthLabelEl) {
    monthLabelEl.innerText = `${monthNames[currentMonth]} ${currentYear}`;
  }
}

function buildCalendar() {
  if (!grid) return;
  grid.innerHTML = "";

  const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  headers.forEach((h) => {
    grid.innerHTML += `<div class="fw-bold text-muted small">${h}</div>`;
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    let color = "";
    if ([1, 10, 24].includes(day)) color = "bg-success text-white";
    else if ([5, 6, 9].includes(day)) color = "bg-info text-white";
    else if ([4, 7, 18].includes(day)) color = "bg-warning text-white";
    else if ([2, 8, 20].includes(day)) color = "bg-peach";

    if (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    ) {
      color += " border border-dark";
    }
    grid.innerHTML += `<div class="cal-box ${color}">${day}</div>`;
  }
}

window.changeMonth = function (dir) {
  currentMonth += dir;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateMonthLabel();
  buildCalendar();
};

updateMonthLabel();
buildCalendar();

/*CONTACT FORM LOGIC*/
const form = document.getElementById("contactForm");
const alertBox = document.getElementById("formAlert");

if (form && alertBox) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.checkValidity()) {
      alertBox.innerText = "✅ Your message has been submitted successfully!";
      alertBox.classList.remove("d-none");
      form.reset();
      setTimeout(() => {
        alertBox.classList.add("d-none");
      }, 5000);
    } else {
      form.reportValidity();
    }
  });
}

/*GALLERY & GLOBAL INTERACTIVITY*/
document.addEventListener("DOMContentLoaded", function () {
  console.log("HABITBIT SYSTEM: All modules loaded.");

  const scrollContainers = document.querySelectorAll(".scroll-container");
  if (scrollContainers.length > 0) {
    scrollContainers.forEach((container) => {
      container.addEventListener("wheel", (evt) => {
        evt.preventDefault();
        container.scrollLeft += evt.deltaY;
      });
    });
  }
});

/*SERVICES & HABIT TRACKER LOGIC */
const habitModal = document.getElementById("habitModal");
const habitTitle = document.getElementById("habitTitle");
const habitRepeat = document.getElementById("habitRepeat");
const habitTime = document.getElementById("habitTime");
const habitList = document.getElementById("habit-list");

const todayProgressBar = document.getElementById("today-progress-bar");
const todayProgressCount = document.getElementById("today-progress-count");
const todayProgressText = document.getElementById("today-progress-text");

window.openHabitModal = function () {
  if (habitModal) habitModal.style.display = "flex";
};
window.closeHabitModal = function () {
  if (habitModal) habitModal.style.display = "none";
  editIndex = null;
  const descBox = document.getElementById("descBox");
  if (descBox) descBox.style.display = "none";
  const habitDesc = document.getElementById("habitDesc");
  if (habitDesc) habitDesc.value = "";
};

window.onclick = function (e) {
  if (e.target === habitModal) closeHabitModal();
};

let habits = [];
let editIndex = null;

window.saveHabit = function () {
  const title = habitTitle.value;
  const repeat = habitRepeat.value;
  const time = habitTime.value;
  const descInput = document.getElementById("habitDesc");
  const desc = descInput ? descInput.value : "";

  if (!title) return;
  if (editIndex === null) {
    habits.push({ title, desc, repeat, time, done: false });
  } else {
    habits[editIndex] = { ...habits[editIndex], title, desc, repeat, time };
  }
  closeHabitModal();
  renderHabits();
};

function renderHabits() {
  if (!habitList) return;
  habitList.innerHTML = "";
  habits.forEach((h, i) => {
    habitList.innerHTML += `
            <div class="habit-row d-flex justify-content-between align-items-center">
                <div>
                    <strong class="habit-title">
                        ${h.title}
                        <span class="tooltip">${h.desc || "No description"}</span>
                    </strong>
                    <div class="text-muted small">${h.repeat} • ${h.time}</div>
                </div>
                <div>
                    <button class="complete-btn" onclick="toggleDone(${i})">${h.done ? "Done" : "Mark"}</button>
                    <button class="btn btn-sm btn-light" onclick="editHabit(${i})">Edit</button>
                    <button class="btn btn-sm btn-light" onclick="deleteHabit(${i})">✕</button>
                </div>
            </div>`;
  });
  updateProgress();
}

window.editHabit = function (i) {
  editIndex = i;
  openHabitModal();
  habitTitle.value = habits[i].title;
  habitRepeat.value = habits[i].repeat;
  habitTime.value = habits[i].time;
  document.getElementById("habitDesc").value = habits[i].desc || "";
};

window.toggleDesc = function () {
  const box = document.getElementById("descBox");
  if (box) box.style.display = box.style.display === "block" ? "none" : "block";
};

window.toggleDone = function (i) {
  habits[i].done = !habits[i].done;
  renderHabits();
};
window.deleteHabit = function (i) {
  habits.splice(i, 1);
  renderHabits();
};
window.completeAll = function () {
  habits.forEach((h) => (h.done = true));
  renderHabits();
};

function updateProgress() {
  if (!todayProgressBar) return;
  const done = habits.filter((h) => h.done).length;
  const total = habits.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  todayProgressBar.style.width = percent + "%";
  if (todayProgressCount)
    todayProgressCount.innerText = `${done}/${total} Habits done`;
  if (todayProgressText) todayProgressText.innerText = percent + "%";
}

/*ABOUT PAGE SPECIFIC LOGIC*/
const fabBtn = document.querySelector(".fab-btn");
if (fabBtn && window.location.pathname.includes("about.html")) {
  fabBtn.addEventListener("click", () => {
    console.log("HabitBit FAB clicked on About Page");
  });
}
