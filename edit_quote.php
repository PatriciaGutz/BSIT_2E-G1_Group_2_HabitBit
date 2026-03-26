<?php
session_start();
include('db_connect.php');

$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

if ($user_id <= 0) {
    header('location: login.php');
    exit();
}

// Kukunin ang existing na data ng quote base sa ID + current user
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $result = mysqli_query($conn, "SELECT * FROM user_quotes WHERE id = $id AND user_id = $user_id");
    $row = mysqli_fetch_assoc($result);

    if (!$row) {
        header('location: manage_quotes.php');
        exit();
    }
}

// Save and Update
if (isset($_POST['update_quote'])) {
    $id = intval($_POST['id']);
    $quote_text = mysqli_real_escape_string($conn, $_POST['quote_text']);

    $update_query = "
        UPDATE user_quotes
        SET quote_text = '$quote_text'
        WHERE id = $id AND user_id = $user_id
    ";
    
    if (mysqli_query($conn, $update_query)) {
        header('location: manage_quotes.php?status=updated');
        exit();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Edit Quote - HabitBit</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <div class="card shadow-sm p-4 rounded-4 border-0">
            <h2 class="fw-bold text-warning mb-4">Edit Inspiration</h2>
            
            <form action="edit_quote.php" method="POST">
                <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                
                <div class="mb-3">
                    <label class="form-label">Quote Text</label>
                    <textarea name="quote_text" class="form-control" rows="4" required><?php echo htmlspecialchars($row['quote_text']); ?></textarea>
                </div>
                
                <div class="d-flex gap-2">
                    <button type="submit" name="update_quote" class="btn btn-warning px-4 fw-bold">Update Quote</button>
                    <a href="manage_quotes.php" class="btn btn-secondary px-4">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</body>
</html>