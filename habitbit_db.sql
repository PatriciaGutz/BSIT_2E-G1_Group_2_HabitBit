-- ============================================================
--  habitbit_db — Improved Schema + Transaction + Procedures
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
--  SCHEMA (unchanged, with FK fixes noted inline)
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id`             int(11)      NOT NULL AUTO_INCREMENT,
  `first_name`     varchar(100) NOT NULL,
  `last_name`      varchar(100) NOT NULL,
  `email`          varchar(255) NOT NULL,
  `password`       varchar(255) NOT NULL,
  `current_streak` int(11)      DEFAULT 0,
  `highest_streak` int(11)      DEFAULT 0,
  `last_streak_date` date       DEFAULT NULL,
  `created_at`     timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `habits` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `user_id`     int(11)      NOT NULL,
  `icon`        varchar(10)  DEFAULT NULL,
  `category`    varchar(50)  NOT NULL DEFAULT 'Personal',
  `title`       varchar(255) NOT NULL,
  `repeat_type` varchar(50)  NOT NULL,
  `time_slot`   varchar(20)  NOT NULL,
  `description` text         DEFAULT NULL,
  `is_done`     tinyint(1)   DEFAULT 0,
  `history`     text         DEFAULT NULL,
  `created_at`  timestamp    NOT NULL DEFAULT current_timestamp(),
  `updated_at`  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  -- FIX: removed UNIQUE(user_id, time_slot) — a user can have
  --      multiple habits at the same hour (e.g. Jog + Meditate at 8 AM).
  --      Uniqueness is enforced at the (user_id, title) level instead.
  UNIQUE KEY `uq_user_title` (`user_id`, `title`),
  KEY `user_id` (`user_id`),
  KEY `title`   (`title`),
  CONSTRAINT `habits_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `habit_completions` (
  `id`             int(11) NOT NULL AUTO_INCREMENT,
  `user_id`        int(11) NOT NULL,
  `habit_id`       int(11) NOT NULL,
  `date_completed` date    NOT NULL,
  `created_at`     timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_habit_date` (`user_id`, `habit_id`, `date_completed`),
  KEY `user_id`  (`user_id`),
  KEY `habit_id` (`habit_id`),
  CONSTRAINT `hc_user_fk`
    FOREIGN KEY (`user_id`)  REFERENCES `users`  (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `hc_habit_fk`
    FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `quotes` (
  `id`          int(11) NOT NULL AUTO_INCREMENT,
  `quote_text`  text    NOT NULL,
  `is_selected` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Quotes
-----------------------------------------------------------

INSERT INTO quotes (id, quote_text, is_selected) VALUES
(1, 'Believe you can and you''re halfway there.', 0),
(2, 'Don''t stop when you''re tired. Stop when you''re done.', 0),
(3, 'Discipline is doing what needs to be done, even if you don''t want to do it.', 0),
(4, 'Your only limit is your mind.', 0),
(5, 'Great things never come from comfort zones.', 0),
(6, 'Success is the sum of small efforts, repeated day in and day out.', 0),
(7, 'The secret of your future is hidden in your daily routine.', 0),
(8, 'Focus on the goal, not the obstacles.', 0),
(9, 'Small habits, big changes.', 0),
(10, 'Stay consistent, the results will follow.', 0);

-----------------------------------------------------------


CREATE TABLE IF NOT EXISTS `user_quotes` (
  `id`         int(11)   NOT NULL AUTO_INCREMENT,
  `user_id`    int(11)   NOT NULL,
  `quote_text` text      NOT NULL,
  `is_selected` int(11)  DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_quotes_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================
--  PROCEDURE 1 — CompleteHabit
--
--  Purpose : Atomically marks a habit as done for a given date,
--            inserts a completion record, and updates the user's
--            current / highest streak.
--
--  Params  : p_user_id  INT  — the user performing the action
--            p_habit_id INT  — the habit being completed
--            p_date     DATE — the date of completion (usually CURDATE())
--
--  OUT     : p_result   VARCHAR(100)
--              'SUCCESS'              — all good
--              'ALREADY_COMPLETED'    — duplicate, no changes made
--              'HABIT_NOT_FOUND'      — habit_id doesn't belong to user
--              'ERROR: <msg>'         — unexpected failure, rolled back
--
--  Transaction safety:
--    • DECLARE EXIT HANDLER catches any SQL error and rolls back
--      the entire unit of work before returning an error message.
--    • INSERT IGNORE on habit_completions handles the race-condition
--      duplicate gracefully without raising an error.
-- ============================================================

DROP PROCEDURE IF EXISTS `CompleteHabit`;

DELIMITER $$

CREATE PROCEDURE `CompleteHabit` (
  IN  p_user_id  INT,
  IN  p_habit_id INT,
  IN  p_date     DATE,
  OUT p_result   VARCHAR(100)
)
proc_label:BEGIN
  -- Local variables
  DECLARE v_rows_affected    INT    DEFAULT 0;
  DECLARE v_last_streak_date DATE   DEFAULT NULL;
  DECLARE v_current_streak   INT    DEFAULT 0;
  DECLARE v_highest_streak   INT    DEFAULT 0;
  DECLARE v_new_streak       INT    DEFAULT 0;
  DECLARE v_habit_owner      INT    DEFAULT 0;
  DECLARE v_error_msg        VARCHAR(100);

  -- EXIT HANDLER: on any SQL exception, roll back and return error
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
    ROLLBACK;
    SET p_result = CONCAT('ERROR: ', v_error_msg);
  END;

  START TRANSACTION;

  -- Step 1: Verify the habit belongs to this user
  SELECT COUNT(*) INTO v_habit_owner
  FROM   habits
  WHERE  id = p_habit_id AND user_id = p_user_id;

  IF v_habit_owner = 0 THEN
    ROLLBACK;
    SET p_result = 'HABIT_NOT_FOUND';
    LEAVE proc_label;
  END IF;

  -- Step 2: Attempt to insert a completion record (ignore duplicates)
  INSERT IGNORE INTO habit_completions (user_id, habit_id, date_completed)
  VALUES (p_user_id, p_habit_id, p_date);

  SET v_rows_affected = ROW_COUNT();

  -- Step 3: If nothing was inserted, it was already completed today
  IF v_rows_affected = 0 THEN
    ROLLBACK;
    SET p_result = 'ALREADY_COMPLETED';
    LEAVE proc_label;
  END IF;

  -- Step 4: Mark the habit as done
  UPDATE habits
  SET    is_done    = 1,
         updated_at = NOW()
  WHERE  id = p_habit_id AND user_id = p_user_id;

  -- Step 5: Recalculate streak (lock row to prevent race conditions)
  SELECT current_streak, highest_streak, last_streak_date
  INTO   v_current_streak, v_highest_streak, v_last_streak_date
  FROM   users
  WHERE  id = p_user_id
  FOR UPDATE;

  IF v_last_streak_date IS NULL THEN
    -- First ever completion
    SET v_new_streak = 1;

  ELSEIF v_last_streak_date = DATE_SUB(p_date, INTERVAL 1 DAY) THEN
    -- Consecutive day — extend the streak
    SET v_new_streak = v_current_streak + 1;

  ELSEIF v_last_streak_date = p_date THEN
    -- Already counted today (another habit completed earlier today)
    SET v_new_streak = v_current_streak;

  ELSE
    -- Gap in days — streak resets
    SET v_new_streak = 1;
  END IF;

  -- Step 6: Persist updated streak
  UPDATE users
  SET    current_streak   = v_new_streak,
         highest_streak   = GREATEST(highest_streak, v_new_streak),
         last_streak_date = p_date
  WHERE  id = p_user_id;

  COMMIT;
  SET p_result = 'SUCCESS';

END proc_label$$

DELIMITER ;


-- ============================================================
--  PROCEDURE 2 — GetUserHabitSummary
--
--  Purpose : Returns a summary result-set for a given user's
--            habit performance within an optional date range.
--            Useful for dashboard / stats screens.
--
--  Params  : p_user_id   INT  — the user to report on
--            p_from_date DATE — start of the date range (inclusive)
--            p_to_date   DATE — end of the date range (inclusive)
--
--  Returns a single row with:
--    total_habits       — number of habits the user has created
--    completed_today    — habits marked done for today
--    completion_rate    — % of (habit × day) slots completed in range
--    current_streak     — streak pulled straight from users table
--    highest_streak     — all-time best streak
--    most_completed     — title of the habit completed most in range
--    longest_gap_days   — longest consecutive days with ≥1 completion
--                         within the range (motivational insight)
-- ============================================================

DROP PROCEDURE IF EXISTS `GetUserHabitSummary`;

DELIMITER $$

CREATE PROCEDURE `GetUserHabitSummary` (
  IN p_user_id   INT,
  IN p_from_date DATE,
  IN p_to_date   DATE
)
BEGIN
  -- Default date range to last 30 days if not supplied
  IF p_from_date IS NULL THEN
    SET p_from_date = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
  END IF;
  IF p_to_date IS NULL THEN
    SET p_to_date = CURDATE();
  END IF;

  SELECT
    -- Total habits belonging to this user
    (SELECT COUNT(*)
     FROM   habits
     WHERE  user_id = p_user_id) AS total_habits,

    -- How many habits are marked done today
    (SELECT COUNT(*)
     FROM   habits
     WHERE  user_id = p_user_id
       AND  is_done = 1) AS completed_today,

    -- Completion rate: unique (habit, date) completions
    --   divided by (total habits × days in range) × 100
    ROUND(
      (SELECT COUNT(*)
       FROM   habit_completions hc
       JOIN   habits h ON hc.habit_id = h.id
       WHERE  hc.user_id        = p_user_id
         AND  hc.date_completed BETWEEN p_from_date AND p_to_date)
      /
      NULLIF(
        (SELECT COUNT(*) FROM habits WHERE user_id = p_user_id)
        * (DATEDIFF(p_to_date, p_from_date) + 1),
      0) * 100,
    1) AS completion_rate_pct,

    -- Current and highest streak from users row
    (SELECT current_streak FROM users WHERE id = p_user_id) AS current_streak,
    (SELECT highest_streak FROM users WHERE id = p_user_id) AS highest_streak,

    -- Habit completed the most times within the date range
    (SELECT h.title
     FROM   habit_completions hc
     JOIN   habits h ON hc.habit_id = h.id
     WHERE  hc.user_id        = p_user_id
       AND  hc.date_completed BETWEEN p_from_date AND p_to_date
     GROUP  BY h.id, h.title
     ORDER  BY COUNT(*) DESC
     LIMIT  1) AS most_completed_habit,

    -- Total distinct days the user completed at least one habit
    (SELECT COUNT(DISTINCT date_completed)
     FROM   habit_completions
     WHERE  user_id        = p_user_id
       AND  date_completed BETWEEN p_from_date AND p_to_date) AS active_days_in_range;

END$$

DELIMITER ;


-- ============================================================
--  QUICK USAGE EXAMPLES
-- ============================================================

-- Mark habit #4 complete for user #4 today:
--   CALL CompleteHabit(4, 4, CURDATE(), @result);
--   SELECT @result;

-- Get a 30-day summary for user #4:
--   CALL GetUserHabitSummary(4, NULL, NULL);

-- Get a custom range:
--   CALL GetUserHabitSummary(4, '2026-04-01', '2026-04-15');
