ALTER TABLE `Job`
  ADD COLUMN `approvalStatus` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  ADD COLUMN `approvedAt` DATETIME(3) NULL,
  ADD COLUMN `approvedBy` VARCHAR(191) NULL,
  ADD COLUMN `approvalComment` VARCHAR(191) NULL;

-- Backfill currently active jobs as approved by default.
UPDATE `Job`
SET
  `approvalStatus` = 'approved',
  `approvedAt` = COALESCE(`approvedAt`, NOW(3))
WHERE `approvalStatus` <> 'approved' OR `approvedAt` IS NULL;
