-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS unique_bid_auction;

-- 2. 새 테이블 생성 (UniqueBidAuctionDetail 엔티티 기반)
CREATE TABLE unique_bid_auction_detail (
                                           id         BIGINT       NOT NULL AUTO_INCREMENT,
                                           auction_id BIGINT       NOT NULL UNIQUE,
                                           min_price  BIGINT       NOT NULL,
                                           max_price  BIGINT       NOT NULL,
                                           PRIMARY KEY (id),
                                           CONSTRAINT fk_ubad_auction
                                               FOREIGN KEY (auction_id) REFERENCES auction(id)
);
