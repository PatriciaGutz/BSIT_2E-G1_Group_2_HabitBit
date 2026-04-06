<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('location: login.php');
    exit();
}
$user_id = (int)$_SESSION['user_id'];
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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <style>
        body { background: #f8f9fa; font-family: 'Inter', sans-serif; }
        .text-orange { color: #f97316; }
    </style>
</head>
<body>
<div class="container mt-5 pb-5">

    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold text-success">Manage Your Quotes</h2>
        <a href="dashboard.php" class="btn btn-outline-secondary shadow-sm">
            <i class="bi bi-arrow-left"></i> Back to Dashboard
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
            <div class="alert alert-<?= $type ?> alert-dismissible fade show" role="alert">
                <?= $msg ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>
    <?php endif; ?>

    <!-- ADD FORM -->
    <div class="card border-0 shadow-sm p-4 mb-4 rounded-4">
        <h5 class="fw-bold mb-3">Add New Motivation</h5>
        <form action="manage_quotes.php" method="POST">
            <div class="mb-3">
                <textarea name="quote_text" class="form-control border-0 bg-light p-3" rows="3"
                    placeholder="Write something inspiring here..." required></textarea>
            </div>
            <button type="submit" name="save_quote" class="btn btn-success px-4 rounded-pill fw-bold">
                <i class="bi bi-plus-circle"></i> Add Quote
            </button>
        </form>
    </div>

    <!-- USER QUOTES TABLE -->
    <div class="table-responsive bg-white rounded-4 shadow-sm p-3 mb-4">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th class="ps-3">Inspiring Words</th>
                    <th class="text-end pe-3">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $result = mysqli_query($conn, "
                    SELECT * FROM user_quotes WHERE user_id = $user_id ORDER BY id DESC
                ");
                if ($result && mysqli_num_rows($result) > 0):
                    while ($row = mysqli_fetch_assoc($result)): ?>
                    <tr>
                        <td class="ps-3">
                            <?php if ($row['is_selected'] == 1): ?>
                                <span class="badge bg-primary mb-1">
                                    <i class="bi bi-pin-angle-fill"></i> Pinned to Home
                                </span><br>
                            <?php endif; ?>
                            <span class="fst-italic text-muted">"</span>
                            <?= htmlspecialchars($row['quote_text']) ?>
                            <span class="fst-italic text-muted">"</span>
                        </td>
                        <td class="text-end pe-3 text-nowrap">
                            <?php if ($row['is_selected'] == 1): ?>
                                <a href="manage_quotes.php?reset_random=true"
                                   class="btn btn-sm btn-primary rounded-pill px-3 me-1">
                                    <i class="bi bi-unlock"></i> Unpin
                                </a>
                            <?php else: ?>
                                <a href="manage_quotes.php?select_quote=<?= $row['id'] ?>"
                                   class="btn btn-sm btn-outline-primary rounded-pill px-3 me-1">
                                    <i class="bi bi-pin-angle"></i> Pin
                                </a>
                            <?php endif; ?>
                            <a href="edit_quote.php?id=<?= $row['id'] ?>"
                               class="btn btn-sm btn-outline-warning rounded-pill px-3 me-1">
                                <i class="bi bi-pencil-square"></i>
                            </a>
                            <a href="manage_quotes.php?delete=<?= $row['id'] ?>"
                               class="btn btn-sm btn-outline-danger rounded-pill px-3"
                               onclick="return confirm('Delete this quote?')">
                                <i class="bi bi-trash"></i>
                            </a>
                        </td>
                    </tr>
                <?php endwhile;
                else: ?>
                    <tr>
                        <td colspan="2" class="text-center py-4 text-muted">
                            No quotes yet. Start adding some inspiration!
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <!-- BUILT-IN QUOTES -->
    <div class="card border-0 shadow-sm p-4 rounded-4">
        <h5 class="fw-bold mb-3 text-secondary">Built-in Quotes</h5>
        <div class="row g-3">
            <?php
            $default = mysqli_query($conn, "SELECT * FROM quotes ORDER BY id ASC");
            while ($row = mysqli_fetch_assoc($default)): ?>
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded-4 border h-100">
                        <span class="text-muted fst-italic">"</span>
                        <?= htmlspecialchars($row['quote_text']) ?>
                        <span class="text-muted fst-italic">"</span>
                    </div>
                </div>
            <?php endwhile; ?>
        </div>
    </div>

</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
