ALTER TABLE `College`
  ADD COLUMN `phone` VARCHAR(191) NULL,
  ADD COLUMN `website` VARCHAR(191) NULL,
  ADD COLUMN `details` VARCHAR(191) NULL,
  ADD COLUMN `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active';

CREATE TABLE `Plan` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `monthlyPriceInr` INTEGER NOT NULL DEFAULT 0,
  `studentLimit` INTEGER NULL,
  `jobLimit` INTEGER NULL,
  `analyticsAccess` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Plan_key_key`(`key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CollegeSubscription` (
  `id` VARCHAR(191) NOT NULL,
  `collegeId` VARCHAR(191) NOT NULL,
  `planId` VARCHAR(191) NOT NULL,
  `status` ENUM('trialing', 'pending', 'active', 'past_due', 'canceled', 'expired') NOT NULL DEFAULT 'trialing',
  `paymentStatus` ENUM('pending', 'paid', 'failed', 'refunded', 'none') NOT NULL DEFAULT 'pending',
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NULL,
  `trialEndsAt` DATETIME(3) NULL,
  `razorpaySubscriptionId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `CollegeSubscription_razorpaySubscriptionId_key`(`razorpaySubscriptionId`),
  INDEX `CollegeSubscription_collegeId_status_idx`(`collegeId`, `status`),
  INDEX `CollegeSubscription_planId_idx`(`planId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CollegePaymentEvent` (
  `id` VARCHAR(191) NOT NULL,
  `collegeSubscriptionId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `providerEventId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `CollegePaymentEvent_providerEventId_key`(`providerEventId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CollegeSubscription`
  ADD CONSTRAINT `CollegeSubscription_collegeId_fkey`
  FOREIGN KEY (`collegeId`) REFERENCES `College`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CollegeSubscription`
  ADD CONSTRAINT `CollegeSubscription_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CollegePaymentEvent`
  ADD CONSTRAINT `CollegePaymentEvent_collegeSubscriptionId_fkey`
  FOREIGN KEY (`collegeSubscriptionId`) REFERENCES `CollegeSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
