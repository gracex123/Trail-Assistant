-- CreateTable
CREATE TABLE `TrailItem` (
    `id` VARCHAR(255) NOT NULL,
    `region` VARCHAR(255) NOT NULL,
    `trailTitle` VARCHAR(255) NOT NULL,
    `difficulty` VARCHAR(255) NOT NULL,
    `time` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `tripTime` DOUBLE NOT NULL,
    `elevationGain` DOUBLE NOT NULL,
    `season` VARCHAR(255) NOT NULL,
    `camping` BOOLEAN NOT NULL,
    `publicTransit` BOOLEAN NOT NULL,
    `dogFriendly` BOOLEAN NOT NULL,

    UNIQUE INDEX `TrailItem_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trailId` VARCHAR(191) NOT NULL,
    `authorId` INTEGER NOT NULL,
    `memo` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `auth0Id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_auth0Id_key`(`auth0Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WishItem` ADD CONSTRAINT `WishItem_trailId_fkey` FOREIGN KEY (`trailId`) REFERENCES `TrailItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishItem` ADD CONSTRAINT `WishItem_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
