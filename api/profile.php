<?php
include 'config.php';

$user_id = getCurrentUserId();
if (!$user_id) {
    sendJson(['error' => 'Not authenticated'], 401);
}

$stmt = $conn->prepare('SELECT first_name, last_name, email FROM users WHERE id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user) {
    sendJson(['success' => true, ...$user]);
} else {
    sendJson(['error' => 'User not found'], 404);
}
?>

