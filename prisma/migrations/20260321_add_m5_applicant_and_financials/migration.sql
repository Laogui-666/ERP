-- M5: 多申请人 + 财务字段 + PARTIAL 状态
-- 执行方式: npx prisma db execute --file prisma/migrations/20260321_add_m5_applicant_and_financials/migration.sql

-- 1. 新建 erp_applicants 表（含 VisaResult 枚举字段）
CREATE TABLE IF NOT EXISTS `erp_applicants` (
  `id` VARCHAR(30) NOT NULL,
  `order_id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `passport_no` VARCHAR(20) NULL,
  `passport_expiry` DATETIME(3) NULL,
  `visa_result` ENUM('APPROVED', 'REJECTED') NULL,
  `visa_result_at` DATETIME(3) NULL,
  `visa_result_note` TEXT NULL,
  `documents_complete` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `erp_applicants_order_id_idx` (`order_id`),
  INDEX `erp_applicants_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 添加外键（如果 erp_orders 表存在）
-- ALTER TABLE `erp_applicants` ADD CONSTRAINT `erp_applicants_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `erp_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Order 表扩展字段

-- 多申请人
ALTER TABLE `erp_orders` ADD COLUMN `applicant_count` INT NOT NULL DEFAULT 1;
ALTER TABLE `erp_orders` ADD COLUMN `contact_name` VARCHAR(50) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `target_city` VARCHAR(50) NULL;

-- 流程时间线
ALTER TABLE `erp_orders` ADD COLUMN `submitted_at` DATETIME(3) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `visa_result_at` DATETIME(3) NULL;

-- 财务明细
ALTER TABLE `erp_orders` ADD COLUMN `platform_fee_rate` DECIMAL(5,4) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `platform_fee` DECIMAL(10,2) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `visa_fee` DECIMAL(10,2) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `insurance_fee` DECIMAL(10,2) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `rejection_insurance` DECIMAL(10,2) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `review_bonus` DECIMAL(10,2) NULL;
ALTER TABLE `erp_orders` ADD COLUMN `gross_profit` DECIMAL(10,2) NULL;
