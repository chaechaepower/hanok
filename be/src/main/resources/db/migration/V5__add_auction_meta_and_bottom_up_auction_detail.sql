-- Auction 엔티티: 경매 종류·시간은 item → auction 으로 이전
-- BottomUpAuctionDetail 엔티티: 하향식 전용 start_price, bid_unit (1:1 auction)

ALTER TABLE `auction`
    ADD COLUMN `auction_type` ENUM ('UNIQUE_TOP', 'BOTTOM_UP') NULL,
    ADD COLUMN `auction_duration` INT NULL;

-- 기존 데이터: item에 남아 있던 값을 auction으로 복사 (V6에서 item 컬럼 DROP 전)
UPDATE `auction` a
    INNER JOIN `item` i ON a.item_id = i.id
SET a.auction_type     = i.auction_type,
    a.auction_duration = i.auction_duration;

-- 매핑 못 한 행 방어 (구 스키마에서 item 경매 필드가 비어 있던 경우)
UPDATE `auction`
SET `auction_type`     = COALESCE(`auction_type`, 'BOTTOM_UP'),
    `auction_duration` = COALESCE(`auction_duration`, 60)
WHERE `auction_type` IS NULL
   OR `auction_duration` IS NULL;

ALTER TABLE `auction`
    MODIFY COLUMN `auction_type` ENUM ('UNIQUE_TOP', 'BOTTOM_UP') NOT NULL;

CREATE TABLE `bottom_up_auction_detail`
(
    `id`          BIGINT NOT NULL AUTO_INCREMENT,
    `start_price` BIGINT NOT NULL,
    `bid_unit`    BIGINT NOT NULL,
    `auction_id`  BIGINT NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_bottom_up_auction_detail_auction_id` (`auction_id`),
    CONSTRAINT `fk_bottom_up_auction_detail_auction`
        FOREIGN KEY (`auction_id`) REFERENCES `auction` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 하향식 경매만 detail 행 생성 (유일가는 unique_bid_auction_detail / V4)
INSERT INTO `bottom_up_auction_detail` (`start_price`, `bid_unit`, `auction_id`)
SELECT i.`start_price`,
       i.`bid_unit`,
       a.`id`
FROM `auction` a
         INNER JOIN `item` i ON a.item_id = i.id
WHERE a.`auction_type` = 'BOTTOM_UP';
