ALTER TABLE `counterdb`.`optintable` 
ADD COLUMN `username` VARCHAR(255) NULL AFTER `userid`;

ALTER TABLE `counterdb`.`messagetable` 
DROP COLUMN `username`;

