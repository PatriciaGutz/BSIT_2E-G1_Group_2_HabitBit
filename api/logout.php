<?php
include 'config.php';

session_destroy();
sendJson(['success' => true, 'message' => 'Logged out successfully']);
?>

