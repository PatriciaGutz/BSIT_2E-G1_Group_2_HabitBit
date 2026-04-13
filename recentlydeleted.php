<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  header("Location: login.php");
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recently Deleted - HabitBit</title>
  
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <link rel="stylesheet" href="css/style.css">

  <style>
    /* recently deleted-only styling */
    .habit-card.archived {
      background: #f8f9fa;
      border: 2px dashed #ccc;
      opacity: 0.9;
      padding: 15px;
      border-radius: 10px;
    }

    .archive-actions {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
  </style>
</head>
<body class="d-flex flex-column min-vh-100">

<nav class="navbar navbar-expand-lg navbar-light custom-navbar">
    <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="dashboard.php">
            <img src="images/logo.png" alt="HabitBit Logo" height="40" class="me-2">
            <span class="fw-bold text-white fs-3">HabitBit</span>
        </a>
        <div class="d-flex text-white small">
            <a href="dashboard.php" class="text-white text-decoration-none me-3">Home</a>
            <a href="contact.php" class="text-white text-decoration-none me-3">Contact</a>
            <a href="about.php" class="text-white text-decoration-none me-3">About</a>
            <a href="gallery.php" class="text-white text-decoration-none me-3">Gallery</a>
        </div>
    </div>
</nav>

<div class="container main-content-container">
    
   <div class="container main-content-container">

    <div class="container-wide mt-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold" style="color: var(--hb-dark);">Recently Deleted</h2>
            
            <a href="profile.php" class="btn btn-outline-secondary shadow-sm rounded-pill">
                <i class="bi bi-arrow-left"></i> Back
            </a>
        </div>
        
        <p class="text-muted mb-5">
            Habits you delete will appear here temporarily. You can restore them or delete them permanently.
        </p>
    </div>

  <div class="row mt-4">
    <div class="col-12">
        <div id="archive-list" class="rounded-5 border bg-white shadow-sm d-flex flex-column align-items-center justify-content-center" style="min-height: 450px; padding: 60px;">
        </div>
    </div>
</div>
<script>
/* ===================================================
    LOAD RECENTLY DELETED HABITS (FRONTEND ONLY)
=================================================== */
document.addEventListener("DOMContentLoaded", loadArchivedHabits);

async function loadArchivedHabits() {
  try {
    const res = await fetch("api/habits.php");
    const habits = await res.json();
    const archived = habits.filter(h => h.is_archived == 1);
    const container = document.getElementById("archive-list");

    if (archived.length === 0) {
      container.classList.remove('habit-grid');
      container.innerHTML = `
        <div class="text-center">
            <img src="images/logo.png" alt="habitbit" class="mb-3" style="width: 80px;">
            <h5 class="fw-bold text-dark" style="color: #4b5563 !important;">No habits yet</h5>
            <p class="text-muted small">Your Recently Deleted is currently empty!</p>
        </div>
      `;
      return;
    }

    container.classList.add('habit-grid');
    container.style.display = "grid";
    container.innerHTML = archived.map(habitCard).join("");
  } catch (err) {
    console.error(err);
  }
}

function habitCard(h) {
  return `
    <div class="habit-card archived">
      <div class="habit-title fw-bold">${escapeHtml(h.title)}</div>
      <div class="habit-meta text-muted small">${h.category} • ${h.repeat_type}</div>
      <div class="habit-meta text-muted small">${h.time_slot}</div>

      <div class="archive-actions">
        <button class="btn btn-sm btn-success"
                onclick="restoreHabit(${h.id})">
          Restore
        </button>

        <button class="btn btn-sm btn-danger"
                onclick="deleteHabitPermanent(${h.id})">
          Delete Permanently
        </button>
      </div>
    </div>
  `;
}

async function restoreHabit(id) {
  if (!confirm("Restore this habit?")) return;

  await fetch("api/habits.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: id,
      is_archived: 0
    })
  });

  loadArchivedHabits();
}

async function deleteHabitPermanent(id) {
  if (!confirm("Delete permanently? This cannot be undone.")) return;

  await fetch("api/habits.php", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  loadArchivedHabits();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}
</script>

</body>
</html>