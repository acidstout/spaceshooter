--DROP SCHEMA IF EXISTS `overkill`;
CREATE SCHEMA IF NOT EXISTS `overkill` DEFAULT CHARACTER SET utf8mb4;

--DROP TABLE IF EXISTS `overkill`.`highscores`;
CREATE TABLE IF NOT EXISTS `overkill`.`highscores` (
			`id` INT NOT NULL AUTO_INCREMENT,
			`player` LONGTEXT,
			`score` BIGINT(1) UNSIGNED ZEROFILL,
			PRIMARY KEY (`id`),
			UNIQUE INDEX `id_UNIQUE` (`id` ASC));
