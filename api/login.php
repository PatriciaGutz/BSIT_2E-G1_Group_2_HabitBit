<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'POST required'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    sendJson(['error' => 'Email and password required'], 400);
}

// Find user
$stmt = $conn->prepare('SELECT id, first_name, password FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user || !password_verify($password, $user['password'])) {
    sendJson(['error' => 'Invalid credentials'], 401);
}

// Login success
$_SESSION['user_id'] = $user['id'];
$_SESSION['firstname'] = $user['first_name'];

sendJson(['success' => true, 'message' => 'Logged in successfully']);
?>

