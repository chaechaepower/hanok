-- User 엔티티 JPA @Version (낙관적 락). 기존 행은 0으로 시작.
ALTER TABLE `user`
    ADD COLUMN `version` BIGINT NOT NULL DEFAULT 0 COMMENT 'JPA @Version';
