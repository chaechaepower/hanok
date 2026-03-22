-- Item 엔티티에서 경매 메타 제거 (이미 auction / detail 로 이전됨 — V5)
ALTER TABLE `item`
    DROP COLUMN `start_price`,
    DROP COLUMN `bid_unit`,
    DROP COLUMN `auction_duration`,
    DROP COLUMN `auction_type`;
