-- AlterTable
ALTER TABLE `User` ADD COLUMN `dashboardMessage` TEXT NULL,
    ADD COLUMN `dashboardMessageAt` DATETIME(3) NULL,
    ADD COLUMN `dashboardMessageReviewCount` INTEGER NULL;

-- CreateTable
CREATE TABLE `AccountMilestone` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `threshold` INTEGER NOT NULL,
    `reachedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AccountMilestone_userId_threshold_key`(`userId`, `threshold`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccountMilestone` ADD CONSTRAINT `AccountMilestone_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
