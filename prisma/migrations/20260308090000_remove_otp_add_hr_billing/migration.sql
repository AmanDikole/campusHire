-- Drop OTP-related columns and add HR billing fields.
ALTER TABLE `User`
  DROP COLUMN `emailVerified`,
  DROP COLUMN `otpCode`,
  DROP COLUMN `otpExpiresAt`,
  ADD COLUMN `planStatus` ENUM('trialing', 'active', 'past_due', 'expired', 'canceled') NULL,
  ADD COLUMN `planStartedAt` DATETIME(3) NULL,
  ADD COLUMN `trialEndsAt` DATETIME(3) NULL,
  ADD COLUMN `currentPeriodStart` DATETIME(3) NULL,
  ADD COLUMN `currentPeriodEnd` DATETIME(3) NULL,
  ADD COLUMN `razorpayCustomerId` VARCHAR(191) NULL,
  ADD COLUMN `razorpaySubscriptionId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_razorpaySubscriptionId_key` ON `User`(`razorpaySubscriptionId`);

CREATE TABLE `PaymentEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerEventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentEvent_providerEventId_key`(`providerEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PaymentEvent`
  ADD CONSTRAINT `PaymentEvent_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing HR users get a 7-day trial from migration run date.
UPDATE `User`
SET
  `planStatus` = 'trialing',
  `planStartedAt` = NOW(3),
  `trialEndsAt` = DATE_ADD(NOW(3), INTERVAL 7 DAY),
  `currentPeriodStart` = NOW(3),
  `currentPeriodEnd` = DATE_ADD(NOW(3), INTERVAL 7 DAY)
WHERE `role` = 'hr';
