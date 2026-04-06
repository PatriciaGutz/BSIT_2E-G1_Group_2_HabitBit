<?php
include 'config.php';

session_destroy();
if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
    sendJson(['success' => true, 'message' => 'Logged out successfully']);
} else {
    header('Location: ../login.php');
    exit();
}
?>

