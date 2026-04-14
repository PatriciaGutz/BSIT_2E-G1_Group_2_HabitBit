<?php
// api/habits.php — full CRUD + completions sub-resource + completion_count
include 'config.php';

$user_id = getCurrentUserId();
if (!$user_id) {
    sendJson(['error' => 'Not authenticated'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── Completions: mark a habit done ─────────────────────────────────────────
if ($action === 'complete') {
    if ($method !== 'POST') sendJson(['error' => 'POST required'], 405);

    $input    = json_decode(file_get_contents('php://input'), true) ?: [];
    $habit_id = (int)($input['habit_id'] ?? 0);
    $date     = trim($input['date'] ?? date('Y-m-d'));

    if (!$habit_id) sendJson(['error' => 'habit_id required'], 400);

    $chk = $conn->prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?');
    $chk->bind_param('ii', $habit_id, $user_id);
    $chk->execute();
    if ($chk->get_result()->num_rows === 0) sendJson(['error' => 'Habit not found'], 404);

    $stmt = $conn->prepare('INSERT IGNORE INTO habit_completions (user_id, habit_id, date_completed) VALUES (?, ?, ?)');
    $stmt->bind_param('iis', $user_id, $habit_id, $date);
    $stmt->execute();

    if ($date === date('Y-m-d')) {
        $upd = $conn->prepare('UPDATE habits SET is_done = 1 WHERE id = ? AND user_id = ?');
        $upd->bind_param('ii', $habit_id, $user_id);
        $upd->execute();
    }

    updateHabitStreak($conn, $user_id, $date);
    sendJson(['success' => true]);
    exit();
}

// ── Completions: un-mark ───────────────────────────────────────────────────
if ($action === 'uncomplete') {
    if ($method !== 'POST') sendJson(['error' => 'POST required'], 405);

    $input    = json_decode(file_get_contents('php://input'), true) ?: [];
    $habit_id = (int)($input['habit_id'] ?? 0);
    $date     = trim($input['date'] ?? date('Y-m-d'));

    if (!$habit_id) sendJson(['error' => 'habit_id required'], 400);

    $stmt = $conn->prepare('DELETE FROM habit_completions WHERE user_id = ? AND habit_id = ? AND date_completed = ?');
    $stmt->bind_param('iis', $user_id, $habit_id, $date);
    $stmt->execute();

    if ($date === date('Y-m-d')) {
        $upd = $conn->prepare('UPDATE habits SET is_done = 0 WHERE id = ? AND user_id = ?');
        $upd->bind_param('ii', $habit_id, $user_id);
        $upd->execute();
    }
    sendJson(['success' => true]);
    exit();
}

// ── ACTION: loadHabits ───────────────────────────────────────────────────
if ($action === 'loadHabits') {
    $stmt = $conn->prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY time_slot ASC');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $habits = [];
    while ($row = $result->fetch_assoc()) {
        $habits[] = $row;
    }

    sendJson(['data' => $habits]);
    exit();
}

// ── ACTION: calendar ──────────────────────────────────────────────────────
if ($action === 'calendar') {
    $year  = (int)($_GET['year']  ?? date('Y'));
    $month = (int)($_GET['month'] ?? date('n'));
    $start = sprintf('%04d-%02d-01', $year, $month);
    $end   = date('Y-m-t', strtotime($start));

    $stmt = $conn->prepare('
        SELECT date_completed, COUNT(DISTINCT habit_id) AS done_count
        FROM habit_completions
        WHERE user_id = ? AND date_completed BETWEEN ? AND ?
        GROUP BY date_completed
    ');
    $stmt->bind_param('iss', $user_id, $start, $end);
    $stmt->execute();
    $rows = $stmt->get_result();

    $data = [];
    while ($row = $rows->fetch_assoc()) {
        $current_date = $row['date_completed'];
        $count_stmt = $conn->prepare('SELECT COUNT(*) as total FROM habits WHERE user_id = ? AND DATE(created_at) <= ?');
        $count_stmt->bind_param('is', $user_id, $current_date);
        $count_stmt->execute();
        $total_active = $count_stmt->get_result()->fetch_assoc()['total'];

        $pct = ($total_active > 0) ? (int)round(($row['done_count'] / $total_active) * 100) : 0;
        $data[$current_date] = $pct;
    }

    sendJson(['data' => $data]);
    exit();
}

// ── Standard CRUD (GET, POST, PUT, DELETE) ─────────────────────────────────
switch ($method) {
    case 'GET':
        /**
         * ENHANCED GET: now includes `completion_count` (total times completed
         * across all dates) and `last_completed_date` for sort-by-recent-completion.
         * These fields power the Sort feature in HabitViewControls.
         */
        $stmt = $conn->prepare('
            SELECT
                h.*,
                (SELECT COUNT(*)
                    FROM habit_completions hc
                    WHERE hc.habit_id = h.id AND hc.user_id = h.user_id
                    AND hc.date_completed = CURDATE()
                ) AS is_done_today,
                (SELECT COUNT(*)
                    FROM habit_completions hc2
                    WHERE hc2.habit_id = h.id AND hc2.user_id = h.user_id
                ) AS completion_count,
                (SELECT MAX(hc3.date_completed)
                    FROM habit_completions hc3
                    WHERE hc3.habit_id = h.id AND hc3.user_id = h.user_id
                ) AS last_completed_date
            FROM habits h
            WHERE h.user_id = ?
            ORDER BY h.created_at DESC
        ');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $habits = [];
        while ($row = $result->fetch_assoc()) {
            $row['is_done']         = (int)$row['is_done_today'];
            $row['completion_count'] = (int)$row['completion_count'];
            unset($row['is_done_today']);
            $habits[] = $row;
        }
        sendJson($habits);
        break;

    case 'POST':
        $input     = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $title     = trim($input['title'] ?? '');
        $title     = ucfirst($title);
        $time_slot = trim($input['time_slot'] ?? '');
        $category  = trim($input['category'] ?? 'Personal');

        if (empty($title) || empty($time_slot)) sendJson(['error' => 'Title and Time slot are required'], 400);

        $checkStmt = $conn->prepare('SELECT id FROM habits WHERE user_id = ? AND time_slot = ?');
        $checkStmt->bind_param('is', $user_id, $time_slot);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows > 0) sendJson(['error' => 'Time slot conflict!'], 400);

        $icon = categoryToIcon($category);
        $stmt = $conn->prepare('INSERT INTO habits (user_id, icon, category, title, repeat_type, time_slot, description, is_done) VALUES (?, ?, ?, ?, ?, ?, ?, 0)');
        $rep  = $input['repeat_type'] ?? 'Daily';
        $desc = $input['description'] ?? '';
        $stmt->bind_param('issssss', $user_id, $icon, $category, $title, $rep, $time_slot, $desc);
        $stmt->execute();
        sendJson(['success' => true, 'id' => $conn->insert_id]);
        break;

    case 'PUT':
        $raw = file_get_contents('php://input');
        parse_str($raw, $input);
        if (empty($input)) $input = json_decode($raw, true) ?: [];

        $habit_id = (int)($input['id'] ?? 0);
        if (!$habit_id) sendJson(['error' => 'id required'], 400);

        $updates = []; $params = []; $types = '';

        if (isset($input['title'])) {
            $updates[] = 'title = ?';
            $params[]  = ucfirst(trim($input['title']));
            $types    .= 's';
        }
        if (isset($input['category'])) {
            $updates[] = 'category = ?';
            $params[]  = trim($input['category']);
            $types    .= 's';
            $updates[] = 'icon = ?';
            $params[]  = categoryToIcon(trim($input['category']));
            $types    .= 's';
        }
        if (isset($input['repeat_type'])) {
            $updates[] = 'repeat_type = ?';
            $params[]  = trim($input['repeat_type']);
            $types    .= 's';
        }
        if (isset($input['time_slot'])) {
            $updates[] = 'time_slot = ?';
            $params[]  = trim($input['time_slot']);
            $types    .= 's';
        }
        if (isset($input['description'])) {
            $updates[] = 'description = ?';
            $params[]  = trim($input['description']);
            $types    .= 's';
        }

        if (empty($updates)) sendJson(['error' => 'Nothing to update'], 400);

        $sql   = 'UPDATE habits SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
        $types .= 'ii';
        $params[] = $habit_id;
        $params[] = $user_id;

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        sendJson(['success' => true]);
        break;

    case 'DELETE':
        $habit_id = (int)($_GET['id'] ?? 0);
        $stmt_logs = $conn->prepare('DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ?');
        $stmt_logs->bind_param('ii', $habit_id, $user_id);
        $stmt_logs->execute();
        if (!$habit_id) {
            parse_str(file_get_contents('php://input'), $input);
            $habit_id = (int)($input['id'] ?? 0);
        }

        if ($habit_id > 0) {
            $stmt = $conn->prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
            $stmt->bind_param('ii', $habit_id, $user_id);

            if ($stmt->execute()) {
                sendJson(['success' => true]);
            } else {
                sendJson(['error' => 'Delete failed'], 500);
            }
        } else {
            sendJson(['error' => 'Invalid ID'], 400);
        }
        exit(); 
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function updateHabitStreak($conn, $user_id, $date) {

    $stmt = $conn->prepare("SELECT current_streak, highest_streak, last_streak_date FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    
    if (!$res) return;

    if (!empty($res['last_streak_date']) && $res['last_streak_date'] === $date) {
        return;
    }

    $chk = $conn->prepare('SELECT 1 FROM habit_completions WHERE user_id = ? AND date_completed = ? LIMIT 1');
    $chk->bind_param('is', $user_id, $date);
    $chk->execute();
    $completionExists = $chk->get_result()->num_rows > 0;

    if (!$completionExists) {
        return;
    }

    $yesterday = date('Y-m-d', strtotime('-1 day', strtotime($date)));
    $chk->bind_param('is', $user_id, $yesterday);
    $chk->execute();
    $hadYesterday = $chk->get_result()->num_rows > 0;

    $new_current = $hadYesterday ? ($res['current_streak'] + 1) : 1;
    $new_highest = max($res['highest_streak'], $new_current);

    $upd = $conn->prepare('UPDATE users SET current_streak = ?, highest_streak = ?, last_streak_date = ? WHERE id = ?');
    $upd->bind_param('iisi', $new_current, $new_highest, $date, $user_id);
    $upd->execute();
}

function categoryToIcon($category) {
    $map = ['Health' => '❤️', 'Study' => '📚', 'Fitness' => '🏋️', 'Work' => '💼', 'Personal' => '⭐'];
    return $map[$category] ?? '⭐';
}
?>