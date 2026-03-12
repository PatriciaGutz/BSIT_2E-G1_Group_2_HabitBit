document.addEventListener("DOMContentLoaded", () => {

  /* -------- DAILY QUOTE -------- */
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

  if (month === 11 && date === 25) finalQuote = "🎄 Merry Christmas! Celebrate with joy and better habits!";
  else if (month === 0 && date === 1) finalQuote = "🎆 Happy New Year! New Year, New Bits. Build your future today!";
  else {
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    finalQuote = quotes[dayOfYear % quotes.length];
  }

  const dailyQuoteEl = document.getElementById("daily-quote");
  if (dailyQuoteEl) dailyQuoteEl.innerText = finalQuote;

  /* -------- HABITS LOGIC -------- */
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
      if (input) input.value = "";
    });
    const descBox = document.getElementById("descBox");
    if (descBox) descBox.style.display = "none";
  };

  window.toggleDesc = () => {
    const box = document.getElementById("descBox");
    if (box) box.style.display = box.style.display === "block" ? "none" : "block";
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

    if (!icon.value.trim()) {
      return Swal.fire({ icon: 'error', title: 'Missing a bit!', text: 'Please enter a habit icon(emoji).', confirmButtonColor: '#ffb347' });
    }

    if (!title.value.trim()) {
      return Swal.fire({ icon: 'error', title: 'Missing a bit!', text: 'Please enter a habit title.', confirmButtonColor: '#ffb347' });
    }

    const habitData = {
      icon: icon.value.trim(),
      title: title.value.trim(),
      repeat: repeat.value || "Daily",
      time: time.value || "12:00",
      desc: desc.value,
      done: editIndex !== null ? habits[editIndex].done : false
    };

    if (editIndex === null) habits.push(habitData);
    else habits[editIndex] = habitData;

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
    const todayStr = new Date().toISOString().split('T')[0]; // today's date
    habits[i].done = !habits[i].done;

    if (!habits[i].history) habits[i].history = {};
    habits[i].history[todayStr] = habits[i].done; // sync with calendar

    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    buildCalendar();
    renderWeeklyGrid();
}

  window.deleteHabit = (i) => {
    Swal.fire({
      title: 'Delete habit?',
      text: "Are you sure? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#333',
      confirmButtonText: 'Yes, delete it.'
    }).then((result) => {
      if (result.isConfirmed) {
        habits.splice(i, 1);
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits();
      }
    });
  };

  window.completeAll = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    habits.forEach(h => {
        h.done = true;
        if (!h.history) h.history = {};
        h.history[todayStr] = true; 
    });
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    buildCalendar();
    renderWeeklyGrid();
}

  function updateProgress() {
    if (!elements.bar) return;
    const done = habits.filter(h => h.done).length;
    const total = habits.length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    elements.bar.style.width = `${percent}%`;
    elements.count.innerText = `${done}/${total} Habits done`;
    elements.text.innerText = `${percent}%`;
  }

  /* -------- LOGIN STREAK -------- */
  function updateConsecutiveDays() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const lastLoginStr = localStorage.getItem('lastLoginDate');
    let streak = parseInt(localStorage.getItem('loginStreak')) || 0;

    if (lastLoginStr === todayStr) {}
    else {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      streak = lastLoginStr === yesterdayStr ? streak + 1 : 1;
      localStorage.setItem('lastLoginDate', todayStr);
      localStorage.setItem('loginStreak', streak);
    }

    const streakEl = document.getElementById('login-streak');
    if (streakEl) streakEl.innerText = `🔥 ${streak}`;
  }

  updateConsecutiveDays();

  /* -------- CALENDAR & WEEKLY GRID -------- */
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const grid = document.getElementById("calendar-grid");
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let currentView = "month";

  let weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  function formatDate(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

  function getDayProgress(dateStr){
    if(habits.length===0) return 0;
    let done = 0;
    habits.forEach(h => {
      if(h.history && h.history[dateStr]) done++;
    });
    return Math.round((done/habits.length)*100);
  }

  function getProgressColor(percent){
    if(percent===100) return "bg-success text-white";
    if(percent>=75) return "bg-info text-white";
    if(percent>=50) return "bg-warning text-dark";
    if(percent>0) return "bg-peach";
    return "bg-light";
  }

  function renderWeeklyGrid(){
    const gridEl = document.getElementById("weekly-grid");
    if(!gridEl) return;
    gridEl.innerHTML = "";
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const today = new Date();

    for(let i=0;i<7;i++){
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate()+i);
      const dateStr = formatDate(day.getFullYear(),day.getMonth(),day.getDate());
      const percent = getDayProgress(dateStr);
      const colorClass = getProgressColor(percent);
      const isToday = day.toDateString() === today.toDateString();

      const dayDiv = document.createElement("div");
      dayDiv.className = `text-center day-item flex-fill px-2 py-3 rounded ${colorClass} ${isToday?'border border-dark':''}`;
      dayDiv.innerHTML = `${dayNames[i]}<br><span class="fw-bold">${day.getDate()}</span>`;
      gridEl.appendChild(dayDiv);
    }

    const weekLabel = document.getElementById("week-label");
    if(weekLabel){
      weekLabel.innerText = `Week of ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()}`;
    }
  }

  window.changeWeek = (dir) => {
    weekStart.setDate(weekStart.getDate() + dir*7);
    renderWeeklyGrid();
  }

  function buildMonthView(month,year){
    if(!grid) return;
    grid.innerHTML = "";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(7,1fr)";
    grid.style.gap = "5px";

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(h => grid.innerHTML += `<div class="fw-bold text-muted small text-center">${h}</div>`);

    const firstDay = new Date(year, month,1).getDay();
    const daysInMonth = new Date(year,month+1,0).getDate();
    for(let i=0;i<firstDay;i++) grid.innerHTML += "<div></div>";

    const today = new Date();
    for(let day=1;day<=daysInMonth;day++){
      const dateStr = formatDate(year,month,day);
      const percent = getDayProgress(dateStr);
      const color = getProgressColor(percent);
      const border = (day===today.getDate() && month===today.getMonth() && year===today.getFullYear()) ? "border border-dark rounded" : "";
      grid.innerHTML += `<div class="cal-box ${color} ${border} text-center"><div>${day}<div class="small fw-bold">${percent}%</div></div></div>`;
    }
  }

  function buildYearView(year){
    if(!grid) return;
    grid.innerHTML = "";
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.justifyContent = "center";
    grid.style.gap = "15px";

    for(let m=0;m<12;m++){
      const monthBox = document.createElement("div");
      monthBox.className = "month-box p-2 rounded-3 shadow-sm border";
      monthBox.style.width = "220px"; monthBox.style.flexShrink="0";
      monthBox.innerHTML = `<div class="month-label fw-bold text-center mb-1">${monthNames[m]}</div>`;
      const monthGrid = document.createElement("div");
      monthGrid.style.display = "grid";
      monthGrid.style.gridTemplateColumns="repeat(7,1fr)";
      monthGrid.style.gap="3px";

      const firstDay = new Date(year,m,1).getDay();
      const daysInMonth = new Date(year,m+1,0).getDate();
      for(let i=0;i<firstDay;i++) monthGrid.innerHTML+="<div></div>";

      const today = new Date();
      for(let day=1;day<=daysInMonth;day++){
        const dateStr = formatDate(year,m,day);
        const percent = getDayProgress(dateStr);
        const color = getProgressColor(percent);
        const border = (day===today.getDate() && m===today.getMonth() && year===today.getFullYear()) ? "border border-dark rounded" : "";
        monthGrid.innerHTML += `<div class="cal-box ${color} ${border}" title="${percent}%">${day}</div>`;
      }

      monthBox.appendChild(monthGrid);
      grid.appendChild(monthBox);
    }
  }

  function updateMonthLabel(){
    const label = document.getElementById("month-label");
    if(!label) return;
    label.innerText = currentView==="month" ? `${monthNames[currentMonth]} ${currentYear}` : `Year: ${currentYear}`;
  }

  window.changeMonth = (dir) => {
    if(currentView==="month"){
      currentMonth += dir;
      if(currentMonth>11){currentMonth=0; currentYear++;}
      if(currentMonth<0){currentMonth=11; currentYear--;}
    } else currentYear += dir;
    buildCalendar();
  }

  function toggleCalendarView(view){
    currentView=view;
    const viewMonthBtn=document.getElementById("viewMonth");
    const viewYearBtn=document.getElementById("viewYear");
    if(viewMonthBtn && viewYearBtn){
      viewMonthBtn.classList.toggle('active',view==='month');
      viewYearBtn.classList.toggle('active',view==='year');
    }
    buildCalendar();
  }

  function buildCalendar(){
    if(currentView==="month") buildMonthView(currentMonth,currentYear);
    else buildYearView(currentYear);
    updateMonthLabel();
  }

  function renderWeeklyProgress(){ /* optional extra, can implement later */ }

  /* -------- BUTTONS -------- */
  const fabBtn=document.querySelector(".fab-btn");
  if(fabBtn) fabBtn.addEventListener("click",()=>window.openHabitModal());
  const viewMonthBtn = document.getElementById("viewMonth");
  const viewYearBtn = document.getElementById("viewYear");
  if(viewMonthBtn) viewMonthBtn.addEventListener("click",()=>toggleCalendarView('month'));
  if(viewYearBtn) viewYearBtn.addEventListener("click",()=>toggleCalendarView('year'));

  /* -------- INITIAL RENDER -------- */
  renderHabits();
  buildCalendar();
  renderWeeklyGrid();

});