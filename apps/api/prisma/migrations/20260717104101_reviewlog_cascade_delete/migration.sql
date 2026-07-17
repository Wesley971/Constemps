-- DropForeignKey
ALTER TABLE `ReviewLog` DROP FOREIGN KEY `ReviewLog_cardId_fkey`;

-- DropIndex
DROP INDEX `ReviewLog_cardId_fkey` ON `ReviewLog`;

-- AddForeignKey
ALTER TABLE `ReviewLog` ADD CONSTRAINT `ReviewLog_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
