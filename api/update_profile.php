<?php
session_start();
header('Content-Type: application/json'); // Sabihan ang browser na JSON ito
include '../db_connect.php'; 

// 1. I-check kung naka-login ang user
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

// 2. Kunin ang JSON data mula sa fetch request
$inputData = json_decode(file_get_contents("php://input"), true);

if (isset($inputData['first_name']) && isset($inputData['last_name'])) {
    
    $firstName = trim($inputData['first_name']);
    $lastName = trim($inputData['last_name']);
    $userId = $_SESSION['user_id'];

    // PAALALA: Siguraduhing 'first_name' at 'last_name' ang column names sa phpMyAdmin!
    $sql = "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?";
    $stmt = mysqli_prepare($conn, $sql);
    
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "ssi", $firstName, $lastName, $userId);

        if (mysqli_stmt_execute($stmt)) {
            // I-update ang session para updated ang display kahit hindi mag-logout
            $_SESSION['firstname'] = $firstName;
            // Kung may session ka rin para sa last name, i-update mo rin dito:
            // $_SESSION['lastname'] = $lastName; 
            
            echo json_encode(['success' => true, 'message' => 'Profile updated successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database update failed.']);
        }
        mysqli_stmt_close($stmt);
    } else {
        echo json_encode(['success' => false, 'message' => 'SQL Preparation failed.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid input data.']);
}

mysqli_close($conn);
?>