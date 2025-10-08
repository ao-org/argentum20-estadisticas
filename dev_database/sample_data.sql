-- Sample data for development environment
-- This creates realistic test data for the AO Statistics dashboard

SET NAMES utf8;

-- Sample accounts
INSERT INTO `account` (`id`, `username`, `password`, `email`, `created_at`) VALUES
(1, 'player1', 'hashed_password_1', 'player1@example.com', '2024-01-15 10:30:00'),
(2, 'player2', 'hashed_password_2', 'player2@example.com', '2024-01-20 14:22:00'),
(3, 'player3', 'hashed_password_3', 'player3@example.com', '2024-02-01 09:15:00'),
(4, 'player4', 'hashed_password_4', 'player4@example.com', '2024-02-10 16:45:00'),
(5, 'player5', 'hashed_password_5', 'player5@example.com', '2024-02-15 11:20:00'),
(6, 'admin_guild', 'admin_password', 'admin@example.com', '2024-01-01 00:00:00');

-- Sample characters with varied classes, races, and levels
INSERT INTO `user` (`id`, `account_id`, `name`, `class_id`, `race_id`, `level`, `ciudadanos_matados`, `criminales_matados`, `guild_index`, `deleted`) VALUES

-- Regular players
(2, 1, 'MagoElfico', 1, 2, 25, 5, 12, 0, 0),
(3, 1, 'GuerreroHumano', 3, 1, 35, 15, 8, 0, 0),
(4, 2, 'ClerigoEnano', 2, 5, 28, 2, 3, 0, 0),
(5, 2, 'AsesinoOscuro', 4, 3, 42, 25, 30, 0, 0),
(6, 3, 'BardoGnomo', 5, 4, 18, 1, 0, 0, 0),
(7, 3, 'DruidaElfo', 6, 2, 31, 8, 5, 0, 0),
(8, 4, 'PaladinHumano', 7, 1, 38, 12, 2, 0, 0),
(9, 4, 'CazadorOrco', 8, 6, 22, 18, 15, 0, 0),
(10, 5, 'TrabajadorHumano', 9, 1, 15, 3, 1, 0, 0),
(11, 5, 'BandidoOrco', 10, 6, 33, 22, 28, 0, 0),

-- More characters for better statistics
(12, 1, 'MagoHumano2', 1, 1, 20, 3, 7, 0, 0),
(13, 2, 'GuerreroOrco2', 3, 6, 45, 35, 20, 0, 0),
(14, 3, 'ClerigoElfo2', 2, 2, 30, 5, 4, 0, 0),
(15, 4, 'AsesinoHumano2', 4, 1, 40, 28, 35, 0, 0),
(16, 5, 'BardoElfo2', 5, 2, 25, 2, 1, 0, 0),
(17, 1, 'DruidaEnano2', 6, 5, 27, 6, 3, 0, 0),
(18, 2, 'PaladinElfo2', 7, 2, 35, 15, 8, 0, 0),
(19, 3, 'CazadorHumano2', 8, 1, 29, 12, 18, 0, 0),
(20, 4, 'TrabajadorGnomo2', 9, 4, 16, 2, 0, 0, 0),
(21, 5, 'BandidoHumano2', 10, 1, 37, 30, 25, 0, 0),

-- Some deleted characters (for testing deleted = 1 filter)
(22, 1, 'DeletedChar1', 1, 1, 20, 5, 3, 0, 1),
(23, 2, 'DeletedChar2', 3, 2, 25, 10, 8, 0, 1);

-- Sample online statistics (last 24 hours with hourly data)
INSERT INTO `statistics_users_online` (`date`, `number`) VALUES
-- Yesterday's data
('2024-10-07 00:00:00', 5),
('2024-10-07 01:00:00', 3),
('2024-10-07 02:00:00', 2),
('2024-10-07 03:00:00', 1),
('2024-10-07 04:00:00', 1),
('2024-10-07 05:00:00', 2),
('2024-10-07 06:00:00', 4),
('2024-10-07 07:00:00', 8),
('2024-10-07 08:00:00', 12),
('2024-10-07 09:00:00', 15),
('2024-10-07 10:00:00', 18),
('2024-10-07 11:00:00', 22),
('2024-10-07 12:00:00', 25),
('2024-10-07 13:00:00', 28),
('2024-10-07 14:00:00', 30),
('2024-10-07 15:00:00', 32),
('2024-10-07 16:00:00', 35),
('2024-10-07 17:00:00', 38),
('2024-10-07 18:00:00', 42),
('2024-10-07 19:00:00', 45),
('2024-10-07 20:00:00', 48),
('2024-10-07 21:00:00', 45),
('2024-10-07 22:00:00', 38),
('2024-10-07 23:00:00', 28),

-- Today's data (partial)
('2024-10-08 00:00:00', 18),
('2024-10-08 01:00:00', 12),
('2024-10-08 02:00:00', 8),
('2024-10-08 03:00:00', 5),
('2024-10-08 04:00:00', 3),
('2024-10-08 05:00:00', 4),
('2024-10-08 06:00:00', 7),
('2024-10-08 07:00:00', 11),
('2024-10-08 08:00:00', 16),
('2024-10-08 09:00:00', 21),
('2024-10-08 10:00:00', 26);