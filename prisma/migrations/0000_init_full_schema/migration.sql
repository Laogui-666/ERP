-- CreateTable
CREATE TABLE `erp_companies` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `logo` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `settings` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_departments` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `erp_departments_company_id_idx`(`company_id`),
    UNIQUE INDEX `erp_departments_company_id_code_key`(`company_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_users` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NULL,
    `username` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `password_hash` TEXT NOT NULL,
    `real_name` VARCHAR(50) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE', 'CUSTOMER') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    `avatar` TEXT NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `erp_users_username_key`(`username`),
    INDEX `erp_users_company_id_idx`(`company_id`),
    INDEX `erp_users_company_id_role_idx`(`company_id`, `role`),
    INDEX `erp_users_department_id_idx`(`department_id`),
    UNIQUE INDEX `erp_users_company_id_phone_key`(`company_id`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_orders` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `order_no` VARCHAR(30) NOT NULL,
    `external_order_no` VARCHAR(50) NULL,
    `customer_name` VARCHAR(50) NOT NULL,
    `customer_phone` VARCHAR(20) NOT NULL,
    `customer_email` VARCHAR(100) NULL,
    `passport_no` VARCHAR(20) NULL,
    `passport_issue` DATETIME(3) NULL,
    `passport_expiry` DATETIME(3) NULL,
    `target_country` VARCHAR(50) NOT NULL,
    `visa_type` VARCHAR(50) NOT NULL,
    `visa_category` VARCHAR(50) NULL,
    `travel_date` DATETIME(3) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` VARCHAR(30) NULL,
    `source_channel` VARCHAR(50) NULL,
    `remark` TEXT NULL,
    `status` ENUM('PENDING_CONNECTION', 'CONNECTED', 'COLLECTING_DOCS', 'PENDING_REVIEW', 'UNDER_REVIEW', 'MAKING_MATERIALS', 'PENDING_DELIVERY', 'DELIVERED', 'APPROVED', 'REJECTED', 'PARTIAL') NOT NULL DEFAULT 'PENDING_CONNECTION',
    `customer_id` VARCHAR(191) NULL,
    `collector_id` VARCHAR(191) NULL,
    `operator_id` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `appointment_date` DATETIME(3) NULL,
    `fingerprint_required` BOOLEAN NOT NULL DEFAULT false,
    `applicant_count` INTEGER NOT NULL DEFAULT 1,
    `contact_name` VARCHAR(50) NULL,
    `target_city` VARCHAR(50) NULL,
    `submitted_at` DATETIME(3) NULL,
    `visa_result_at` DATETIME(3) NULL,
    `platform_fee_rate` DECIMAL(5, 4) NULL,
    `platform_fee` DECIMAL(10, 2) NULL,
    `visa_fee` DECIMAL(10, 2) NULL,
    `insurance_fee` DECIMAL(10, 2) NULL,
    `rejection_insurance` DECIMAL(10, 2) NULL,
    `review_bonus` DECIMAL(10, 2) NULL,
    `gross_profit` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `delivered_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `erp_orders_order_no_key`(`order_no`),
    UNIQUE INDEX `erp_orders_external_order_no_key`(`external_order_no`),
    INDEX `erp_orders_company_id_idx`(`company_id`),
    INDEX `erp_orders_company_id_status_idx`(`company_id`, `status`),
    INDEX `erp_orders_customer_id_idx`(`customer_id`),
    INDEX `erp_orders_collector_id_idx`(`collector_id`),
    INDEX `erp_orders_operator_id_idx`(`operator_id`),
    INDEX `erp_orders_order_no_idx`(`order_no`),
    INDEX `erp_orders_company_id_created_by_idx`(`company_id`, `created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_applicants` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `passport_no` VARCHAR(20) NULL,
    `passport_expiry` DATETIME(3) NULL,
    `visa_result` ENUM('APPROVED', 'REJECTED') NULL,
    `visa_result_at` DATETIME(3) NULL,
    `visa_result_note` TEXT NULL,
    `documents_complete` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `erp_applicants_order_id_idx`(`order_id`),
    INDEX `erp_applicants_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_document_requirements` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('PENDING', 'UPLOADED', 'REVIEWING', 'APPROVED', 'REJECTED', 'SUPPLEMENT') NOT NULL DEFAULT 'PENDING',
    `reject_reason` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `erp_document_requirements_order_id_idx`(`order_id`),
    INDEX `erp_document_requirements_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_document_files` (
    `id` VARCHAR(191) NOT NULL,
    `requirement_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `oss_key` TEXT NOT NULL,
    `oss_url` TEXT NOT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `label` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `erp_document_files_requirement_id_idx`(`requirement_id`),
    INDEX `erp_document_files_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_visa_materials` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `oss_key` TEXT NOT NULL,
    `oss_url` TEXT NOT NULL,
    `remark` TEXT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `erp_visa_materials_order_id_idx`(`order_id`),
    INDEX `erp_visa_materials_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_order_logs` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `from_status` VARCHAR(30) NULL,
    `to_status` VARCHAR(30) NULL,
    `detail` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `erp_order_logs_order_id_idx`(`order_id`),
    INDEX `erp_order_logs_company_id_idx`(`company_id`),
    INDEX `erp_order_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NULL,
    `type` ENUM('ORDER_NEW', 'ORDER_CREATED', 'STATUS_CHANGE', 'DOC_REVIEWED', 'DOCS_SUBMITTED', 'MATERIAL_UPLOADED', 'MATERIAL_FEEDBACK', 'APPOINTMENT_REMIND', 'SYSTEM', 'CHAT_MESSAGE') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `erp_notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `erp_notifications_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_visa_templates` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `country` VARCHAR(50) NOT NULL,
    `visa_type` VARCHAR(50) NOT NULL,
    `items` JSON NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `erp_visa_templates_company_id_idx`(`company_id`),
    INDEX `erp_visa_templates_company_id_country_visa_type_idx`(`company_id`, `country`, `visa_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_chat_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED', 'MUTED') NOT NULL DEFAULT 'ACTIVE',
    `last_message` TEXT NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `erp_chat_rooms_order_id_key`(`order_id`),
    INDEX `erp_chat_rooms_company_id_idx`(`company_id`),
    INDEX `erp_chat_rooms_company_id_last_message_at_idx`(`company_id`, `last_message_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') NOT NULL,
    `content` TEXT NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size` INTEGER NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `erp_chat_messages_room_id_created_at_idx`(`room_id`, `created_at`),
    INDEX `erp_chat_messages_room_id_created_at_id_idx`(`room_id`, `created_at`, `id`),
    INDEX `erp_chat_messages_company_id_idx`(`company_id`),
    INDEX `erp_chat_messages_sender_id_idx`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erp_chat_reads` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `last_read_message_id` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `erp_chat_reads_user_id_idx`(`user_id`),
    UNIQUE INDEX `erp_chat_reads_room_id_user_id_key`(`room_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `erp_departments` ADD CONSTRAINT `erp_departments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `erp_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_departments` ADD CONSTRAINT `erp_departments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `erp_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_users` ADD CONSTRAINT `erp_users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `erp_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_users` ADD CONSTRAINT `erp_users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `erp_departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_orders` ADD CONSTRAINT `erp_orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `erp_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_orders` ADD CONSTRAINT `erp_orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `erp_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_orders` ADD CONSTRAINT `erp_orders_collector_id_fkey` FOREIGN KEY (`collector_id`) REFERENCES `erp_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_orders` ADD CONSTRAINT `erp_orders_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `erp_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_orders` ADD CONSTRAINT `erp_orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `erp_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_applicants` ADD CONSTRAINT `erp_applicants_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_document_requirements` ADD CONSTRAINT `erp_document_requirements_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_document_files` ADD CONSTRAINT `erp_document_files_requirement_id_fkey` FOREIGN KEY (`requirement_id`) REFERENCES `erp_document_requirements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_visa_materials` ADD CONSTRAINT `erp_visa_materials_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_order_logs` ADD CONSTRAINT `erp_order_logs_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_order_logs` ADD CONSTRAINT `erp_order_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `erp_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_notifications` ADD CONSTRAINT `erp_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `erp_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_notifications` ADD CONSTRAINT `erp_notifications_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_visa_templates` ADD CONSTRAINT `erp_visa_templates_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `erp_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_chat_rooms` ADD CONSTRAINT `erp_chat_rooms_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `erp_companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_chat_rooms` ADD CONSTRAINT `erp_chat_rooms_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_chat_messages` ADD CONSTRAINT `erp_chat_messages_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `erp_chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_chat_messages` ADD CONSTRAINT `erp_chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `erp_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_chat_reads` ADD CONSTRAINT `erp_chat_reads_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `erp_chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erp_chat_reads` ADD CONSTRAINT `erp_chat_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `erp_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.6.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
