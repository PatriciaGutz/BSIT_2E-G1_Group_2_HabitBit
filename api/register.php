<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'POST required'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$first_name = trim($input['firstName'] ?? '');
$last_name = trim($input['lastName'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validate
if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
    sendJson(['error' => 'All fields required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(['error' => 'Invalid email'], 400);
}

if (strlen($password) < 8) {
    sendJson(['error' => 'Password too short (min 8)'], 400);
}

// Check existing email
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    sendJson(['error' => 'Email already registered'], 409);
}

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)');
$stmt->bind_param('ssss', $first_name, $last_name, $email, $hashed_password);

if ($stmt->execute()) {
    $user_id = $conn->insert_id;
    $_SESSION['user_id'] = $user_id;
    $_SESSION['firstname'] = $first_name;
    sendJson(['success' => true, 'message' => 'Registered and logged in successfully']);
} else {
    sendJson(['error' => 'Registration failed'], 500);
}
?>

