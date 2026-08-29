-- AlterTable
ALTER TABLE `Deck` ADD COLUMN `sessionDailyGoal` INTEGER NULL,
    ADD COLUMN `sessionExtendedGoal` INTEGER NULL,
    ADD COLUMN `sessionSnapshotAt` DATETIME(3) NULL;
