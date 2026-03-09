-- AlterTable
ALTER TABLE `Profile`
  ADD COLUMN `backlogs` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `yearOfPassing` INTEGER NULL,
  ADD COLUMN `universityRollNo` VARCHAR(191) NULL,
  ADD COLUMN `currentSemester` INTEGER NULL,
  ADD COLUMN `technicalSkills` VARCHAR(191) NULL,
  ADD COLUMN `softSkills` VARCHAR(191) NULL,
  ADD COLUMN `certifications` VARCHAR(191) NULL,
  ADD COLUMN `internshipExperience` VARCHAR(191) NULL,
  ADD COLUMN `resumeHeadline` VARCHAR(191) NULL,
  ADD COLUMN `githubUrl` VARCHAR(191) NULL,
  ADD COLUMN `codingProfileUrl` VARCHAR(191) NULL,
  ADD COLUMN `preferredLocation` VARCHAR(191) NULL,
  ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'Pending',
  ADD COLUMN `verificationComment` VARCHAR(191) NULL,
  ADD COLUMN `verificationRequestedAt` DATETIME(3) NULL,
  ADD COLUMN `verifiedAt` DATETIME(3) NULL,
  ADD COLUMN `verifiedBy` VARCHAR(191) NULL;
