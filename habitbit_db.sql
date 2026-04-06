-- ============================================================
-- HabitBit — Complete Database Dump
-- Merged: habitbit_db.sql + habitbit_migration.sql
-- Database: habitbit_db
-- Server: MariaDB 10.4.32 / PHP 8.0.30 (XAMPP)
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================
-- Database
-- ============================================================

CREATE DATABASE IF NOT EXISTS `habitbit_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `habitbit_db`;

-- ============================================================
-- Table: users
-- ============================================================

CREATE TABLE `users` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT,
  `first_name`      VARCHAR(100) NOT NULL,
  `last_name`       VARCHAR(100) NOT NULL,
  `email`           VARCHAR(255) NOT NULL,
  `password`        VARCHAR(255) NOT NULL,
  `current_streak`  INT(11)      DEFAULT 0,
  `highest_streak`  INT(11)      DEFAULT 0,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sample user (password: Sanaakonalang12)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `created_at`) VALUES
(1, 'Michael', 'Mercado', 'michaeljosephmercado2005@gmail.com',
 '$2y$10$RQTfEGfaY5eXB5gsmHOv5edy34c.N3CisEJwobayBfhpnBXqqTHD2',
 '2026-04-05 05:19:57');

-- ============================================================
-- Table: habits
-- (includes 'category' column from migration)
-- ============================================================

CREATE TABLE `habits` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `user_id`     INT(11)      NOT NULL,
  `icon`        VARCHAR(10)  DEFAULT NULL,
  `category`    VARCHAR(50)  NOT NULL DEFAULT 'Personal',
  `title`       VARCHAR(255) NOT NULL,
  `repeat_type` VARCHAR(50)  NOT NULL,
  `time_slot`   VARCHAR(20)  NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `is_done`     TINYINT(1)   DEFAULT 0,
  `history`     TEXT         DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `title`   (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Table: habit_completions
-- (new table from migration — persists calendar completion data)
-- ============================================================

CREATE TABLE `habit_completions` (
  `id`             INT(11)  NOT NULL AUTO_INCREMENT,
  `user_id`        INT(11)  NOT NULL,
  `habit_id`       INT(11)  NOT NULL,
  `date_completed` DATE     NOT NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_habit_date` (`user_id`, `habit_id`, `date_completed`),
  KEY `user_id`  (`user_id`),
  KEY `habit_id` (`habit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- Table: quotes  (built-in / default quotes)
-- ============================================================

CREATE TABLE `quotes` (
  `id`          INT(11) NOT NULL AUTO_INCREMENT,
  `quote_text`  TEXT    NOT NULL,
  `is_selected` INT(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `quotes` (`id`, `quote_text`, `is_selected`) VALUES
(1,  'Believe you can and you\'re halfway there.',                                    0),
(2,  'Don\'t stop when you\'re tired. Stop when you\'re done.',                       0),
(3,  'Discipline is doing what needs to be done, even if you don\'t want to do it.', 0),
(4,  'Your only limit is your mind.',                                                 0),
(5,  'Great things never come from comfort zones.',                                   0),
(6,  'Success is the sum of small efforts, repeated day in and day out.',             0),
(7,  'The secret of your future is hidden in your daily routine.',                    0),
(8,  'Focus on the goal, not the obstacles.',                                         0),
(9,  'Small habits, big changes.',                                                    0),
(10, 'Stay consistent, the results will follow.',                                     0);

-- ============================================================
-- Table: user_quotes  (personal / custom quotes per user)
-- ============================================================

CREATE TABLE `user_quotes` (
  `id`          INT(11)   NOT NULL AUTO_INCREMENT,
  `user_id`     INT(11)   NOT NULL,
  `quote_text`  TEXT      NOT NULL,
  `is_selected` INT(11)   DEFAULT 0,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- AUTO_INCREMENT values
-- ============================================================

ALTER TABLE `habits`            MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `habit_completions` MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `quotes`            MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
ALTER TABLE `users`             MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `user_quotes`       MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT;

-- ============================================================
-- Foreign key constraints
-- ============================================================

ALTER TABLE `habits`
  ADD CONSTRAINT `habits_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `habit_completions`
  ADD CONSTRAINT `hc_user_fk`
    FOREIGN KEY (`user_id`)  REFERENCES `users`  (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `hc_habit_fk`
    FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_quotes`
  ADD CONSTRAINT `user_quotes_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;