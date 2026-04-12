-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 12, 2026 at 08:37 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `habitbit_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `habits`
--

CREATE TABLE `habits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'Personal',
  `title` varchar(255) NOT NULL,
  `repeat_type` varchar(50) NOT NULL,
  `time_slot` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `is_done` tinyint(1) DEFAULT 0,
  `history` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `habits`
--

INSERT INTO `habits` (`id`, `user_id`, `icon`, `category`, `title`, `repeat_type`, `time_slot`, `description`, `is_done`, `history`, `created_at`, `updated_at`) VALUES
(3, 2, '🏋️', 'Fitness', 'Jogging', 'Daily', '2:02 AM', '', 0, NULL, '2026-04-10 14:38:26', '2026-04-10 14:38:26'),
(4, 4, '⭐', 'Personal', 'Jogging', 'Weekdays', '8:42 AM', '', 1, NULL, '2026-04-12 01:28:03', '2026-04-12 01:33:14'),
(8, 4, '⭐', 'Personal', 'Read', 'Daily', '2:00 AM', '', 1, NULL, '2026-04-12 06:30:24', '2026-04-12 06:30:58');

-- --------------------------------------------------------

--
-- Table structure for table `habit_completions`
--

CREATE TABLE `habit_completions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `habit_id` int(11) NOT NULL,
  `date_completed` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `habit_completions`
--

INSERT INTO `habit_completions` (`id`, `user_id`, `habit_id`, `date_completed`, `created_at`) VALUES
(1, 4, 4, '2026-04-12', '2026-04-12 01:33:14'),
(2, 4, 8, '2026-04-12', '2026-04-12 06:30:58');

-- --------------------------------------------------------

--
-- Table structure for table `quotes`
--

CREATE TABLE `quotes` (
  `id` int(11) NOT NULL,
  `quote_text` text NOT NULL,
  `is_selected` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quotes`
--

INSERT INTO `quotes` (`id`, `quote_text`, `is_selected`) VALUES
(1, 'Believe you can and you\'re halfway there.', 0),
(2, 'Don\'t stop when you\'re tired. Stop when you\'re done.', 0),
(3, 'Discipline is doing what needs to be done, even if you don\'t want to do it.', 0),
(4, 'Your only limit is your mind.', 0),
(5, 'Great things never come from comfort zones.', 0),
(6, 'Success is the sum of small efforts, repeated day in and day out.', 0),
(7, 'The secret of your future is hidden in your daily routine.', 0),
(8, 'Focus on the goal, not the obstacles.', 0),
(9, 'Small habits, big changes.', 0),
(10, 'Stay consistent, the results will follow.', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `highest_streak` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `current_streak`, `highest_streak`, `created_at`) VALUES
(1, 'Michael', 'Mercado', 'michaeljosephmercado2005@gmail.com', '$2y$10$RQTfEGfaY5eXB5gsmHOv5edy34c.N3CisEJwobayBfhpnBXqqTHD2', 0, 0, '2026-04-05 05:19:57'),
(2, 'Haizee', 'Marquez', 'haizeeMarquez@gmail.com', '$2y$10$Pb9yIg10zH6uDtIVrVqIx.BXwzA48rBzHdlO6HVZ0hK6aYrRrQU3.', 0, 0, '2026-04-10 14:38:09'),
(3, 'Theo', 'Irocio', 'theoIrocio@gmail.com', '$2y$10$rBc.LvAKfLEdgPgOkF0cjeQObS38mlR0oHDa3Yc54aMNP3LZYHlFO', 0, 0, '2026-04-10 14:58:53'),
(4, 'Kian', 'Ganiola', 'KianGaniola@gmail.com', '$2y$10$zs2OlFED.zfGgkRoBjTp0uB97ib9qOmRggF3DnnTNX7xpXvj4lq02', 1, 1, '2026-04-12 01:27:11');

-- --------------------------------------------------------

--
-- Table structure for table `user_quotes`
--

CREATE TABLE `user_quotes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quote_text` text NOT NULL,
  `is_selected` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `habits`
--
ALTER TABLE `habits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id_2` (`user_id`,`time_slot`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `title` (`title`);

--
-- Indexes for table `habit_completions`
--
ALTER TABLE `habit_completions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_habit_date` (`user_id`,`habit_id`,`date_completed`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `habit_id` (`habit_id`);

--
-- Indexes for table `quotes`
--
ALTER TABLE `quotes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_quotes`
--
ALTER TABLE `user_quotes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `habits`
--
ALTER TABLE `habits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `habit_completions`
--
ALTER TABLE `habit_completions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quotes`
--
ALTER TABLE `quotes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_quotes`
--
ALTER TABLE `user_quotes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `habits`
--
ALTER TABLE `habits`
  ADD CONSTRAINT `habits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `habit_completions`
--
ALTER TABLE `habit_completions`
  ADD CONSTRAINT `hc_habit_fk` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `hc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_quotes`
--
ALTER TABLE `user_quotes`
  ADD CONSTRAINT `user_quotes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
