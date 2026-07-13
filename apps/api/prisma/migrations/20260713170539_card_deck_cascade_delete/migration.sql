-- DropForeignKey
ALTER TABLE `Card` DROP FOREIGN KEY `Card_deckId_fkey`;

-- DropIndex
DROP INDEX `Card_deckId_fkey` ON `Card`;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_deckId_fkey` FOREIGN KEY (`deckId`) REFERENCES `Deck`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
