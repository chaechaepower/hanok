-- V1__init_schema.sql
-- baseline-on-migrate: true 환경에서는 기존 DB에 실행되지 않고 기록만 됨
-- 새 환경(로컬 초기화, CI 등)에서는 전체 실행됨

CREATE TABLE IF NOT EXISTS user
(
    id                         BIGINT AUTO_INCREMENT PRIMARY KEY,
    email                      VARCHAR(50)  NOT NULL UNIQUE,
    password                   VARCHAR(255) NOT NULL,
    nickname                   VARCHAR(50)  NOT NULL,
    profile_image              VARCHAR(500),
    phone                      VARCHAR(50)  NOT NULL,
    is_active                  BOOLEAN      NOT NULL,
    balance                    BIGINT       NOT NULL,
    deposited_bid_balance      BIGINT       NOT NULL,
    deposited_escrow_balance   BIGINT       NOT NULL,
    deposited_withdraw_balance BIGINT       NOT NULL,
    bank_code                  VARCHAR(50),
    account_name               VARCHAR(50),
    account_num                VARCHAR(100),
    notification_setting       BOOLEAN      NOT NULL,
    created_at                 DATETIME(6)  NOT NULL,
    updated_at                 DATETIME(6)  NOT NULL
    );

CREATE TABLE IF NOT EXISTS chat_message
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    stream_id    BIGINT       NOT NULL,
    user_id      BIGINT       NOT NULL,
    nickname     VARCHAR(255) NOT NULL,
    content      VARCHAR(500) NOT NULL,
    message_type VARCHAR(50)  NOT NULL,
    filtered     BOOLEAN      NOT NULL DEFAULT FALSE
    );

CREATE TABLE IF NOT EXISTS seller
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    intro           VARCHAR(100) NOT NULL,
    penalty_count   INT          NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    business_number VARCHAR(50),
    insta_url       VARCHAR(100),
    youtube_url     VARCHAR(100),
    tiktok_url      VARCHAR(100),
    avg_ship_days   DOUBLE,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    user_id         BIGINT       NOT NULL,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES user (id)
    );

CREATE TABLE IF NOT EXISTS shipping_address
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    address_name   VARCHAR(255),
    postal_code    INT,
    address        VARCHAR(255),
    address_detail VARCHAR(255),
    phone          VARCHAR(255),
    recipient_name VARCHAR(255),
    is_default     BOOLEAN,
    user_id        BIGINT,
    CONSTRAINT fk_shipping_address_user FOREIGN KEY (user_id) REFERENCES user (id)
    );

CREATE TABLE IF NOT EXISTS withdraw_request
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount          BIGINT,
    withdraw_status VARCHAR(50),
    requested_at    DATETIME(6),
    processed_at    DATETIME(6),
    user_id         BIGINT,
    CONSTRAINT fk_withdraw_request_user FOREIGN KEY (user_id) REFERENCES user (id)
    );

CREATE TABLE IF NOT EXISTS item
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255),
    description      TEXT,
    category         VARCHAR(50),
    start_price      BIGINT,
    bid_unit         BIGINT,
    auction_duration INT,
    status           VARCHAR(50),
    item_condition   VARCHAR(50),
    auction_type     VARCHAR(50),
    image1           VARCHAR(500),
    image2           VARCHAR(500),
    image3           VARCHAR(500),
    sold_at          DATETIME(6),
    created_at       DATETIME(6),
    seller_id        BIGINT,
    CONSTRAINT fk_item_seller FOREIGN KEY (seller_id) REFERENCES seller (id)
    );

CREATE TABLE IF NOT EXISTS stream
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255),
    category     VARCHAR(50),
    status       VARCHAR(50),
    thumbnail    VARCHAR(500),
    scheduled_at DATETIME(6),
    start_type   VARCHAR(50),
    notice       TEXT,
    created_at   DATETIME(6),
    started_at   DATETIME(6),
    seller_id    BIGINT,
    CONSTRAINT fk_stream_seller FOREIGN KEY (seller_id) REFERENCES seller (id)
    );

CREATE TABLE IF NOT EXISTS follow
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    seller_id  BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uq_follow UNIQUE (user_id, seller_id),
    CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES user (id),
    CONSTRAINT fk_follow_seller FOREIGN KEY (seller_id) REFERENCES seller (id)
    );

CREATE TABLE IF NOT EXISTS seller_notice
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(100) NOT NULL,
    content    TEXT         NOT NULL,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    seller_id  BIGINT       NOT NULL,
    CONSTRAINT fk_seller_notice_seller FOREIGN KEY (seller_id) REFERENCES seller (id)
    );

CREATE TABLE IF NOT EXISTS tag
(
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(255),
    item_id BIGINT,
    CONSTRAINT fk_tag_item FOREIGN KEY (item_id) REFERENCES item (id)
    );

CREATE TABLE IF NOT EXISTS auction
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    final_price    BIGINT,
    auction_status VARCHAR(50),
    started_at     VARCHAR(255),
    stream_id      BIGINT,
    item_id        BIGINT,
    CONSTRAINT fk_auction_stream FOREIGN KEY (stream_id) REFERENCES stream (id),
    CONSTRAINT fk_auction_item FOREIGN KEY (item_id) REFERENCES item (id)
    );

CREATE TABLE IF NOT EXISTS escrow
(
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    winning_price       BIGINT,
    fee_amount          BIGINT,
    escrow_status       VARCHAR(50),
    courier_name        VARCHAR(255),
    tracking_number     VARCHAR(255),
    submitted_at        DATETIME(6),
    cancel_reason       TEXT,
    created_at          DATETIME(6),
    modified_at         DATETIME(6),
    auction_id          BIGINT,
    user_id             BIGINT,
    seller_id           BIGINT,
    shipping_address_id BIGINT,
    CONSTRAINT fk_escrow_auction FOREIGN KEY (auction_id) REFERENCES auction (id),
    CONSTRAINT fk_escrow_user FOREIGN KEY (user_id) REFERENCES user (id),
    CONSTRAINT fk_escrow_seller FOREIGN KEY (seller_id) REFERENCES seller (id),
    CONSTRAINT fk_escrow_shipping FOREIGN KEY (shipping_address_id) REFERENCES shipping_address (id)
    );

CREATE TABLE IF NOT EXISTS unique_bid_auction
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    min_price  BIGINT,
    max_price  BIGINT,
    status     VARCHAR(50),
    started_at VARCHAR(255),
    auction_id BIGINT UNIQUE,
    CONSTRAINT fk_unique_bid_auction_auction FOREIGN KEY (auction_id) REFERENCES auction (id)
    );

CREATE TABLE IF NOT EXISTS trade_report
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount     BIGINT,
    trade_type VARCHAR(50),
    created_at DATETIME(6),
    user_id    BIGINT,
    escrow_id  BIGINT,
    CONSTRAINT fk_trade_report_user FOREIGN KEY (user_id) REFERENCES user (id),
    CONSTRAINT fk_trade_report_escrow FOREIGN KEY (escrow_id) REFERENCES escrow (id)
    );
