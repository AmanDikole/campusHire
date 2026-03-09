-- AlterTable
ALTER TABLE `User`
  ADD COLUMN `companyName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Job`
  ADD COLUMN `postedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Job`
  ADD CONSTRAINT `Job_postedById_fkey` FOREIGN KEY (`postedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
