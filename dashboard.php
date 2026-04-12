<?php
session_start();
include('db_connect.php');

$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
date_default_timezone_set('Asia/Manila');


$user_name = $_SESSION['firstname'] ?? "Habit Builder";

$hour = (int)date("H");
$greeting = "Good evening"; 

if ($hour >= 5 && $hour < 12) {
    $greeting = "Good morning";
} elseif ($hour >= 12 && $hour < 18) {
    $greeting = "Good afternoon";
} else {
    $greeting = "Good evening";
}

$today_month = date("n"); 
$today_date = date("j");  

// get bday mula session
$user_bday = isset($_SESSION['birthdate']) ? $_SESSION['birthdate'] : ""; 

$is_birthday = false;
if (!empty($user_bday)) {
    $bday_parts = explode('-', $user_bday);
    if (count($bday_parts) == 3) {
        if ((int)$bday_parts[1] == $today_month && (int)$bday_parts[2] == $today_date) {
            $is_birthday = true;
        }
    }
}

// SPECIAL GREETING
if ($today_month == 12 && $today_date == 25) {
    $display_quote = "🎄 Merry Christmas! Celebrate with joy and better habits!";
} elseif ($today_month == 1 && $today_date == 1) {
    $display_quote = "🎆 Happy New Year! New Year, New Bits. Build your future today!";
} elseif ($is_birthday) {
    $display_quote = "🎂 Happy Birthday, " . $user_name . "! Another year to build great habits!";
} else {
    // 1. Check selected personal quote
    $check_selected = mysqli_query($conn, "
        SELECT quote_text
        FROM user_quotes
        WHERE user_id = '$user_id' AND is_selected = 1
        LIMIT 1
    ");

    if ($check_selected && mysqli_num_rows($check_selected) > 0) {
        $row = mysqli_fetch_assoc($check_selected);
        $display_quote = $row['quote_text'];
    } else {
        // 2. If no selected personal quote, get random personal quote
        $personal_query = mysqli_query($conn, "
            SELECT quote_text
            FROM user_quotes
            WHERE user_id = '$user_id'
            ORDER BY RAND()
            LIMIT 1
        ");

        if ($personal_query && mysqli_num_rows($personal_query) > 0) {
            $row = mysqli_fetch_assoc($personal_query);
            $display_quote = $row['quote_text'];
        } else {
            // 3. If user has no personal quotes, fallback to default quote
            $default_query = mysqli_query($conn, "
                SELECT quote_text
                FROM quotes
                ORDER BY RAND()
                LIMIT 1
            ");

            $row = mysqli_fetch_assoc($default_query);
            $display_quote = $row ? $row['quote_text'] : "Believe you can and you're halfway there.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HabitBit - Home</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
      <link rel="stylesheet" href="css/style.css">
   </head>
   <body>
      <nav class="navbar navbar-expand-lg navbar-light custom-navbar">
         <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="dashboard.php">
            <img src="images/logo.png" alt="HabitBit Logo" height="40" class="me-2">
            <span class="fw-bold text-white fs-3">HabitBit</span>
            </a>
            <div class="d-flex text-white small">
               <a href="dashboard.php" class="text-white text-decoration-none me-3 nav-active">Home</a>
               <a href="contact.php" class="text-white text-decoration-none me-3">Contact</a>
               <a href="about.php" class="text-white text-decoration-none me-3">About</a>
               <a href="gallery.php" class="text-white text-decoration-none me-3">Gallery</a>
            </div>
         </div>
      </nav>

<div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="fw-bold mb-0" id="greetingText"><?php echo $greeting; ?>,</h2>
            <h2 class="fw-bold" id="userNameText"><?php echo $user_name; ?>!</h2>
        </div>

        <div class="d-flex align-items-center bg-white p-2 rounded-pill shadow-sm border">
            <span id="habit-streak" class="me-2 streak-display fw-bold" data-highest="0" style="cursor: help; min-width: 50px; text-align: center;">🔥 0</span>
            <img id="dashboardAvatar" src="https://ui-avatars.com/api/?name=<?php echo urlencode($user_name); ?>&background=77D0A0&color=fff" class="rounded-circle" width="32" alt="Profile">
        </div>
    </div>

    <script>
    let streakMode = 'current'; // 'current' or 'highest'
    
    // Load streak
    fetch('api/streak.php')
      .then(res => res.json())
      .then(data => {
        const el = document.getElementById('habit-streak');
        if (el) {
          el.dataset.current = data.current_streak || 0;
          el.dataset.highest = data.highest_streak || 0;
          updateStreakDisplay(el);
        }
      });

    function updateStreakDisplay(el) {
      const current = parseInt(el.dataset.current) || 0;
      const highest = parseInt(el.dataset.highest) || 0;
      
      if (current === highest && current > 0) {
        el.innerHTML = `<strong>🏆 ${current}</strong>`;
        el.classList.add('streak-record');
      } else {
        el.textContent = `🔥 ${current}`;
        el.classList.remove('streak-record');
      }
    }
    
    // Hover: show highest
    document.getElementById('habit-streak').addEventListener('mouseenter', function() {
      const highest = parseInt(this.dataset.highest) || 0;
      if (highest > 0) {
        const original = this.textContent;
        this.title = `Highest: ⭐ ${highest}`;
        this.style.fontSize = '1.1em';
        setTimeout(() => {
          this.style.fontSize = '';
          this.title = '';
        }, 1500);
      }
    });
    </script>

<a href="manage_quotes.php" class="text-decoration-none">
    <div class="quote-container text-white p-4 rounded-5 text-center mb-4 shadow-sm position-relative">
        <div class="quote-icon-box top-left"><i class="bi bi-quote"></i></div>
        
        <p id="daily-quote" class="mb-0 fs-4 fw-bold py-4">
            <?php echo '"' . $display_quote . '"'; ?>
        </p>
        
        <div class="quote-icon-box bottom-right"><i class="bi bi-quote"></i></div>

        <div class="quote-edit-wrapper position-absolute top-0 end-0 m-3">
            <i class="bi bi-pencil-square opacity-75"></i>
            <span class="quote-tooltip">Quote Management</span>
        </div>
    </div>
</a>
        
        <div class="weekly-tracker bg-white p-3 rounded-4 shadow-sm mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-link text-dark fw-bold text-decoration-none" onclick="changeWeek(-1)">❮</button>
                <h5 class="fw-bold mb-0" id="week-label">Week of Jan 4, 2026</h5>
                <button class="btn btn-link text-dark fw-bold text-decoration-none" onclick="changeWeek(1)">❯</button>
            </div>
          <div id="weekly-grid"></div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0">Current Habits</h5>
            <a href="profile.php" class="text-decoration-none text-orange fw-bold">View all ></a>
        </div>

        <div id="habit-list" class="habit-grid mb-5"></div>

        <hr class="my-5">

        <div class="calendar-section pb-5">
            <div class="d-flex justify-content-center mb-3">
                <div class="btn-group bg-light p-1 rounded-pill border">
                    <button class="btn btn-sm rounded-pill active px-4" id="viewMonth">Month</button>
                    <button class="btn btn-sm rounded-pill px-4" id="viewYear">Year</button>
                </div>
            </div>
            
            <div class="d-flex justify-content-center align-items-center mb-3">
                <button class="btn btn-link text-dark fw-bold text-decoration-none" onclick="changeMonth(-1)">❮</button>
                <h5 class="fw-bold mb-0 mx-4" id="month-label">January 2026</h5>
                <button class="btn btn-link text-dark fw-bold text-decoration-none" onclick="changeMonth(1)">❯</button>
            </div>

            <div class="bg-white p-4 rounded-4 shadow-sm border">
                <div id="calendar-grid" class="calendar-grid"></div>
                
                <div class="mt-4 pt-3 border-top row g-2">
                    <div class="col-6 d-flex align-items-center small"><span class="legend-dot bg-success"></span> 100%</div>
                    <div class="col-6 d-flex align-items-center small"><span class="legend-dot bg-info"></span> 75-99%</div>
                    <div class="col-6 d-flex align-items-center small"><span class="legend-dot bg-warning"></span> 50-74%</div>
                    <div class="col-6 d-flex align-items-center small"><span class="legend-dot bg-peach"></span> below 50%</div>
                </div>
            </div>
        </div>
    </div>
</div>
      </div>
      <div class="nav-wrapper nav-bar">
         <div class="app-nav d-flex justify-content-around align-items-center shadow-lg">
            <div class="nav-indicator"></div>
               <a href="dashboard.php" class="nav-link active" onclick="moveNavIndicator(25)">🏠</a>
                  <div class="fab-container" id="fabMenu">
                     <button class="sub-btn edit" onclick="openHabitModal()">✎</button>
                     <button class="sub-btn delete" onclick="toggleDeleteMode()">🗑</button>
                     <button id="mainBtn" onclick="toggleMenu()">+</button>
                  </div>
               <a href="profile.php" class="nav-link" onclick="moveNavIndicator(70)">👤</a>
            </div>
         </div>
      <div id="habitModal" class="modal">
        <div class="modal-content edit-habit">

          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 fw-bold mb-0">Create new Habit</h2>
            <button class="btn-close btn-close-white" onclick="closeHabitModal()"></button>
          </div>

          <!-- Category icon preview + Title -->
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

          <!-- Description -->
          <div id="descBox" class="mb-3" style="display:none;">
            <textarea id="habitDesc" class="form-control border-0 rounded"
                      placeholder="Description (optional)" rows="2"></textarea>
          </div>

          <!-- Category -->
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

          <!-- Repeat -->
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

          <!-- Time -->
          <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-white-50 mb-4">
            <span>Set Time</span>
            <div class="d-flex gap-2 align-items-center">
              <input id="habitHour" type="number" min="1" max="12"
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

      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="js/main.js"></script>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const navBar = document.querySelector('.app-nav');
  if(navBar) navBar.style.setProperty('--active-offset', '27.3%');

  // Use PHP session data (prioritized over localStorage)
  const phpFirstName = "<?php echo isset($_SESSION['firstname']) ? $_SESSION['firstname'] : ''; ?>";
  const phpUserId = "<?php echo isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0; ?>";
  
  console.log('PHP Session:', {firstname: phpFirstName, user_id: phpUserId});
  
  const userNameText = document.getElementById("userNameText");
  const dashboardAvatar = document.getElementById("dashboardAvatar");

  if (phpFirstName) {
    if (userNameText) userNameText.textContent = phpFirstName + "!";
    if (dashboardAvatar) dashboardAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(phpFirstName)}&background=77D0A0&color=fff`;
  }
});

</script>
   </body>
</html>