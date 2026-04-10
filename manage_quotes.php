<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('location: login.php');
    exit();
}
$user_id = (int)$_SESSION['user_id'];
$user_name = $_SESSION['firstname'] ?? "Habit Builder";
include('db_connect.php');

// ── PIN a quote to Home ────────────────────────────────────────────────────
if (isset($_GET['select_quote'])) {
    $id = (int)$_GET['select_quote'];
    mysqli_query($conn, "UPDATE user_quotes SET is_selected = 0 WHERE user_id = $user_id");
    mysqli_query($conn, "UPDATE user_quotes SET is_selected = 1 WHERE id = $id AND user_id = $user_id");
    header('location: manage_quotes.php?status=locked');
    exit();
}

// ── UNPIN / back to random ─────────────────────────────────────────────────
if (isset($_GET['reset_random'])) {
    mysqli_query($conn, "UPDATE user_quotes SET is_selected = 0 WHERE user_id = $user_id");
    header('location: manage_quotes.php?status=random_enabled');
    exit();
}

// ── DELETE quote ───────────────────────────────────────────────────────────
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    mysqli_query($conn, "DELETE FROM user_quotes WHERE id = $id AND user_id = $user_id");
    header('location: manage_quotes.php?status=deleted');
    exit();
}

// ── ADD quote ──────────────────────────────────────────────────────────────
if (isset($_POST['save_quote'])) {
    $quote_text = mysqli_real_escape_string($conn, trim($_POST['quote_text']));
    if (!empty($quote_text)) {
        mysqli_query($conn, "
            INSERT INTO user_quotes (user_id, quote_text, is_selected)
            VALUES ($user_id, '$quote_text', 0)
        ");
    }
    header('location: manage_quotes.php?status=added');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Quotes - HabitBit</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="css/style.css"> 
    <style>
        body { background: #f8f9fa; font-family: 'Inter', sans-serif; }
        .container-wide { max-width: 1200px; margin: auto; padding: 0 20px; }
        
        /* Branded Card Themes */
        .quote-management-card {
            background-color: #f0f9f5 !important; 
            border: 1px solid #e0eee7 !important;
            position: relative;
            overflow: hidden;
        }

        .built-in-card {
            background-color: #fff7f2 !important; 
            border: 1px solid #fdeee4 !important;
            position: relative;
            overflow: hidden;
        }

        .card-watermark {
            position: absolute;
            bottom: -15px;
            right: -15px;
            width: 130px;
            opacity: 0.08;
            pointer-events: none;
            z-index: 0;
            transform: rotate(-10deg);
        }

        .card-content-wrapper { position: relative; z-index: 1; }
    </style>
</head>
<body>
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

    <div class="container-wide mt-5 pb-5 mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-success">Manage Your Quotes</h2>
            <a href="dashboard.php" class="btn btn-outline-secondary shadow-sm rounded-pill">
                <i class="bi bi-arrow-left"></i> Back
            </a>
        </div>

        <?php if (isset($_GET['status'])): ?>
            <?php
            $alerts = [
                'added'          => ['success', 'Quote added successfully!'],
                'deleted'        => ['danger',  'Quote deleted.'],
                'locked'         => ['primary', 'Quote pinned to Dashboard!'],
                'random_enabled' => ['info',    'Back to Random Mode.'],
                'updated'        => ['warning', 'Quote updated successfully!'],
            ];
            $s = $_GET['status'];
            if (isset($alerts[$s])): [$type, $msg] = $alerts[$s]; ?>
                <div class="alert alert-<?= $type ?> alert-dismissible fade show rounded-4" role="alert">
                    <?= $msg ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <div class="card border-0 shadow-sm p-4 mb-4 rounded-4 quote-management-card">
            <img src="images/logo.png" class="card-watermark" alt="">
            <div class="card-content-wrapper">
                <h5 class="fw-bold mb-3">Add New Motivation</h5>
                <form action="manage_quotes.php" method="POST">
                    <div class="row align-items-center">
                        <div class="col-md-9">
                            <textarea name="quote_text" class="form-control border-0 bg-white p-3 rounded-4 shadow-sm" rows="2"
                                placeholder="Write something inspiring here..." required></textarea>
                        </div>
                        <div class="col-md-3 mt-3 mt-md-0">
                            <button type="submit" name="save_quote" class="btn btn-success w-100 rounded-pill fw-bold py-3">
                                <i class="bi bi-plus-circle"></i> Add Quote
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-7">
                <div class="table-responsive bg-white rounded-4 shadow-sm p-3 h-100">
                    <h5 class="fw-bold mb-3 ps-2">Your Inspiring Words</h5>
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-3 border-0">Quote</th>
                                <th class="text-end pe-3 border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $result = mysqli_query($conn, "SELECT * FROM user_quotes WHERE user_id = $user_id ORDER BY id DESC");
                            if ($result && mysqli_num_rows($result) > 0):
                                while ($row = mysqli_fetch_assoc($result)): ?>
                                <tr>
                                    <td class="ps-3 border-0">
                                        <?php if ($row['is_selected'] == 1): ?>
                                            <span class="badge bg-primary mb-1"><i class="bi bi-pin-angle-fill"></i> Pinned</span><br>
                                        <?php endif; ?>
                                        <span class="small">"<?= htmlspecialchars($row['quote_text']) ?>"</span>
                                    </td>
                                    <td class="text-end pe-3 text-nowrap border-0">
                                        <?php if ($row['is_selected'] == 1): ?>
                                            <a href="manage_quotes.php?reset_random=true" class="btn btn-sm btn-primary rounded-pill"><i class="bi bi-unlock"></i></a>
                                        <?php else: ?>
                                            <a href="manage_quotes.php?select_quote=<?= $row['id'] ?>" class="btn btn-sm btn-outline-primary rounded-pill"><i class="bi bi-pin-angle"></i></a>
                                        <?php endif; ?>
                                        <a href="edit_quote.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-outline-warning rounded-pill"><i class="bi bi-pencil-square"></i></a>
                                        <a href="manage_quotes.php?delete=<?= $row['id'] ?>" class="btn btn-sm btn-outline-danger rounded-pill" onclick="return confirm('Delete?')"><i class="bi bi-trash"></i></a>
                                    </td>
                                </tr>
                            <?php endwhile;
                            else: ?>
                                <tr><td colspan="2" class="text-center py-4 text-muted border-0">No quotes yet.</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="card border-0 shadow-sm p-4 rounded-4 built-in-card h-100">
                    <img src="images/logo.png" class="card-watermark" alt="">
                    <div class="card-content-wrapper">
                        <h5 class="fw-bold mb-3 text-secondary">Built-in Quotes</h5>
                        <div class="d-flex flex-column gap-3">
                            <?php
                            $default = mysqli_query($conn, "SELECT * FROM quotes ORDER BY id ASC");
                            while ($row = mysqli_fetch_assoc($default)): ?>
                                <div class="p-3 bg-white rounded-4 border shadow-sm small">
                                    <span class="text-muted fst-italic">"</span>
                                    <?= htmlspecialchars($row['quote_text']) ?>
                                    <span class="text-muted fst-italic">"</span>
                                </div>
                            <?php endwhile; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="nav-wrapper nav-bar">
        <div class="app-nav d-flex justify-content-around align-items-center shadow-lg">
            <div class="nav-indicator"></div>
            <a href="dashboard.php" class="nav-link" onclick="moveNavIndicator(25)">🏠</a>
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
                <h2 class="h4 fw-bold mb-0 text-white">Create new Habit</h2>
                <button class="btn-close btn-close-white" onclick="closeHabitModal()"></button>
            </div>
            <div class="d-flex gap-2 mb-3">
                <div class="bg-white rounded p-2 text-center d-flex align-items-center justify-content-center" style="width:60px;font-size:1.4rem;" id="categoryIconPreview">⭐</div>
                <div class="bg-white rounded p-2 flex-grow-1 d-flex align-items-center">
                    <input id="habitTitle" type="text" placeholder="Habit title" class="w-100 border-0" style="outline:none;">
                </div>
            </div>
            <select id="habitCategory" class="form-select mb-3 border-0 rounded-3" onchange="updateCategoryPreview()">
                <option value="Personal">⭐ Personal</option>
                <option value="Health">❤️ Health</option>
                <option value="Study">📚 Study</option>
                <option value="Fitness">🏋️ Fitness</option>
                <option value="Work">💼 Work</option>
            </select>
            <button class="btn btn-warning w-100 rounded-pill fw-bold py-2 shadow-sm" onclick="saveHabit()">Confirm</button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/main.js"></script>
</body>
</html>