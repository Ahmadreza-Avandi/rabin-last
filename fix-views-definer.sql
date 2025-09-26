-- حذف ویوهای موجود
DROP VIEW IF EXISTS `daily_interaction_stats`;
DROP VIEW IF EXISTS `interaction_summary`;
DROP VIEW IF EXISTS `sales_pipeline_report`;
DROP VIEW IF EXISTS `sales_statistics`;
DROP VIEW IF EXISTS `user_interaction_performance`;

-- ایجاد مجدد ویوها بدون DEFINER
CREATE VIEW `daily_interaction_stats` AS 
SELECT 
    cast(`feedback`.`created_at` as date) AS `interaction_date`, 
    'email' AS `type`, 
    'outbound' AS `direction`, 
    'neutral' AS `sentiment`, 
    count(0) AS `interaction_count`, 
    avg(0) AS `avg_duration` 
FROM `feedback` 
WHERE `feedback`.`type` = 'email' 
GROUP BY cast(`feedback`.`created_at` as date)
UNION ALL 
SELECT 
    cast(`activities`.`created_at` as date) AS `interaction_date`,
    'phone' AS `type`,
    'inbound' AS `direction`,
    'positive' AS `sentiment`,
    count(0) AS `interaction_count`,
    avg(30) AS `avg_duration` 
FROM `activities` 
WHERE `activities`.`type` = 'call' 
GROUP BY cast(`activities`.`created_at` as date);

CREATE VIEW `interaction_summary` AS 
SELECT 
    `activities`.`id` AS `id`, 
    `activities`.`customer_id` AS `customer_id`, 
    `activities`.`type` AS `type`, 
    `activities`.`title` AS `subject`, 
    `activities`.`description` AS `description`, 
    'outbound' AS `direction`, 
    `activities`.`created_at` AS `interaction_date`, 
    `activities`.`duration` AS `duration`, 
    `activities`.`outcome` AS `outcome`, 
    'positive' AS `sentiment`, 
    `activities`.`performed_by` AS `user_id` 
FROM `activities`
UNION ALL 
SELECT 
    `feedback`.`id` AS `id`,
    `feedback`.`customer_id` AS `customer_id`,
    `feedback`.`type` AS `type`,
    `feedback`.`title` AS `subject`,
    `feedback`.`comment` AS `description`,
    'inbound' AS `direction`,
    `feedback`.`created_at` AS `interaction_date`,
    0 AS `duration`,
    `feedback`.`status` AS `outcome`,
    `feedback`.`sentiment` AS `sentiment`,
    `feedback`.`assigned_to` AS `user_id` 
FROM `feedback`;

CREATE VIEW `sales_pipeline_report` AS 
SELECT 
    `d`.`id` AS `deal_id`, 
    `d`.`title` AS `deal_title`, 
    `d`.`total_value` AS `deal_value`, 
    `d`.`probability` AS `probability`, 
    `d`.`expected_close_date` AS `expected_close_date`, 
    `d`.`stage_id` AS `stage_id`, 
    `sps`.`name` AS `stage_name`, 
    `sps`.`stage_order` AS `stage_order`, 
    `c`.`name` AS `customer_name`, 
    `u`.`name` AS `assigned_to_name`, 
    `d`.`created_at` AS `created_at` 
FROM (((`deals` `d` 
    LEFT JOIN `sales_pipeline_stages` `sps` ON(`d`.`stage_id` = `sps`.`id`)) 
    LEFT JOIN `customers` `c` ON(`d`.`customer_id` = `c`.`id`)) 
    LEFT JOIN `users` `u` ON(`d`.`assigned_to` = `u`.`id`)) 
WHERE `d`.`stage_id` NOT IN ('stage-006','stage-007');

CREATE VIEW `sales_statistics` AS 
SELECT 
    cast(`sales`.`sale_date` as date) AS `sale_date`, 
    count(0) AS `total_sales`, 
    sum(`sales`.`total_amount`) AS `total_revenue`, 
    avg(`sales`.`total_amount`) AS `avg_sale_value` 
FROM `sales` 
GROUP BY cast(`sales`.`sale_date` as date);

CREATE VIEW `user_interaction_performance` AS 
SELECT 
    `u`.`id` AS `user_id`, 
    `u`.`name` AS `user_name`, 
    `u`.`role` AS `role`, 
    count(`i`.`id`) AS `total_interactions`, 
    count(case when `i`.`sentiment` = 'positive' then 1 end) AS `positive_interactions`, 
    count(case when `i`.`sentiment` = 'negative' then 1 end) AS `negative_interactions`, 
    avg(`i`.`duration`) AS `avg_interaction_duration`, 
    count(case when `i`.`type` = 'phone' then 1 end) AS `phone_interactions`, 
    count(case when `i`.`type` = 'email' then 1 end) AS `email_interactions`, 
    count(case when `i`.`type` = 'chat' then 1 end) AS `chat_interactions` 
FROM (`users` `u` 
    LEFT JOIN `interactions` `i` ON(`u`.`id` = `i`.`performed_by`)) 
WHERE `u`.`role` <> 'ceo' 
GROUP BY `u`.`id`;