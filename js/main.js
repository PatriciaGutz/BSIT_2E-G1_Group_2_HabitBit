document.addEventListener("DOMContentLoaded", function () {

    /* daily quotes */
    const quotes = [
        "Philippians 4:13 - I can do all things through Christ who strengthens me.",
        "Every habit is a bit of progress toward the person you are becoming.",
        "You are not slow, you are on God's time.",
        "Consistency beats intensity, keep going!",
        "HabitBit: Where small bits create big breakthroughs.",
        "A bit of progress is still progress.",
        "Track today, improve tomorrow."
    ];

    const today = new Date();
    const month = today.getMonth();
    const date = today.getDate();
    let finalQuote = "";

    if (month === 11 && date === 25) {
        finalQuote = "🎄 Merry Christmas! Celebrate with joy and better habits!";
    } else if (month === 0 && date === 1) {
        finalQuote = "🎆 Happy New Year! New Year, New Bits. Build your future today!";
    } else {
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        finalQuote = quotes[dayOfYear % quotes.length];
    }

    document.getElementById("daily-quote").innerText = finalQuote;

    /*calendar*/
    const grid = document.getElementById("calendar-grid");

    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function updateMonthLabel() {
        document.getElementById("month-label").innerText =
            `${monthNames[currentMonth]} ${currentYear}`;
    }

    function buildCalendar() {
        grid.innerHTML = "";

        const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        headers.forEach(h => {
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
});
