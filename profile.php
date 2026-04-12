<!DOCTYPE html>
<html lang="en">
<?php session_start(); ?>
<script>
document.addEventListener("DOMContentLoaded", function () {
    const phpFirstName = "<?php echo isset($_SESSION['first_name']) ? addslashes($_SESSION['first_name']) : (isset($_SESSION['firstname']) ? addslashes($_SESSION['firstname']) : ''); ?>";
    const phpLastName  = "<?php echo isset($_SESSION['last_name'])  ? addslashes($_SESSION['last_name'])  : ''; ?>";
    const phpEmail     = "<?php echo isset($_SESSION['email'])      ? addslashes($_SESSION['email'])      : ''; ?>";
    const phpUserId    = "<?php echo isset($_SESSION['user_id'])    ? $_SESSION['user_id']                : 0; ?>";

    if (phpUserId <= 0) {
        window.location.href = 'login.php';
        return;
    }

    const profileName   = document.getElementById("profileName");
    const profileEmail  = document.getElementById("profileEmail");
    const profileAvatar = document.getElementById("profileAvatar");

    const fallbackName  = (phpFirstName + " " + phpLastName).trim() || 'User';
    const fallbackEmail = phpEmail || 'No email available';

    profileName.innerText  = fallbackName;
    profileEmail.innerText = "🖂 " + fallbackEmail;
    profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=77D0A0&color=fff`;

    fetch('api/profile.php')
        .then(res => res.json())
        .then(user => {
            if (user.success) {
                const fullName   = (user.first_name || '') + ' ' + (user.last_name || '');
                const cleanName  = fullName.trim() || fallbackName;
                const cleanEmail = user.email || fallbackEmail;

                profileName.innerText  = cleanName;
                profileEmail.innerText = "🖂 " + cleanEmail;
                profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=77D0A0&color=fff`;

                window.currentUserData = user;
            }
        })
        .catch(() => {
            console.log("Could not fetch fresh profile data, using session fallback.");
        });
});

function openEditProfileModal() {
    const modal = document.getElementById("editProfileModal");
    if (window.currentUserData) {
        document.getElementById("editFirstName").value = window.currentUserData.first_name || "";
        document.getElementById("editLastName").value  = window.currentUserData.last_name  || "";
    } else {
        const currentName = document.getElementById("profileName").innerText;
        const nameParts   = currentName.split(' ');
        document.getElementById("editFirstName").value = nameParts[0] || "";
        document.getElementById("editLastName").value  = nameParts.slice(1).join(' ') || "";
    }
    modal.style.display = "flex";
}
</script>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HabitBit - Profile</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <!-- NEW: View Controls Styles -->
  <link rel="stylesheet" href="css/habitViewControls.css">
</head>
<body>

<!-- ── Navbar ─────────────────────────────────────────────── -->
<nav class="navbar navbar-expand-lg navbar-light custom-navbar">
  <div class="container-fluid">
    <a class="navbar-brand d-flex align-items-center" href="dashboard.php">
      <img src="images/logo.png" alt="HabitBit Logo" height="40" class="me-2">
      <span class="fw-bold text-white fs-3">HabitBit</span>
    </a>
    <div class="d-flex text-white small gap-3">
      <a href="dashboard.php" class="text-white text-decoration-none">Home</a>
      <a href="contact.php"   class="text-white text-decoration-none">Contact</a>
      <a href="about.php"     class="text-white text-decoration-none">About</a>
      <a href="gallery.php"   class="text-white text-decoration-none me-3">Gallery</a>
    </div>
  </div>
</nav>

<!-- ── Main Content ───────────────────────────────────────── -->
<main class="container py-5">
  <div class="container py-4">

    <!-- Profile Header -->
    <div class="d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3 flex-grow-1">
        <img id="profileAvatar" class="rounded-circle border shadow-sm" width="75" alt="Avatar">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h4 id="profileName" class="fw-bold mb-0"></h4>
            <button class="btn btn-sm btn-light rounded-circle" onclick="openEditProfileModal()" title="Edit profile">
              <i class="bi bi-pencil-fill" style="font-size: 0.8rem;"></i>
            </button>
          </div>
          <small id="profileEmail" class="text-muted"></small>
        </div>
      </div>
      <button id="logoutBtn" class="btn btn-outline-danger rounded-pill px-4 py-2">
        <i class="bi bi-box-arrow-right me-2"></i>Logout
      </button>
    </div>

    <!-- Today's Progress -->
    <div class="bg-white p-4 rounded-4 shadow-sm border mb-4 mx-md-4 mt-4">
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

    <!-- ── Habits Section ──────────────────────────────────── -->
    <div class="mx-md-4">
      <!-- Section Header: Title + Controls -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2" id="habitControlsBar">
        <h6 class="fw-bold mb-0">My Habits List</h6>

        <!-- Controls Group: View Toggle + Filter + Sort -->
        <div class="hvc-controls-bar">

          <!-- ① View Toggle -->
          <div class="hvc-view-group" role="group" aria-label="View toggle">
            <button id="viewGridBtn"
                    class="hvc-btn hvc-btn--active"
                    onclick="HabitViewControls.setView('grid')"
                    title="Grid view"
                    aria-label="Switch to grid view">
              <i class="bi bi-grid-3x2-gap"></i>
              <span>Grid</span>
            </button>
            <button id="viewListBtn"
                    class="hvc-btn"
                    onclick="HabitViewControls.setView('list')"
                    title="List view"
                    aria-label="Switch to list view">
              <i class="bi bi-list-ul"></i>
              <span>List</span>
            </button>
          </div>

          <!-- ② Filter Button + Dropdown -->
          <div class="hvc-filter-wrap hvc-dropdown-wrap">
            <button id="filterBtn"
                    class="hvc-btn"
                    onclick="HabitViewControls.toggleFilterDropdown(event)"
                    title="Filter habits"
                    aria-label="Filter habits"
                    aria-haspopup="true">
              <i class="bi bi-funnel"></i>
              <span>Filter</span>
            </button>
            <!-- Active filter indicator badge -->
            <span id="filterBadge" class="hvc-filter-badge" aria-hidden="true"></span>

            <!-- Filter Dropdown -->
            <div id="filterDropdown" class="hvc-dropdown" role="menu" aria-labelledby="filterBtn">
              <div class="hvc-dropdown__label">Show habits</div>
              <button class="hvc-dropdown__item"
                      data-filter="all"
                      onclick="HabitViewControls.setFilter('all')"
                      role="menuitem">
                <i class="bi bi-collection"></i> All Habits
              </button>
              <button class="hvc-dropdown__item"
                      data-filter="completed"
                      onclick="HabitViewControls.setFilter('completed')"
                      role="menuitem">
                <i class="bi bi-check-circle"></i> Completed
              </button>
              <button class="hvc-dropdown__item"
                      data-filter="in-progress"
                      onclick="HabitViewControls.setFilter('in-progress')"
                      role="menuitem">
                <i class="bi bi-hourglass-split"></i> In Progress
              </button>
            </div>
          </div>

          <!-- ③ Sort Button + Dropdown -->
          <div class="hvc-dropdown-wrap">
            <button id="sortBtn"
                    class="hvc-btn"
                    onclick="HabitViewControls.toggleSortDropdown(event)"
                    title="Sort habits"
                    aria-label="Sort habits"
                    aria-haspopup="true">
              <i class="bi bi-sort-down"></i>
              <span id="sortLabel">Sort</span>
            </button>

            <!-- Sort Dropdown -->
            <div id="sortDropdown" class="hvc-dropdown" role="menu" aria-labelledby="sortBtn">
              <div class="hvc-dropdown__label">Order by</div>
              <button class="hvc-dropdown__item hvc-dropdown__item--active"
                      data-sort="default"
                      onclick="HabitViewControls.setSort('default')"
                      role="menuitem">
                <i class="bi bi-check2-circle"></i> Recently Completed
              </button>
              <button class="hvc-dropdown__item"
                      data-sort="alpha"
                      onclick="HabitViewControls.setSort('alpha')"
                      role="menuitem">
                <i class="bi bi-sort-alpha-down"></i> Alphabetical (A–Z)
              </button>
              <button class="hvc-dropdown__item"
                      data-sort="most-completed"
                      onclick="HabitViewControls.setSort('most-completed')"
                      role="menuitem">
                <i class="bi bi-bar-chart"></i> Most Completed
              </button>
            </div>
          </div>

        </div><!-- /.hvc-controls-bar -->
      </div><!-- /.section-header -->

      <!-- Habit List Container -->
      <div id="habit-list"
           class="bg-white p-2 rounded-3 shadow-sm border min-vh-25"
           data-view="grid">
      </div>

    </div><!-- /.mx-md-4 -->
  </div>
</main>

<!-- ── Edit Profile Modal ────────────────────────────────── -->
<div id="editProfileModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
  <div class="modal-content edit-habit">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold mb-0">Edit Profile</h2>
      <button class="btn-close btn-close-white" onclick="closeEditProfileModal()"></button>
    </div>
    <div class="mb-3">
      <label class="text-white small mb-1">First Name</label>
      <input id="editFirstName" type="text" class="form-control border-0 rounded" placeholder="First Name">
    </div>
    <div class="mb-4">
      <label class="text-white small mb-1">Last Name</label>
      <input id="editLastName" type="text" class="form-control border-0 rounded" placeholder="Last Name">
    </div>
    <button class="btn btn-warning w-100 rounded-pill fw-bold py-2 shadow-sm" onclick="updateProfile()">Save Changes</button>
  </div>
</div>

<!-- ── Bottom Nav ────────────────────────────────────────── -->
<div class="nav-wrapper nav-bar">
  <div class="app-nav d-flex justify-content-around align-items-center shadow-lg">
    <div class="nav-indicator"></div>
    <a href="dashboard.php" class="nav-link" onclick="moveNavIndicator(25)">🏠</a>
    <div class="fab-container" id="fabMenu">
      <button class="sub-btn edit"   onclick="openHabitModal()">✎</button>
      <button class="sub-btn delete" onclick="toggleDeleteMode()">🗑</button>
      <button id="mainBtn"           onclick="toggleMenu(); moveNavIndicator(50)">+</button>
    </div>
    <a href="profile.php" class="nav-link active" onclick="moveNavIndicator(70)">👤</a>
  </div>
</div>

<!-- ── Habit Create/Edit Modal ───────────────────────────── -->
<div id="habitModal" class="modal">
  <div class="modal-content edit-habit">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold mb-0">Create new Habit</h2>
      <button class="btn-close btn-close-white" onclick="closeHabitModal()"></button>
    </div>
    <div class="d-flex gap-2 mb-3">
      <div class="bg-white rounded p-2 text-center d-flex align-items-center justify-content-center"
           style="width:60px;font-size:1.4rem;" id="categoryIconPreview">⭐</div>
      <div class="bg-white rounded p-2 flex-grow-1 d-flex align-items-center">
        <input id="habitTitle" type="text" placeholder="Habit title"
               class="w-100 border-0" style="outline:none;">
        <button type="button" class="btn btn-sm btn-light rounded-circle info-btn-circle"
                onclick="toggleDesc()">i</button>
      </div>
    </div>
    <div id="descBox" class="mb-3" style="display:none;">
      <textarea id="habitDesc" class="form-control border-0 rounded"
                placeholder="Description (optional)" rows="2"></textarea>
    </div>
    <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-white-50 mb-2">
      <span>Category</span>
      <select id="habitCategory"
              class="border-0 text-dark"
              style="outline:none;background-color:rgba(255,255,255,0.9);border-radius:6px;padding:2px 8px;"
              onchange="updateCategoryPreview()">
        <option value="Personal">⭐ Personal</option>
        <option value="Health">❤️ Health</option>
        <option value="Study">📚 Study</option>
        <option value="Fitness">🏋️ Fitness</option>
        <option value="Work">💼 Work</option>
      </select>
    </div>
    <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-white-50 mb-2">
      <span>Repeat</span>
      <select id="habitRepeat"
              class="border-0 text-dark"
              style="outline:none;background-color:rgba(255,255,255,0.9);border-radius:6px;padding:2px 8px;">
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
        <input id="habitHour"   type="number" min="1" max="12"
               class="border-0 text-dark text-center"
               style="width:55px;outline:none;background-color:rgba(255,255,255,0.9);border-radius:6px;padding:2px 6px;">
        <span class="text-white">:</span>
        <input id="habitMinute" type="number" min="0" max="59"
               class="border-0 text-dark text-center"
               style="width:55px;outline:none;background-color:rgba(255,255,255,0.9);border-radius:6px;padding:2px 6px;">
        <select id="habitPeriod" class="border-0 text-dark"
                style="outline:none;background-color:rgba(255,255,255,0.9);border-radius:6px;padding:2px 6px;">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
    <button class="btn btn-warning w-100 rounded-pill fw-bold py-2 shadow-sm"
            onclick="saveHabit()">Confirm</button>
  </div>
</div>

<!-- ── Scripts ───────────────────────────────────────────── -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Existing main.js (must load first for base functions) -->
<script src="js/main.js"></script>

<!-- NEW: View Controls Module -->
<script src="js/habitViewControls.js"></script>

<!-- NEW: Bridge — integrates main.js ↔ HabitViewControls -->
<script src="js/profile_bridge.js"></script>

<!-- Profile-page page-specific setup -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  /* ── Nav indicator ── */
  const navBar = document.querySelector('.app-nav');
  if (navBar) navBar.style.setProperty('--active-offset', '72%');

  /* ── Profile modal close helper ── */
  window.closeEditProfileModal = function () {
    document.getElementById("editProfileModal").style.display = "none";
  };

  /* ── Logout ── */
  document.getElementById('logoutBtn').onclick = async function (e) {
    e.preventDefault();
    try {
      await fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' });
      window.location.href = 'login.php';
    } catch (err) {
      window.location.href = 'api/logout.php';
    }
  };
});
</script>

</body>
</html>