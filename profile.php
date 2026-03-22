<!DOCTYPE html>
<html lang="en">
<script>
document.addEventListener("DOMContentLoaded", function () {
    const user = JSON.parse(localStorage.getItem('registeredUser'));

    if (!user) {
        console.log("No user found in localStorage");
        return;
    }

    const fullName = (user.firstName || "") + " " + (user.lastName || "");

    document.getElementById("profileName").innerText = fullName;
    document.getElementById("profileEmail").innerText = "🖂 " + user.email;

    document.getElementById("profileAvatar").src =
        "https://ui-avatars.com/api/?name=" + encodeURIComponent(fullName) +
        "&background=77D0A0&color=fff";
});
</script>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HabitBit - Profile</title>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-light custom-navbar">
  <div class="container-fluid">
    <a class="navbar-brand d-flex align-items-center" href="dashboard.php">
      <img src="images/logo.png" alt="HabitBit Logo" height="40" class="me-2">
      <span class="fw-bold text-white fs-3">HabitBit </span>
    </a>
    <div class="d-flex text-white small gap-3">
      <a href="dashboard.php" class="text-white text-decoration-none">Home</a>  
      <a href="contact.php" class="text-white text-decoration-none">Contact</a>
      <a href="about.php" class="text-white text-decoration-none">About</a>
      <a href="gallery.php" class="text-white text-decoration-none me-3">Gallery</a>
      <a href="#" class="text-white text-decoration-none">🔔</a>
      
    </div>
  </div>
</nav>

<main class="container py-5">
<div class="container py-4">
    
    <div class="d-flex align-items-center justify-content-between mb-4 px-md-4">
        <div class="d-flex align-items-center gap-3">
            <img id="profileAvatar" class="rounded-circle border shadow-sm" width="75">
            <div>
                <h4 id="profileName" class="fw-bold mb-0"></h4>
                <small id="profileEmail" class="text-muted"></small>
            </div>
        </div>
       <a href="index.php" class="btn btn-sm btn-outline-danger rounded-pill px-3">Log out ➜</a>
    </div>

    <div class="bg-white p-4 rounded-4 shadow-sm border mb-4 mx-md-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold mb-0" style="font-size: 1.25rem;">Today's Progress</h6>
            <button class="complete-btn" onclick="completeAll()">Complete all</button>
        </div>

        <div class="progress mb-2" style="height: 12px; border-radius: 6px;">
            <div id="today-progress-bar" class="progress-bar bg-success transition-all" style="width: 0%;"></div>
        </div>

        <div class="d-flex justify-content-between align-items-center">
            <small id="today-progress-count" class="text-muted fw-medium">0/0 Habits done</small>  
            <small id="today-progress-text" class="fw-bold text-success">0%</small>
        </div>
    </div>

    <div class="mx-md-4">
        <h6 class="fw-bold mb-3">My Habits List</h6>
        <div id="habit-list" class="bg-white p-2 rounded-3 shadow-sm border min-vh-25">
            </div>
    </div>
</div>
</main>

<div class="nav-wrapper nav-bar">
      <div class="app-nav d-flex justify-content-around align-items-center shadow-lg">
        <div class="nav-indicator"></div>
        <a href="dashboard.php" class="nav-link" onclick="moveNavIndicator(25)">🏠</a>
            <div class="fab-container" id="fabMenu">
            <button class="sub-btn edit" onclick="openHabitModal()">✎</button>
            <button class="sub-btn delete" onclick="toggleDeleteMode()">🗑</button>
            <button id="mainBtn" onclick="toggleMenu(); moveNavIndicator(50)">+</button>
    </div>
        <a href="profile.php" class="nav-link active" onclick="moveNavIndicator(70)">👤</a>
      </div>
    </div>

<div id="habitModal" class="modal">
    <div class="modal-content edit-habit">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-bold mb-0">Create new Habit</h2>
            <button class="btn-close btn-close-white" onclick="closeHabitModal()"></button>
        </div>

        <div class="d-flex gap-2 mb-3">
            <div class="bg-white rounded p-2 text-center" style="width: 60px;">
                <input id="habitIcon" type="text" placeholder="Icon" class="w-100 border-0 text-center" style="outline: none;">
            </div>
            <div class="bg-white rounded p-2 flex-grow-1 d-flex align-items-center">
                <input id="habitTitle" type="text" placeholder="Title" class="w-100 border-0" style="outline: none;">
                <button type="button" class="btn btn-sm btn-light rounded-circle info-btn-circle" onclick="toggleDesc()">i</button>
            </div>
        </div>

        <div id="descBox" class="mb-3" style="display: none;">
            <textarea id="habitDesc" class="form-control border-0 rounded" placeholder="Description (optional)" rows="2"></textarea>
        </div>

        <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-white-50 mb-2">
  <span>Repeat</span>
  <select id="habitRepeat" class="bg-transparent border-0 text-dark" style="outline:none;">
    <option value="Daily">Daily</option>
    <option value="Weekdays">Weekdays</option>
    <option value="Weekends">Weekends</option>
    <option value="Every Monday">Every Monday</option>
    <option value="Every Tuesday">Every Tuesday</option>
    <option value="Every Wednesday">Every Wednesday</option>
    <option value="Every Thursday">Every Thursday</option>
    <option value="Every Friday">Every Friday</option>
    <option value="Every Saturday">Every Saturday</option>
    <option value="Every Sunday">Every Sunday</option>
  </select>
</div>

<div class="d-flex justify-content-between align-items-center py-2 border-bottom border-white-50 mb-4">
  <span>Set Time</span>
  <div class="d-flex gap-2 align-items-center">
    <input
      id="habitHour"
      type="number"
      min="1"
      max="12"
      placeholder="7"
      class="border-0 text-dark text-center"
      style="width: 55px; outline:none; background-color: rgba(255,255,255,0.9); border-radius:6px; padding:2px 6px;"
    >

    <span class="text-white">:</span>

    <input
      id="habitMinute"
      type="number"
      min="0"
      max="59"
      placeholder="00"
      class="border-0 text-dark text-center"
      style="width: 55px; outline:none; background-color: rgba(255,255,255,0.9); border-radius:6px; padding:2px 6px;"
    >

    <select
      id="habitPeriod"
      class="border-0 text-dark"
      style="outline:none; background-color: rgba(255,255,255,0.9); border-radius:6px; padding:2px 6px;"
    >
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  </div>
</div>

        <button class="btn btn-warning w-100 rounded-pill fw-bold py-2 shadow-sm" onclick="saveHabit()">Confirm</button>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/main.js"></script>

<script>
document.addEventListener("DOMContentLoaded", () => {
    const navBar = document.querySelector('.app-nav');
    if(navBar) navBar.style.setProperty('--active-offset', '72%');
});
</script>

</body>
</html>