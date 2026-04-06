<?php
include 'config.php';

$user_id = getCurrentUserId();
if (!$user_id) {
    sendJson(['error' => 'Not authenticated'], 401);
}

// GET current/highest streak
$stmt = $conn->prepare('SELECT current_streak, highest_streak FROM users WHERE id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    sendJson(['current_streak' => 0, 'highest_streak' => 0]);
}
sendJson($user);
?>

