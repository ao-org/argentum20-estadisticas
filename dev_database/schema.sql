-- Development Database Schema for AO Statistics
-- Based on ao20 production database structure
-- This file creates the necessary tables for local development

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET foreign_key_checks = 0;
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Table: account
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(320) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` char(64) COLLATE utf8mb4_general_ci NOT NULL,
  `salt` char(32) COLLATE utf8mb4_general_ci NOT NULL,
  `date_created` datetime NOT NULL,
  `deleted` int DEFAULT '0',
  `validated` int NOT NULL DEFAULT '0',
  `validate_code` char(32) COLLATE utf8mb4_general_ci NOT NULL,
  `recovery_code` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_banned` int DEFAULT NULL,
  `banned_by` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ban_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `credits` int NOT NULL DEFAULT '0',
  `is_donor` int NOT NULL DEFAULT '0',
  `donor_expire` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `credits_used` int NOT NULL DEFAULT '0',
  `donor_purchases` int NOT NULL DEFAULT '0',
  `last_access` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_ip` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: user
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `level` int NOT NULL,
  `exp` int NOT NULL,
  `genre_id` int NOT NULL,
  `race_id` int NOT NULL,
  `class_id` int NOT NULL,
  `home_id` int NOT NULL,
  `description` text,
  `gold` int NOT NULL,
  `bank_gold` int NOT NULL,
  `free_skillpoints` int NOT NULL,
  `pets_saved` int NOT NULL,
  `spouse` int NOT NULL,
  `message_info` varchar(512) DEFAULT '',
  `pos_map` int NOT NULL,
  `pos_x` int NOT NULL,
  `pos_y` int NOT NULL,
  `body_id` int NOT NULL,
  `head_id` int NOT NULL,
  `weapon_id` int NOT NULL,
  `helmet_id` int NOT NULL,
  `shield_id` int NOT NULL,
  `heading` int NOT NULL,
  `min_hp` int NOT NULL,
  `min_man` int NOT NULL,
  `min_sta` int NOT NULL,
  `min_ham` int NOT NULL,
  `min_sed` int NOT NULL,
  `killed_npcs` int NOT NULL,
  `killed_users` int NOT NULL,
  `invent_level` int NOT NULL,
  `is_naked` tinyint NOT NULL,
  `is_poisoned` tinyint NOT NULL,
  `is_incinerated` tinyint NOT NULL,
  `is_dead` tinyint NOT NULL,
  `is_sailing` tinyint NOT NULL,
  `is_paralyzed` tinyint NOT NULL,
  `is_silenced` tinyint NOT NULL,
  `silence_minutes_left` int DEFAULT NULL,
  `silence_elapsed_seconds` int DEFAULT NULL,
  `is_mounted` tinyint NOT NULL,
  `is_banned` tinyint DEFAULT NULL,
  `banned_by` varchar(255) DEFAULT NULL,
  `ban_reason` text,
  `counter_pena` int NOT NULL,
  `deaths` int NOT NULL,
  `ciudadanos_matados` int NOT NULL,
  `criminales_matados` int NOT NULL,
  `recibio_armadura_real` tinyint NOT NULL,
  `recibio_armadura_caos` tinyint NOT NULL,
  `recompensas_real` int DEFAULT NULL,
  `recompensas_caos` int DEFAULT NULL,
  `faction_score` int DEFAULT NULL,
  `reenlistadas` int NOT NULL,
  `fecha_ingreso` datetime NOT NULL,
  `nivel_ingreso` int DEFAULT NULL,
  `matados_ingreso` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `guild_index` int DEFAULT NULL,
  `guild_aspirant_index` int DEFAULT NULL,
  `guild_rejected_because` text,
  `chat_global` int DEFAULT NULL,
  `chat_combate` int DEFAULT NULL,
  `warnings` int NOT NULL,
  `elo` int NOT NULL,
  `return_map` int NOT NULL,
  `return_x` int NOT NULL,
  `return_y` int NOT NULL,
  `last_logout` int NOT NULL,
  `is_locked_in_mao` tinyint DEFAULT NULL,
  `is_logged` tinyint NOT NULL,
  `puntos_pesca` int DEFAULT NULL,
  `delete_code` varchar(8) DEFAULT '',
  `user_key` varchar(128) DEFAULT '',
  `is_reset` tinyint NOT NULL,
  `is_published` tinyint DEFAULT NULL,
  `price_in_mao` int DEFAULT NULL,
  `max_hp` int NOT NULL,
  `jinete_level` int NOT NULL DEFAULT '0',
  `backpack_id` int NOT NULL DEFAULT '0',
  `transfer_code` varchar(8) DEFAULT '',
  `transfer_target` varchar(255) DEFAULT '',
  `alias` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------
-- Table: guilds
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `guilds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `founder_id` int NOT NULL,
  `guild_name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `creation_date` bigint NOT NULL DEFAULT '0',
  `alignment` int NOT NULL,
  `last_elections` bigint NOT NULL DEFAULT '0',
  `description` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `news` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `leader_id` int NOT NULL DEFAULT '0',
  `level` int NOT NULL DEFAULT '1',
  `current_exp` int NOT NULL DEFAULT '0',
  `flag_file` int NOT NULL DEFAULT '0',
  `url` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: guild_members
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `guild_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guild_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `guild_id` (`guild_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: statistics_users_online
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `statistics_users_online` (
  `number` int NOT NULL DEFAULT '1',
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de estadisticas de usuarios por hora';

-- --------------------------------------------------------
-- View: ranking_users
-- --------------------------------------------------------
CREATE OR REPLACE VIEW `ranking_users` AS
SELECT
  `u`.`id` AS `id`,
  `u`.`name` AS `character_name`,
  `u`.`class_id` AS `class_id`,
  `u`.`race_id` AS `race_id`,
  `u`.`genre_id` AS `genre_id`,
  `u`.`head_id` AS `head_id`,
  `u`.`level` AS `level`,
  `u`.`exp` AS `exp`,
  (`u`.`gold` + `u`.`bank_gold`) AS `total_gold`,
  (`u`.`criminales_matados` + `u`.`ciudadanos_matados`) AS `total_kills`,
  `u`.`criminales_matados` AS `criminales_matados`,
  `u`.`ciudadanos_matados` AS `ciudadanos_matados`,
  `u`.`puntos_pesca` AS `puntos_pesca`,
  `u`.`deaths` AS `deaths`,
  `u`.`killed_npcs` AS `killed_npcs`,
  `u`.`is_locked_in_mao` AS `is_locked_in_mao`
FROM `user` `u`
WHERE `u`.`deleted` <> 1
  AND (`u`.`is_banned` IS NULL OR `u`.`is_banned` <> 1);

-- --------------------------------------------------------
-- Table: quest_done
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quest_done` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `quest_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: global_quest_desc
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `global_quest_desc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `threshold` int NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '0',
  `event_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table: global_quest_user_contribution
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `global_quest_user_contribution` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET foreign_key_checks = 1;
