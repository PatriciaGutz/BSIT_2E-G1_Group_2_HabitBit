<?php
// api/update_profile.php
include 'config.php';

$user_id = getCurrentUserId();
if (!$user_id) {
    sendJson(['success' => false, 'message' => 'Unauthorized'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'POST required'], 405);
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    sendJson(['success' => false, 'message' => 'Invalid input'], 400);
}

$first_name = trim($input['first_name'] ?? '');
$last_name  = trim($input['last_name']  ?? '');

if (empty($first_name) || empty($last_name)) {
    sendJson(['success' => false, 'message' => 'Both names are required'], 400);
}

$stmt = $conn->prepare('UPDATE users SET first_name = ?, last_name = ? WHERE id = ?');
$stmt->bind_param('ssi', $first_name, $last_name, $user_id);

if ($stmt->execute()) {
    $_SESSION['firstname'] = $first_name;
    sendJson(['success' => true, 'message' => 'Profile updated']);
} else {
    sendJson(['success' => false, 'message' => 'Database update failed'], 500);
}
