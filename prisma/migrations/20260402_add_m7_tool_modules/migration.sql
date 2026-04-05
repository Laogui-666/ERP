-- M7 Phase 5: 6大工具模块
-- erp_news_articles / erp_itineraries / erp_form_templates / erp_form_records
-- erp_visa_assessments / erp_translation_requests / erp_doc_helper_templates / erp_generated_documents

-- 签证资讯
CREATE TABLE IF NOT EXISTS `erp_news_articles` (
  `id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30),
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `cover_image` TEXT,
  `category` VARCHAR(50) NOT NULL,
  `tags` JSON,
  `author_id` VARCHAR(30) NOT NULL,
  `view_count` INT NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT false,
  `is_pinned` BOOLEAN NOT NULL DEFAULT false,
  `published_at` DATETIME(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `erp_news_articles_category_idx` (`category`),
  INDEX `erp_news_articles_is_published_published_at_idx` (`is_published`, `published_at`),
  INDEX `erp_news_articles_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 行程助手
CREATE TABLE IF NOT EXISTS `erp_itineraries` (
  `id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30),
  `title` VARCHAR(200) NOT NULL,
  `destination` VARCHAR(100) NOT NULL,
  `start_date` DATETIME(3),
  `end_date` DATETIME(3),
  `days` JSON NOT NULL,
  `budget` DECIMAL(10,2),
  `preferences` JSON,
  `cover_image` TEXT,
  `is_public` BOOLEAN NOT NULL DEFAULT false,
  `is_template` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `erp_itineraries_user_id_idx` (`user_id`),
  INDEX `erp_itineraries_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 申请表模板
CREATE TABLE IF NOT EXISTS `erp_form_templates` (
  `id` VARCHAR(30) NOT NULL,
  `country` VARCHAR(50) NOT NULL,
  `visa_type` VARCHAR(50) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `fields` JSON NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `erp_form_templates_country_idx` (`country`),
  INDEX `erp_form_templates_country_visa_type_idx` (`country`, `visa_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 申请表记录
CREATE TABLE IF NOT EXISTS `erp_form_records` (
  `id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `template_id` VARCHAR(30) NOT NULL,
  `data` JSON NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `erp_form_records_user_id_idx` (`user_id`),
  INDEX `erp_form_records_template_id_idx` (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 签证评估
CREATE TABLE IF NOT EXISTS `erp_visa_assessments` (
  `id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30),
  `country` VARCHAR(50) NOT NULL,
  `visa_type` VARCHAR(50) NOT NULL,
  `answers` JSON NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `level` VARCHAR(20) NOT NULL,
  `suggestions` JSON,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `erp_visa_assessments_user_id_idx` (`user_id`),
  INDEX `erp_visa_assessments_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 翻译请求
CREATE TABLE IF NOT EXISTS `erp_translation_requests` (
  `id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30),
  `source_lang` VARCHAR(10) NOT NULL,
  `target_lang` VARCHAR(10) NOT NULL,
  `doc_type` VARCHAR(30) NOT NULL,
  `source_url` TEXT,
  `result_text` TEXT,
  `result_url` TEXT,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `erp_translation_requests_user_id_idx` (`user_id`),
  INDEX `erp_translation_requests_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 证明文件模板
CREATE TABLE IF NOT EXISTS `erp_doc_helper_templates` (
  `id` VARCHAR(30) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `language` VARCHAR(10) NOT NULL,
  `fields` JSON NOT NULL,
  `template` TEXT NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `erp_doc_helper_templates_type_idx` (`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 已生成文档
CREATE TABLE IF NOT EXISTS `erp_generated_documents` (
  `id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `company_id` VARCHAR(30),
  `template_id` VARCHAR(30) NOT NULL,
  `data` JSON NOT NULL,
  `file_url` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `erp_generated_documents_user_id_idx` (`user_id`),
  INDEX `erp_generated_documents_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
