-- M1 Schema Fixes
-- 1. Order 新增 createdBy 字段
-- 2. DocumentFile 新增 sortOrder + label 字段
-- 3. Notification.type 改为 NotificationType enum

-- Fix #1: Order 新增 createdBy
ALTER TABLE `erp_orders` ADD COLUMN `created_by` VARCHAR(30) NOT NULL AFTER `operator_id`;
ALTER TABLE `erp_orders` ADD INDEX `erp_orders_company_id_created_by_idx` (`company_id`, `created_by`);

-- Fix #8: Order 新增 externalOrderNo（外部订单号）
ALTER TABLE `erp_orders` ADD COLUMN `external_order_no` VARCHAR(50) NULL AFTER `order_no`;
ALTER TABLE `erp_orders` ADD UNIQUE INDEX `erp_orders_external_order_no_key` (`external_order_no`);

-- 为已有订单设置 createdBy 为第一个客服（临时，需手动修正历史数据）
-- UPDATE erp_orders SET created_by = (SELECT id FROM erp_users WHERE role = 'CUSTOMER_SERVICE' LIMIT 1) WHERE created_by = '';

-- Fix #11: DocumentFile 新增 sortOrder + label
ALTER TABLE `erp_document_files` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0 AFTER `uploaded_by`;
ALTER TABLE `erp_document_files` ADD COLUMN `label` VARCHAR(100) NULL AFTER `sort_order`;

-- Fix #9: Notification.type 改为 enum（MySQL enum 在列定义中，需修改列）
-- 注意：MySQL 的 ALTER COLUMN 修改 enum 需要完整重定义
ALTER TABLE `erp_notifications` MODIFY COLUMN `type` ENUM(
  'ORDER_NEW',
  'ORDER_CREATED',
  'STATUS_CHANGE',
  'DOC_REVIEWED',
  'MATERIAL_UPLOADED',
  'MATERIAL_FEEDBACK',
  'APPOINTMENT_REMIND',
  'SYSTEM'
) NOT NULL;
