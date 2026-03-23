ALTER TABLE escrow
    ADD COLUMN tx_hash   VARCHAR(100) NULL    COMMENT '블록체인 트랜잭션 해시',
    ADD COLUMN tx_status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING' COMMENT 'NFT 민팅 상태';
    ADD COLUMN minted_at DATETIME      NULL     COMMENT 'NFT 민팅 완료 시각';