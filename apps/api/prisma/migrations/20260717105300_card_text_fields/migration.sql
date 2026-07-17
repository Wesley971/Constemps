-- AlterTable
ALTER TABLE `Card` MODIFY `front` TEXT NOT NULL,
    MODIFY `back` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `ReviewLog` MODIFY `userAnswer` TEXT NULL;
