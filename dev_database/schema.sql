-- Development Database Schema for AO Statistics
-- This file creates the necessary tables for local development

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS `ao_stats_dev` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
-- USE `ao_stats_dev`;

-- Account table
CREATE TABLE IF NOT EXISTS `account` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- User (character) table
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `class_id` tinyint(4) NOT NULL,
  `race_id` tinyint(4) NOT NULL,
  `level` tinyint(4) DEFAULT 1,
  `ciudadanos_matados` int(11) DEFAULT 0,
  `criminales_matados` int(11) DEFAULT 0,
  `guild_index` int(11) DEFAULT 0,
  `deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `account_id` (`account_id`),
  KEY `class_id` (`class_id`),
  KEY `race_id` (`race_id`),
  KEY `level` (`level`),
  KEY `deleted` (`deleted`),
  KEY `guild_index` (`guild_index`),
  FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Statistics for online users tracking
CREATE TABLE IF NOT EXISTS `statistics_users_online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `number` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Class reference data
CREATE TABLE IF NOT EXISTS `character_classes` (
  `id` tinyint(4) NOT NULL,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `character_classes` (`id`, `name`) VALUES
(1, 'Mago'),
(2, 'Clérigo'),
(3, 'Guerrero'),
(4, 'Asesino'),
(5, 'Bardo'),
(6, 'Druida'),
(7, 'Paladin'),
(8, 'Cazador'),
(9, 'Trabajador'),
(12, 'Bandido');

-- Race reference data
CREATE TABLE IF NOT EXISTS `character_races` (
  `id` tinyint(4) NOT NULL,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `character_races` (`id`, `name`) VALUES
(1, 'Humano'),
(2, 'Elfo'),
(3, 'Elfo Oscuro'),
(4, 'Gnomo'),
(5, 'Enano'),
(6, 'Orco');