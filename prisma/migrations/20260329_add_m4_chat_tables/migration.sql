-- M4: 聊天系统（ChatRoom + ChatMessage + ChatRead）
-- 执行方式: npx prisma db execute --file prisma/migrations/20260329_add_m4_chat_tables/migration.sql

-- 1. ChatRoom 枚举
CREATE TABLE IF NOT EXISTS `erp_chat_rooms` (
  `id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30) NOT NULL,
  `order_id` VARCHAR(30) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `status` ENUM('ACTIVE', 'ARCHIVED', 'MUTED') NOT NULL DEFAULT 'ACTIVE',
  `last_message` TEXT NULL,
  `last_message_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `erp_chat_rooms_order_id_key` (`order_id`),
  INDEX `erp_chat_rooms_company_id_idx` (`company_id`),
  INDEX `erp_chat_rooms_company_id_last_message_at_idx` (`company_id`, `last_message_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. ChatMessage
CREATE TABLE IF NOT EXISTS `erp_chat_messages` (
  `id` VARCHAR(30) NOT NULL,
  `room_id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30) NOT NULL,
  `sender_id` VARCHAR(30) NOT NULL,
  `type` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
  `content` TEXT NOT NULL,
  `file_name` VARCHAR(255) NULL,
  `file_size` INT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `erp_chat_messages_room_id_created_at_idx` (`room_id`, `created_at`),
  INDEX `erp_chat_messages_room_id_created_at_id_idx` (`room_id`, `created_at`, `id`),
  INDEX `erp_chat_messages_company_id_idx` (`company_id`),
  INDEX `erp_chat_messages_sender_id_idx` (`sender_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. ChatRead（已读回执）
CREATE TABLE IF NOT EXISTS `erp_chat_reads` (
  `id` VARCHAR(30) NOT NULL,
  `room_id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `last_read_message_id` VARCHAR(30) NULL,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `erp_chat_reads_room_id_user_id_key` (`room_id`, `user_id`),
  INDEX `erp_chat_reads_user_id_idx` (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
