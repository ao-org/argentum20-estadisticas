-- phpMyAdmin SQL Dump
-- version 4.9.5deb2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 14, 2026 at 08:53 AM
-- Server version: 8.0.42-0ubuntu0.20.04.1
-- PHP Version: 7.4.3-4ubuntu2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ao20_prod_clone`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `id` int NOT NULL,
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
  `is_active_patron` int DEFAULT NULL,
  `offline_patron_credits` int DEFAULT NULL,
  `last_patron_credits_payment` varchar(325) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `code_timestamp` varchar(325) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `token` text COLLATE utf8mb4_general_ci,
  `two_fa_code` varchar(6) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transfer_code_timestamp` varchar(325) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_item`
--

CREATE TABLE `bank_item` (
  `user_id` int NOT NULL,
  `number` int NOT NULL,
  `item_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `elemental_tags` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Banco con los items de los pjs';

-- --------------------------------------------------------

--
-- Table structure for table `char_transfer_record`
--

CREATE TABLE `char_transfer_record` (
  `id` int NOT NULL,
  `old_owner` int NOT NULL,
  `new_owner` int NOT NULL,
  `char_id` int NOT NULL,
  `timestamp` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `erc20_account`
--

CREATE TABLE `erc20_account` (
  `erc20_wallet_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'ERC20 wallet address for receiving payments',
  `updated_at` datetime DEFAULT NULL,
  `account_id` int NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `link_created_at` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `global_quest_desc`
--

CREATE TABLE `global_quest_desc` (
  `id` int NOT NULL,
  `event_id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `obj_id` int NOT NULL,
  `threshold` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `global_quest_user_contribution`
--

CREATE TABLE `global_quest_user_contribution` (
  `id` int NOT NULL,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `amount` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guilds`
--

CREATE TABLE `guilds` (
  `id` int NOT NULL,
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
  `url` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guild_members`
--

CREATE TABLE `guild_members` (
  `id` int NOT NULL,
  `guild_id` int NOT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guild_member_history`
--

CREATE TABLE `guild_member_history` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `guild_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `request_time` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guild_request`
--

CREATE TABLE `guild_request` (
  `id` int NOT NULL,
  `guild_id` int NOT NULL,
  `user_id` int NOT NULL,
  `description` varchar(512) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guild_request_history`
--

CREATE TABLE `guild_request_history` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `guild_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `request_time` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_item`
--

CREATE TABLE `inventory_item` (
  `user_id` int NOT NULL,
  `number` int NOT NULL,
  `item_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `is_equipped` int DEFAULT NULL,
  `elemental_tags` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Inventario de los pjs';

-- --------------------------------------------------------

--
-- Table structure for table `inventory_item_skins`
--

CREATE TABLE `inventory_item_skins` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `type_skin` int NOT NULL,
  `skin_id` int NOT NULL,
  `skin_equipped` tinyint NOT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mercadopago_account`
--

CREATE TABLE `mercadopago_account` (
  `access_token` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `refresh_token` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expires_in` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `mercadopago_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int NOT NULL DEFAULT '0',
  `date` varchar(11) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `description` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- --------------------------------------------------------

--
-- Table structure for table `patreon_shop_audit`
--

CREATE TABLE `patreon_shop_audit` (
  `id` int NOT NULL DEFAULT '0',
  `acc_id` int NOT NULL DEFAULT '0',
  `char_id` int NOT NULL DEFAULT '0',
  `item_id` int NOT NULL DEFAULT '0',
  `price` int NOT NULL DEFAULT '0',
  `credit_left` int NOT NULL DEFAULT '0',
  `time` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- --------------------------------------------------------

--
-- Table structure for table `pet`
--

CREATE TABLE `pet` (
  `user_id` int NOT NULL,
  `number` int NOT NULL,
  `pet_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Atributos de los pjs';

-- --------------------------------------------------------

--
-- Table structure for table `punishment`
--

CREATE TABLE `punishment` (
  `user_id` int NOT NULL,
  `number` int NOT NULL DEFAULT '0',
  `reason` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quest`
--

CREATE TABLE `quest` (
  `user_id` int NOT NULL,
  `number` int NOT NULL,
  `quest_id` int DEFAULT NULL,
  `npcstarget` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0',
  `npcs` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Quests empezadas por los pjs';

-- --------------------------------------------------------

--
-- Table structure for table `quest_done`
--

CREATE TABLE `quest_done` (
  `user_id` int NOT NULL,
  `quest_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Quests hechas de los pjs';

-- --------------------------------------------------------

--
-- Stand-in structure for view `ranking_users`
-- (See below for the actual view)
--
CREATE TABLE `ranking_users` (
`id` int
,`character_name` varchar(255)
,`class_id` int
,`race_id` int
,`genre_id` int
,`head_id` int
,`level` int
,`exp` int
,`total_gold` bigint
,`total_kills` bigint
,`criminales_matados` int
,`ciudadanos_matados` int
,`puntos_pesca` int
,`deaths` int
,`killed_npcs` int
,`is_locked_in_mao` tinyint
);

-- --------------------------------------------------------

--
-- Table structure for table `skillpoint`
--

CREATE TABLE `skillpoint` (
  `user_id` int NOT NULL,
  `number` int NOT NULL,
  `value` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Skills de los pjs';

-- --------------------------------------------------------

--
-- Table structure for table `spell`
--

CREATE TABLE `spell` (
  `user_id` int NOT NULL,
  `number` int NOT NULL,
  `spell_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Hechizos de los pjs';

-- --------------------------------------------------------

--
-- Table structure for table `statistics_users_online`
--

CREATE TABLE `statistics_users_online` (
  `number` int NOT NULL DEFAULT '1',
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de estadisticas de usuarios por hora';

-- --------------------------------------------------------

--
-- Table structure for table `stripeconnect_account`
--

CREATE TABLE `stripeconnect_account` (
  `expires_at` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `stripe_connect_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `link_created_at` bigint DEFAULT NULL,
  `stripe_object` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int NOT NULL,
  `encrypted_token` text CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `decrypted_token` text CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `username` text CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `remote_host` text CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `timestamp` text CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- --------------------------------------------------------

--
-- Table structure for table `usdt_account`
--

CREATE TABLE `usdt_account` (
  `usdt_wallet_address` varchar(42) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'USDT wallet address for receiving payments',
  `updated_at` datetime DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `link_created_at` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
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
  `alias` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `user_temporada_0`
--

CREATE TABLE `user_temporada_0` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `name` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `level` int NOT NULL,
  `exp` int NOT NULL,
  `genre_id` int NOT NULL,
  `race_id` int NOT NULL,
  `class_id` int NOT NULL,
  `home_id` int NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `gold` int NOT NULL,
  `bank_gold` int NOT NULL,
  `free_skillpoints` int NOT NULL,
  `pets_saved` int NOT NULL,
  `spouse` int NOT NULL,
  `message_info` varchar(512) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
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
  `banned_by` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ban_reason` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
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
  `guild_rejected_because` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
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
  `delete_code` varchar(8) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `user_key` varchar(128) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `is_reset` tinyint NOT NULL,
  `is_published` tinyint DEFAULT NULL,
  `price_in_mao` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `user_temporada_1`
--

CREATE TABLE `user_temporada_1` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `name` varchar(30) NOT NULL,
  `level` int NOT NULL,
  `exp` int NOT NULL,
  `genre_id` int NOT NULL,
  `race_id` int NOT NULL,
  `class_id` int NOT NULL,
  `home_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `gold` int NOT NULL,
  `bank_gold` int NOT NULL,
  `free_skillpoints` int NOT NULL,
  `pets_saved` int NOT NULL,
  `spouse` int NOT NULL,
  `message_info` varchar(512) DEFAULT NULL,
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
  `banned_by` varchar(30) NOT NULL,
  `ban_reason` varchar(255) DEFAULT NULL,
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
  `guild_rejected_because` varchar(255) DEFAULT NULL,
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
  `delete_code` varchar(8) DEFAULT NULL,
  `user_key` varchar(128) DEFAULT NULL,
  `is_reset` tinyint NOT NULL,
  `is_published` tinyint DEFAULT NULL,
  `price_in_mao` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `user_temporada_2`
--

CREATE TABLE `user_temporada_2` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `name` varchar(30) NOT NULL,
  `level` int NOT NULL,
  `exp` int NOT NULL,
  `genre_id` int NOT NULL,
  `race_id` int NOT NULL,
  `class_id` int NOT NULL,
  `home_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `gold` int NOT NULL,
  `bank_gold` int NOT NULL,
  `free_skillpoints` int NOT NULL,
  `pets_saved` int NOT NULL,
  `spouse` int NOT NULL,
  `message_info` varchar(512) DEFAULT NULL,
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
  `banned_by` varchar(30) NOT NULL,
  `ban_reason` varchar(255) DEFAULT NULL,
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
  `guild_rejected_because` varchar(255) DEFAULT NULL,
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
  `delete_code` varchar(8) DEFAULT NULL,
  `user_key` varchar(128) DEFAULT NULL,
  `is_reset` tinyint NOT NULL,
  `is_published` tinyint DEFAULT NULL,
  `price_in_mao` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `user_temporada_3`
--

CREATE TABLE `user_temporada_3` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `name` varchar(30) NOT NULL,
  `level` int NOT NULL,
  `exp` int NOT NULL,
  `genre_id` int NOT NULL,
  `race_id` int NOT NULL,
  `class_id` int NOT NULL,
  `home_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `gold` int NOT NULL,
  `bank_gold` int NOT NULL,
  `free_skillpoints` int NOT NULL,
  `pets_saved` int NOT NULL,
  `spouse` int NOT NULL,
  `message_info` varchar(512) DEFAULT NULL,
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
  `banned_by` varchar(30) NOT NULL,
  `ban_reason` varchar(255) DEFAULT NULL,
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
  `guild_rejected_because` varchar(255) DEFAULT NULL,
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
  `delete_code` varchar(8) DEFAULT NULL,
  `user_key` varchar(128) DEFAULT NULL,
  `is_reset` tinyint NOT NULL,
  `is_published` tinyint DEFAULT NULL,
  `price_in_mao` int DEFAULT NULL,
  `max_hp` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `user_temporada_4`
--

CREATE TABLE `user_temporada_4` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `name` varchar(30) NOT NULL,
  `level` int NOT NULL,
  `exp` int NOT NULL,
  `genre_id` int NOT NULL,
  `race_id` int NOT NULL,
  `class_id` int NOT NULL,
  `home_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `gold` int NOT NULL,
  `bank_gold` int NOT NULL,
  `free_skillpoints` int NOT NULL,
  `pets_saved` int NOT NULL,
  `spouse` int NOT NULL,
  `message_info` varchar(512) DEFAULT NULL,
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
  `banned_by` varchar(30) NOT NULL,
  `ban_reason` varchar(255) DEFAULT NULL,
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
  `guild_rejected_because` varchar(255) DEFAULT NULL,
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
  `delete_code` varchar(8) DEFAULT NULL,
  `user_key` varchar(128) DEFAULT NULL,
  `is_reset` tinyint NOT NULL,
  `is_published` tinyint DEFAULT NULL,
  `price_in_mao` int DEFAULT NULL,
  `max_hp` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Structure for view `ranking_users`
--
DROP TABLE IF EXISTS `ranking_users`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `ranking_users`  AS  select `u`.`id` AS `id`,`u`.`name` AS `character_name`,`u`.`class_id` AS `class_id`,`u`.`race_id` AS `race_id`,`u`.`genre_id` AS `genre_id`,`u`.`head_id` AS `head_id`,`u`.`level` AS `level`,`u`.`exp` AS `exp`,(`u`.`gold` + `u`.`bank_gold`) AS `total_gold`,(`u`.`criminales_matados` + `u`.`ciudadanos_matados`) AS `total_kills`,`u`.`criminales_matados` AS `criminales_matados`,`u`.`ciudadanos_matados` AS `ciudadanos_matados`,`u`.`puntos_pesca` AS `puntos_pesca`,`u`.`deaths` AS `deaths`,`u`.`killed_npcs` AS `killed_npcs`,`u`.`is_locked_in_mao` AS `is_locked_in_mao` from `user` `u` where ((`u`.`deleted` <> true) and (`u`.`is_banned` <> true)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`id`) USING BTREE;

--
-- Indexes for table `bank_item`
--
ALTER TABLE `bank_item`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `char_transfer_record`
--
ALTER TABLE `char_transfer_record`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `erc20_account`
--
ALTER TABLE `erc20_account`
  ADD PRIMARY KEY (`account_id`),
  ADD KEY `idx_erc20_wallet` (`erc20_wallet_address`),
  ADD KEY `idx_erc20_account_id` (`account_id`);

--
-- Indexes for table `global_quest_desc`
--
ALTER TABLE `global_quest_desc`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event_id` (`event_id`),
  ADD KEY `idx_event_id` (`event_id`);

--
-- Indexes for table `global_quest_user_contribution`
--
ALTER TABLE `global_quest_user_contribution`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_id_contribution` (`event_id`),
  ADD KEY `idx_user_id_contribution` (`user_id`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `guilds`
--
ALTER TABLE `guilds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guild_members`
--
ALTER TABLE `guild_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `guild_id` (`guild_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `guild_member_history`
--
ALTER TABLE `guild_member_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `guild_request`
--
ALTER TABLE `guild_request`
  ADD PRIMARY KEY (`id`),
  ADD KEY `guild_id` (`guild_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `guild_request_history`
--
ALTER TABLE `guild_request_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `inventory_item`
--
ALTER TABLE `inventory_item`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `inventory_item_skins`
--
ALTER TABLE `inventory_item_skins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `patreon_shop_audit`
--
ALTER TABLE `patreon_shop_audit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pet`
--
ALTER TABLE `pet`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `punishment`
--
ALTER TABLE `punishment`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `quest`
--
ALTER TABLE `quest`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `quest_done`
--
ALTER TABLE `quest_done`
  ADD PRIMARY KEY (`user_id`,`quest_id`);

--
-- Indexes for table `skillpoint`
--
ALTER TABLE `skillpoint`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `spell`
--
ALTER TABLE `spell`
  ADD PRIMARY KEY (`user_id`,`number`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `usdt_account`
--
ALTER TABLE `usdt_account`
  ADD KEY `idx_usdt_wallet` (`usdt_wallet_address`),
  ADD KEY `idx_usdt_account_id` (`account_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `user_temporada_0`
--
ALTER TABLE `user_temporada_0`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `user_index` (`id`,`account_id`,`deleted`) USING BTREE,
  ADD KEY (`account_id`) USING BTREE;

--
-- Indexes for table `user_temporada_1`
--
ALTER TABLE `user_temporada_1`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_index` (`id`,`account_id`,`deleted`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `user_temporada_2`
--
ALTER TABLE `user_temporada_2`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_index` (`id`,`account_id`,`deleted`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `user_temporada_3`
--
ALTER TABLE `user_temporada_3`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `user_temporada_4`
--
ALTER TABLE `user_temporada_4`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_id` (`account_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `global_quest_desc`
--
ALTER TABLE `global_quest_desc`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `global_quest_user_contribution`
--
ALTER TABLE `global_quest_user_contribution`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guilds`
--
ALTER TABLE `guilds`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guild_members`
--
ALTER TABLE `guild_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guild_member_history`
--
ALTER TABLE `guild_member_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guild_request`
--
ALTER TABLE `guild_request`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guild_request_history`
--
ALTER TABLE `guild_request_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_item_skins`
--
ALTER TABLE `inventory_item_skins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `global_quest_user_contribution`
--
ALTER TABLE `global_quest_user_contribution`
  ADD CONSTRAINT `fk_global_quest_contribution_event` FOREIGN KEY (`event_id`) REFERENCES `global_quest_desc` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_global_quest_contribution_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `guild_members`
--
ALTER TABLE `guild_members`
  ADD CONSTRAINT `guild_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `guild_member_history`
--
ALTER TABLE `guild_member_history`
  ADD CONSTRAINT `guild_member_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `guild_request`
--
ALTER TABLE `guild_request`
  ADD CONSTRAINT `guild_request_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `guild_request_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `guild_request_history`
--
ALTER TABLE `guild_request_history`
  ADD CONSTRAINT `guild_request_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory_item`
--
ALTER TABLE `inventory_item`
  ADD CONSTRAINT `user_id_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

--
-- Constraints for table `inventory_item_skins`
--
ALTER TABLE `inventory_item_skins`
  ADD CONSTRAINT `inventory_item_skins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `punishment`
--
ALTER TABLE `punishment`
  ADD CONSTRAINT `punishment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
