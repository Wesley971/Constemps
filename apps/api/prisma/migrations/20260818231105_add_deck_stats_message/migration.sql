-- AlterTable
ALTER TABLE `Deck` ADD COLUMN `statsMessage` TEXT NULL,
    ADD COLUMN `statsMessageAt` DATETIME(3) NULL,
    ADD COLUMN `statsMessageReviewCount` INTEGER NULL;
