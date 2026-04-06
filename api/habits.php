<?php
// api/habits.php  — full CRUD + completions sub-resource
include 'config.php';

$user_id = getCurrentUserId();
if (!$user_id) {
    sendJson(['error' => 'Not authenticated'], 401);
}

$method    = $_SERVER['REQUEST_METHOD'];
$action    = $_GET['action'] ?? '';   // ?action=complete | ?action=uncomplete | ?action=calendar

// ── Completions: mark a habit done for a specific date ─────────────────────
if ($action === 'complete') {
    if ($method !== 'POST') sendJson(['error' => 'POST required'], 405);

    $input    = json_decode(file_get_contents('php://input'), true) ?: [];
    $habit_id = (int)($input['habit_id'] ?? 0);
    $date     = trim($input['date'] ?? date('Y-m-d'));   // YYYY-MM-DD

    if (!$habit_id) sendJson(['error' => 'habit_id required'], 400);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) sendJson(['error' => 'Invalid date format'], 400);

    // Verify habit belongs to user
    $chk = $conn->prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?');
    $chk->bind_param('ii', $habit_id, $user_id);
    $chk->execute();
    if ($chk->get_result()->num_rows === 0) sendJson(['error' => 'Habit not found'], 404);

    // Upsert
    $stmt = $conn->prepare('
        INSERT IGNORE INTO habit_completions (user_id, habit_id, date_completed)
        VALUES (?, ?, ?)
    ');
    $stmt->bind_param('iis', $user_id, $habit_id, $date);
    $stmt->execute();

    // Flip is_done flag
    if ($date === date('Y-m-d')) {
        $upd = $conn->prepare('UPDATE habits SET is_done = 1 WHERE id = ? AND user_id = ?');
        $upd->bind_param('ii', $habit_id, $user_id);
        $upd->execute();
    }

    // Update streak
    updateHabitStreak($conn, $user_id, $date);

    sendJson(['success' => true]);
}

// ── Completions: un-mark ───────────────────────────────────────────────────
if ($action === 'uncomplete') {
    if ($method !== 'POST') sendJson(['error' => 'POST required'], 405);

    $input    = json_decode(file_get_contents('php://input'), true) ?: [];
    $habit_id = (int)($input['habit_id'] ?? 0);
    $date     = trim($input['date'] ?? date('Y-m-d'));

    if (!$habit_id) sendJson(['error' => 'habit_id required'], 400);

    $stmt = $conn->prepare('
        DELETE FROM habit_completions
        WHERE user_id = ? AND habit_id = ? AND date_completed = ?
    ');
    $stmt->bind_param('iis', $user_id, $habit_id, $date);
$stmt->execute();

    // Flip is_done back
    if ($date === date('Y-m-d')) {
        $upd = $conn->prepare('UPDATE habits SET is_done = 0 WHERE id = ? AND user_id = ?');
        $upd->bind_param('ii', $habit_id, $user_id);
        $upd->execute();
    }

    // Recalc streak (might need reset if no completions today)
    updateHabitStreak($conn, $user_id, $date);

    sendJson(['success' => true]);
}

// ── Calendar data: returns date → percent map ──────────────────────────────
if ($action === 'calendar') {
    $year  = (int)($_GET['year']  ?? date('Y'));
    $month = (int)($_GET['month'] ?? date('n'));  // 1-12

    // Total habits for this user
    $total_stmt = $conn->prepare('SELECT COUNT(*) AS cnt FROM habits WHERE user_id = ?');
    $total_stmt->bind_param('i', $user_id);
    $total_stmt->execute();
    $total_row   = $total_stmt->get_result()->fetch_assoc();
    $total_habits = (int)$total_row['cnt'];

    if ($total_habits === 0) {
        sendJson(['data' => [], 'total_habits' => 0]);
    }

    // Count completions per day for the requested month
    $start = sprintf('%04d-%02d-01', $year, $month);
    $end   = date('Y-m-t', strtotime($start));     // last day of month

    $stmt = $conn->prepare('
        SELECT date_completed, COUNT(DISTINCT habit_id) AS done_count
        FROM habit_completions
        WHERE user_id = ?
          AND date_completed BETWEEN ? AND ?
        GROUP BY date_completed
    ');
    $stmt->bind_param('iss', $user_id, $start, $end);
    $stmt->execute();
    $rows = $stmt->get_result();

    $data = [];
    while ($row = $rows->fetch_assoc()) {
        $pct = $total_habits > 0
            ? (int)round(($row['done_count'] / $total_habits) * 100)
            : 0;
        $data[$row['date_completed']] = $pct;
    }

    sendJson(['data' => $data, 'total_habits' => $total_habits]);
}

// ── Standard CRUD ──────────────────────────────────────────────────────────
switch ($method) {

    // LIST habits
    case 'GET':
        $stmt = $conn->prepare('
            SELECT h.*,
                   (SELECT COUNT(*) FROM habit_completions hc
                    WHERE hc.habit_id = h.id AND hc.user_id = h.user_id
                      AND hc.date_completed = CURDATE()) AS is_done_today
            FROM habits h
            WHERE h.user_id = ?
            ORDER BY h.created_at DESC
        ');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $habits = [];
        while ($row = $result->fetch_assoc()) {
            // is_done reflects TODAY's completion
            $row['is_done'] = (int)$row['is_done_today'];
            unset($row['is_done_today']);
            $habits[] = $row;
        }
        sendJson($habits);
        break;

    // CREATE habit
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            parse_str(file_get_contents('php://input'), $input);
        }
        if (!$input) $input = $_POST;

        $category    = trim($input['category']    ?? 'Personal');
        $icon        = categoryToIcon($category);
        $title       = trim($input['title']       ?? '');
        $repeat_type = trim($input['repeat_type'] ?? 'Daily');
        $time_slot   = trim($input['time_slot']   ?? '');
        $description = trim($input['description'] ?? '');

        if (empty($title)) sendJson(['error' => 'Title is required'], 400);

        $valid_categories = ['Health','Study','Fitness','Work','Personal'];
        if (!in_array($category, $valid_categories)) $category = 'Personal';

        $stmt = $conn->prepare('
            INSERT INTO habits (user_id, icon, category, title, repeat_type, time_slot, description, is_done)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        ');
        $stmt->bind_param('issssss', $user_id, $icon, $category, $title, $repeat_type, $time_slot, $description);

        if ($stmt->execute()) {
            sendJson(['success' => true, 'id' => $conn->insert_id, 'icon' => $icon]);
        } else {
            sendJson(['error' => 'Failed to create habit: ' . $conn->error], 500);
        }
        break;

    // UPDATE habit
    case 'PUT':
        // PUT body comes as url-encoded string
        $raw = file_get_contents('php://input');
        parse_str($raw, $input);

        // Also try JSON
        if (empty($input)) {
            $input = json_decode($raw, true) ?: [];
        }

        $habit_id = (int)($input['id'] ?? 0);
        if (!$habit_id) sendJson(['error' => 'id required'], 400);

        // Verify ownership
        $chk = $conn->prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?');
        $chk->bind_param('ii', $habit_id, $user_id);
        $chk->execute();
        if ($chk->get_result()->num_rows === 0) sendJson(['error' => 'Habit not found'], 404);

        $updates = [];
        $params  = [];
        $types   = '';

        if (isset($input['category']) && $input['category'] !== '') {
            $cat = $input['category'];
            $updates[] = 'category = ?';
            $params[]  = $cat;
            $types    .= 's';
            $updates[] = 'icon = ?';
            $params[]  = categoryToIcon($cat);
            $types    .= 's';
        }
        if (isset($input['title']) && trim($input['title']) !== '') {
            $updates[] = 'title = ?';
            $params[]  = trim($input['title']);
            $types    .= 's';
        }
        if (isset($input['repeat_type'])) {
            $updates[] = 'repeat_type = ?';
            $params[]  = $input['repeat_type'];
            $types    .= 's';
        }
        if (isset($input['time_slot'])) {
            $updates[] = 'time_slot = ?';
            $params[]  = $input['time_slot'];
            $types    .= 's';
        }
        if (isset($input['description'])) {
            $updates[] = 'description = ?';
            $params[]  = $input['description'];
            $types    .= 's';
        }
        if (array_key_exists('is_done', $input)) {
            $isDone    = (int)$input['is_done'];
            $updates[] = 'is_done = ?';
            $params[]  = $isDone;
            $types    .= 'i';

            // Sync completions table for today
            $today = date('Y-m-d');
            if ($isDone) {
                $ins = $conn->prepare('INSERT IGNORE INTO habit_completions (user_id,habit_id,date_completed) VALUES(?,?,?)');
                $ins->bind_param('iis', $user_id, $habit_id, $today);
                $ins->execute();
            } else {
                $del = $conn->prepare('DELETE FROM habit_completions WHERE user_id=? AND habit_id=? AND date_completed=?');
                $del->bind_param('iis', $user_id, $habit_id, $today);
                $del->execute();
            }
        }

        if (empty($updates)) sendJson(['error' => 'Nothing to update'], 400);

        $updates[] = 'updated_at = NOW()';
        $params[]  = $habit_id;
        $params[]  = $user_id;
        $types    .= 'ii';

        $sql  = 'UPDATE habits SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            sendJson(['success' => true]);
        } else {
            sendJson(['error' => 'Update failed: ' . $conn->error], 500);
        }
        break;

    // DELETE habit
    case 'DELETE':
        parse_str(file_get_contents('php://input'), $input);
        $habit_id = (int)($input['id'] ?? $_GET['id'] ?? 0);
        if (!$habit_id) sendJson(['error' => 'id required'], 400);

        $stmt = $conn->prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
        $stmt->bind_param('ii', $habit_id, $user_id);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            sendJson(['success' => true]);
        } else {
            sendJson(['error' => 'Habit not found or already deleted'], 404);
        }
        break;

    default:
        sendJson(['error' => 'Method not allowed'], 405);
}

// ── Helper ─────────────────────────────────────────────────────────────────
function updateHabitStreak($conn, $user_id, $date = null) {
    $today = $date ?: date('Y-m-d');
    
    // Check if user had ANY completion today
    $chk = $conn->prepare('SELECT 1 FROM habit_completions WHERE user_id = ? AND date_completed = ? LIMIT 1');
    $chk->bind_param('is', $user_id, $today);
    $chk->execute();
    $hasToday = $chk->get_result()->num_rows > 0;
    
    if (!$hasToday) {
        // No completions today → reset streak to 0
        $stmt = $conn->prepare('UPDATE users SET current_streak = 0 WHERE id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        return;
    }
    
    // Check yesterday
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $chk_yest = $conn->prepare('SELECT 1 FROM habit_completions WHERE user_id = ? AND date_completed = ? LIMIT 1');
    $chk_yest->bind_param('is', $user_id, $yesterday);
    $chk_yest->execute();
    $hadYesterday = $chk_yest->get_result()->num_rows > 0;
    
    $current = $hadYesterday ? 1 : 1; // Start/continue streak
    
    // Get existing
    $get = $conn->prepare('SELECT current_streak, highest_streak FROM users WHERE id = ?');
    $get->bind_param('i', $user_id);
    $get->execute();
    $row = $get->get_result()->fetch_assoc();
    
    $new_current = $hadYesterday ? ($row['current_streak'] + 1) : 1;
    $new_highest = max($row['highest_streak'], $new_current);
    
    // Update
    $stmt = $conn->prepare('UPDATE users SET current_streak = ?, highest_streak = ? WHERE id = ?');
    $stmt->bind_param('iii', $new_current, $new_highest, $user_id);
    $stmt->execute();
}

function categoryToIcon(string $category): string {
    $map = [
        'Health'   => '❤️',
        'Study'    => '📚',
        'Fitness'  => '🏋️',
        'Work'     => '💼',
        'Personal' => '⭐',
    ];
    return $map[$category] ?? '⭐';
}

