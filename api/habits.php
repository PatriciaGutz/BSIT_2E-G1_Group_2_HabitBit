<?php
include 'config.php';

$user_id = getCurrentUserId();
if (!$user_id) {
    sendJson(['error' => 'Not authenticated'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // List habits for user
        $stmt = $conn->prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $habits = [];
        while ($row = $result->fetch_assoc()) {
            $habits[] = $row;
        }
        sendJson($habits);
        break;

    case 'POST':
        // Create habit
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $icon = $input['icon'] ?? '';
        $title = trim($input['title'] ?? '');
        $repeat_type = $input['repeat_type'] ?? 'Daily';
        $time_slot = $input['time_slot'] ?? '';
        $description = $input['description'] ?? '';
        $is_done = (int)($input['is_done'] ?? 0);

        if (empty($title)) {
            sendJson(['error' => 'Title required'], 400);
        }

        $stmt = $conn->prepare('INSERT INTO habits (user_id, icon, title, repeat_type, time_slot, description, is_done) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('isssssi', $user_id, $icon, $title, $repeat_type, $time_slot, $description, $is_done);
        
        if ($stmt->execute()) {
            $habit_id = $conn->insert_id;
            sendJson(['success' => true, 'id' => $habit_id]);
        } else {
            sendJson(['error' => 'Failed to create habit'], 500);
        }
        break;

    case 'PUT':
        // Update habit (by id)
        parse_str(file_get_contents('php://input'), $input);
        $habit_id = (int)($input['id'] ?? 0);
        
        if (!$habit_id) {
            sendJson(['error' => 'ID required'], 400);
        }

        // Build dynamic update query for provided fields only
        $updates = [];
        $params = [];
        $types = '';
        
        if (isset($input['icon'])) {
            $updates[] = 'icon = ?';
            $params[] = $input['icon'];
            $types .= 's';
        }
        if (isset($input['title']) && trim($input['title']) !== '') {
            $updates[] = 'title = ?';
            $params[] = trim($input['title']);
            $types .= 's';
        }
        if (isset($input['repeat_type'])) {
            $updates[] = 'repeat_type = ?';
            $params[] = $input['repeat_type'];
            $types .= 's';
        }
        if (isset($input['time_slot'])) {
            $updates[] = 'time_slot = ?';
            $params[] = $input['time_slot'];
            $types .= 's';
        }
        if (isset($input['description'])) {
            $updates[] = 'description = ?';
            $params[] = $input['description'];
            $types .= 's';
        }
        if (array_key_exists('is_done', $input)) {
            $updates[] = 'is_done = ?';
            $params[] = (int)$input['is_done'];
            $types .= 'i';
        }
        
        if (empty($updates)) {
            sendJson(['error' => 'No fields to update'], 400);
        }
        
        $updates[] = 'updated_at = NOW()';
        $params[] = $habit_id;
        $params[] = $user_id;
        $types .= 'ii';
        
        $sql = 'UPDATE habits SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendJson(['success' => true]);
            } else {
                sendJson(['error' => 'Habit not found or no permission'], 404);
            }
        } else {
            sendJson(['error' => 'Update failed: ' . $conn->error], 500);
        }

        break;

    case 'DELETE':
        // Delete by id
        parse_str(file_get_contents('php://input'), $input);
        $habit_id = (int)($input['id'] ?? 0);

        if (!$habit_id) {
            sendJson(['error' => 'ID required'], 400);
        }

        $stmt = $conn->prepare('DELETE FROM habits WHERE id=? AND user_id=?');
        $stmt->bind_param('ii', $habit_id, $user_id);
        
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            sendJson(['success' => true]);
        } else {
            sendJson(['error' => 'Habit not found'], 404);
        }
        break;

    default:
        sendJson(['error' => 'Method not allowed'], 405);
}
?>

