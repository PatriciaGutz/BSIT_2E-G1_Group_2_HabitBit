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

/* Services Logic */

let habits = JSON.parse(localStorage.getItem('habits')) || []; 
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
        time: document.getElementById("habitTime"),
        desc: document.getElementById("habitDesc")
    }
};

window.openHabitModal = () => {
    if (elements.modal) {
        elements.modal.style.display = "flex";
        elements.modalTitle.innerText = "Create new Habit";
    }
};

window.closeHabitModal = () => {
    if (elements.modal) elements.modal.style.display = "none";
    editIndex = null;
    Object.values(elements.inputs).forEach(input => { 
        if(input) input.value = ""; 
    });
    document.getElementById("descBox").style.display = "none";
};

window.toggleDesc = () => {
    const box = document.getElementById("descBox");
    if (box) {
        const isHidden = box.style.display === "none" || box.style.display === "";
        box.style.display = isHidden ? "block" : "none";
    }
};

window.editHabit = (index) => {
    editIndex = index;
    const habit = habits[index];
    
    if (elements.inputs.icon) elements.inputs.icon.value = habit.icon || "";
    elements.inputs.title.value = habit.title;
    elements.inputs.repeat.value = habit.repeat;
    elements.inputs.time.value = habit.time;
    elements.inputs.desc.value = habit.desc || "";
    
    elements.modal.style.display = "flex";
    elements.modalTitle.innerText = "Edit Habit";
    
    if (habit.desc) document.getElementById("descBox").style.display = "block";
};

window.saveHabit = () => {
    const { icon, title, repeat, time, desc } = elements.inputs;

    
    if(!icon || !icon.value.trim()){
        return Swal.fire({
            icon: 'error', 
            title: 'Missing a bit!', 
            text: 'Please enter a habit icon(emoji).', 
            confirmButtonColor: '#ffb347'
        });
    }
    
    
    if (!title.value.trim()) {
        return Swal.fire({ 
            icon: 'error', 
            title: 'Missing a bit!', 
            text: 'Please enter a habit title.', 
            confirmButtonColor: '#ffb347' 
        });
    }

    const habitData = {
        icon: icon.value.trim(),
        title: title.value.trim(),
        repeat: repeat.value || "Daily",
        time: time.value || "12:00",
        desc: desc.value,
        done: editIndex !== null ? habits[editIndex].done : false
    };

    if (editIndex === null) {
        habits.push(habitData);
    } else {
        habits[editIndex] = habitData;
    }

    localStorage.setItem('habits', JSON.stringify(habits));
    closeHabitModal();
    renderHabits();
    Swal.fire({ icon: 'success', title: 'Saved!', showConfirmButton: false, timer: 1500 });
};

function renderHabits() {
    if (!elements.list) return;
    
    elements.list.innerHTML = habits.length === 0 
        ? `<p class="text-center text-muted p-4">No habits yet. Tap + to start!</p>`
        : habits.map((h, i) => `
            <div class="habit-row d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div style="max-width: 60%">
                    <div class="fw-bold ${h.done ? 'text-decoration-line-through text-muted' : ''}">
                        ${h.icon || '✨'} ${h.title}
                    </div>
                    <div class="text-muted small">${h.repeat} • ${h.time}</div>
                </div>
                <div class="d-flex gap-2">
                    <button class="complete-btn ${h.done ? 'btn-success' : 'btn-outline-success'}" onclick="toggleDone(${i})">
                        ${h.done ? "✓" : "Done"}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="editHabit(${i})">✎</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteHabit(${i})">✕</button>
                </div>
            </div>`).join('');
            
    updateProgress();
}

window.toggleDone = (i) => {
    habits[i].done = !habits[i].done;
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
};

window.deleteHabit = (i) => {
    Swal.fire({
        title: 'Delete habit?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#333',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            habits.splice(i, 1);
            localStorage.setItem('habits', JSON.stringify(habits));
            renderHabits();
        }
    });
};

window.completeAll = () => {
    habits.forEach(h => h.done = true);
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
};

function updateProgress() {
    if (!elements.bar) return;
    const done = habits.filter(h => h.done).length;
    const total = habits.length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    
    elements.bar.style.width = `${percent}%`;
    elements.count.innerText = `${done}/${total} Habits done`;
    elements.text.innerText = `${percent}%`;
}

document.addEventListener("DOMContentLoaded", renderHabits);

/*ABOUT PAGE SPECIFIC LOGIC*/
const fabBtn = document.querySelector(".fab-btn");
if (fabBtn && window.location.pathname.includes("about.html")) {
  fabBtn.addEventListener("click", () => {
    console.log("HabitBit FAB clicked on About Page");
  });
}
