-- DropForeignKey
ALTER TABLE `AccountMilestone` DROP FOREIGN KEY `AccountMilestone_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Deck` DROP FOREIGN KEY `Deck_userId_fkey`;

-- DropForeignKey
ALTER TABLE `RefreshToken` DROP FOREIGN KEY `RefreshToken_userId_fkey`;

-- DropIndex
DROP INDEX `Deck_userId_fkey` ON `Deck`;

-- AddForeignKey
ALTER TABLE `AccountMilestone` ADD CONSTRAINT `AccountMilestone_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deck` ADD CONSTRAINT `Deck_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
