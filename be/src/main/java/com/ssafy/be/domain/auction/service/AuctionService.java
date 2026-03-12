package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.AuctionStartRequest;
import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.request.ItemIntroduceRequest;
import com.ssafy.be.domain.auction.dto.response.*;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.exception.AuctionErrorCode;
import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.auction.repository.AuctionBidRepository;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.common.util.TimeUtils;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.ssafy.be.global.websocket.enums.DestType.BROADCAST;
import static com.ssafy.be.global.websocket.enums.DestType.PRIVATE;
import static com.ssafy.be.global.websocket.enums.StreamEventType.*;
import static com.ssafy.be.global.websocket.enums.StreamEventType.AUCTION_STATISTICS;
import static com.ssafy.be.global.websocket.enums.StreamEventType.BID_PLACED;


import static com.ssafy.be.domain.auction.entity.AuctionStatus.*;


@RequiredArgsConstructor
@Service
public class AuctionService {
    private static final long SNIPING_THRESHOLD_SECONDS = 5L;
    private final AuctionBidFacade auctionBidFacade;
    private final AuctionRepository auctionRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final AuctionTimerRepository auctionTimerRepository;
    private final StreamRepository streamRepository;
    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final ShippingAddressRepository shippingAddressRepository;

    @Transactional
    public AuctionStartResponse startAuction(AuctionStartRequest request, Long streamId, Long userId) {
        // 1. 호스트인지 확인
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new StompException(SellerErrorCode.SELLER_NOT_FOUND));

        validateStreamHost(streamId, seller.getId());

        // 2. 모든 클라이언트의 시각을 서버 시각으로 동기화하기 위해 현재 시각 필요
        String serverNow = TimeUtils.nowAsString();

        // 3. 경매 시작
        Auction auction = auctionRepository.findById(request.auctionId())
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        auction.startAuction(serverNow);

        // 4. 레디스에 경매 타이머 정보 저장 - TTL로 타이머 관리(MVP)
        Item auctionItem = auction.getItem();
        auctionTimerRepository.save(auction.getId(), auctionItem.getAuctionDuration());

        // 5. 응답
        return buildAuctionStartResponse(
                buildItemDto(auctionItem),
                buildTimerDto(auctionItem, serverNow)
        );
    }

    @Transactional
    public void introduceItem(ItemIntroduceRequest request, Long streamId, Long userId) {
        // 1. 호스트인지 확인
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new StompException(SellerErrorCode.SELLER_NOT_FOUND));

        validateStreamHost(streamId, seller.getId());

        // 2. 경매 상태 '설명중'으로 변경
        Auction auction = auctionRepository.findById(request.auctionId())
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        auction.introduceAuction();
    }

    @Transactional // TODO: 트랜잭션 범위 줄이기
    public List<StreamPublishTask> placeBid(BidPlaceRequest request, Long streamId, Long userId) {
        Auction auction = auctionRepository.findById(request.auctionId())
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));

        // 1. 현재 진행중인 경매인지 검증
        validateLiveAuction(auction);

        // 2. 판매자 본인 물건 입찰 방지 검증
        validateNotSelfBid(auction, userId);

        // 3. 사용자 잔액 >= 입찰가 검증
        validateSufficientBalance(request.amount(), user);

        // 4. 락 걸어서 입찰가 검증 및 저장
        BidPlaceResponse.BidInfoDto bidInfoDto = auctionBidFacade.processBid(request, auction, user);

        // 5. 스나이핑 방지 - 잔여 시간이 5초 이내면 5초로 연장
        boolean isSniping = preventSniping(auction.getId());

        // 6. 응답
        // 6-1. BID_PLACE로 입찰 정보 브로드캐스트
        StreamPublishTask bidPlacePublishTask = buildStreamPublishTask(
                BROADCAST,
                streamId,
                null,
                BID_PLACED,
                buildBidPlaceResponse(
                        bidInfoDto,
                        isSniping ? buildSnipingTimerDto(TimeUtils.nowAsString()) : null
                )
        );

        // 6-2. AUCTION_STATISTICS로 실시간 통계 정보 브로드캐스트
        List<Bid> bids = auctionBidRepository.findAll(auction.getId());

        List<AuctionStatisticsResponse.RecentBidDto> recentBids = bids.stream()
                .limit(15)
                .map(AuctionService::buildRecentBidDto)
                .toList();

        StreamPublishTask statisticsPublishTask = buildStreamPublishTask(
                BROADCAST,
                streamId,
                null,
                AUCTION_STATISTICS,
                buildAuctionStatisticsResponse(
                        auction.getItem().getName(),
                        bids.stream().mapToLong(Bid::amount).sum(),
                        bids.size(),
                        auction.getItem().getStartPrice(),
                        bids.isEmpty() ? auction.getItem().getStartPrice() : bids.getFirst().amount(),
                        recentBids
                ));

        return List.of(bidPlacePublishTask, statisticsPublishTask);
    }

    @Transactional
    public List<StreamPublishTask> endAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        Bid topBid = auctionBidRepository.findTopBid(auctionId).orElse(null);

        // AUCTION_END로 경매 종료 broadcast
        StreamPublishTask endPublishTask = buildStreamPublishTask(
                BROADCAST,
                auction.getStream().getId(),
                null,
                AUCTION_END,
                null
        );

        // 유찰
        if (topBid == null) {
            auction.unsold();
            return List.of(endPublishTask);
        }

        // 낙찰
        auction.sold(topBid.amount());

        ShippingAddress shippingAddress = shippingAddressRepository.findByUserIdAndIsDefaultTrue(topBid.userId())
                .orElseThrow(() -> new StompException(ShippingAddressErrorCode.DEFAULT_SHIPPING_ADDRESS_NOT_FOUND));

        // BID_WINNER로 낙찰 정보 private
        BidWinnerResponse payload = buildBidWinnerResponse(
                buildItemDto(auction.getItem().getName(), topBid.amount()),
                buildShippingDto(shippingAddress)
        );

        StreamPublishTask winnerPublishTask = buildStreamPublishTask(
                PRIVATE,
                auction.getStream().getId(),
                topBid.userId(),
                BID_WINNER,
                payload
        );

        return List.of(endPublishTask, winnerPublishTask);

        // TODO: 중계 메시지 브로드캐스트 추가 예정
    }

    @Transactional(readOnly = true)
    public BidSyncResponse syncBid(Long streamId) {
        // 1. 현재 진행 중인 경매 조회
        Auction auction = auctionRepository.findByStreamIdAndAuctionStatus(streamId, LIVE)
                .orElseThrow(() -> new StompException(AuctionErrorCode.LIVE_AUCTION_NOT_FOUND));

        // 2. 현재 최고가 조회 (없으면 시작가 사용)
        Long currentPrice = auctionBidRepository.findTopBid(auction.getId())
                .map(Bid::amount)
                .orElse(auction.getItem().getStartPrice());

        // 3. 타이머 정보 조회
        String serverNow = TimeUtils.nowAsString();
        long remainingSeconds = auctionTimerRepository.findRemainingSecondsByAuctionId(auction.getId());

        // 4. 응답 생성
        return buildBidSyncResponse(
                buildBidSyncItemInfo(auction.getItem().getBidUnit(), currentPrice),
                buildBidSyncTimerInfo((int) remainingSeconds, serverNow, auction.getStartedAt())
        );
    }

    @Transactional(readOnly = true)
    public ItemSyncResponse syncItem(Long streamId) {
        // 1. 해당 스트림의 모든 경매 아이템 조회
        List<Auction> auctions = auctionRepository.findByStreamId(streamId);

        // 2. 응답 생성
        List<ItemSyncResponse.ItemInfo> items = auctions.stream()
                .map(AuctionService::buildItemSyncInfo)
                .toList();

        return ItemSyncResponse.builder()
                .items(items)
                .build();
    }

    private void validateStreamHost(Long streamId, Long sellerId) {
        boolean isStreamHost = streamRepository.existsByIdAndSellerId(streamId, sellerId);

        if (!isStreamHost) {
            throw new StompException(AuctionErrorCode.AUCTION_UNAUTHORIZED);
        }
    }

    private void validateLiveAuction(Auction auction) {
        if (!auction.isLive()) {
            throw new StompException(AuctionErrorCode.AUCTION_NOT_LIVE);
        }
    }

    private void validateNotSelfBid(Auction auction, Long userId) {
        if (auction.isSeller(userId)) {
            throw new StompException(AuctionErrorCode.AUCTION_SELF_BID_NOT_ALLOWED);
        }
    }

    private void validateSufficientBalance(Long amount, User user) {
        if (!user.hasSufficientBalance(amount)) {
            throw new StompException(AuctionErrorCode.AUCTION_BID_INSUFFICIENT_BALANCE);
        }
    }

    private boolean preventSniping(Long auctionId) {
        long remaining = auctionTimerRepository.findRemainingSecondsByAuctionId(auctionId);

        if (remaining > 0 && remaining <= SNIPING_THRESHOLD_SECONDS) {
            auctionTimerRepository.updateExpireByAuctionId(auctionId, SNIPING_THRESHOLD_SECONDS);
            return true;
        }

        return false;
    }

    private static AuctionStartResponse buildAuctionStartResponse(AuctionStartResponse.AuctionStartItemDto itemDto, AuctionStartResponse.AuctionStartTimerDto timerDto) {
        return AuctionStartResponse.builder()
                .item(itemDto)
                .timer(timerDto)
                .build();
    }

    private static AuctionStartResponse.AuctionStartTimerDto buildTimerDto(Item auctionItem, String serverNow) {
        return AuctionStartResponse.AuctionStartTimerDto.builder()
                .durationSeconds(auctionItem.getAuctionDuration())
                .serverNow(serverNow)
                .serverStartedAt(serverNow) // 경매 시작 시에는 동일(늦참/새로고침 상황에는 다름)
                .build();
    }

    private static AuctionStartResponse.AuctionStartItemDto buildItemDto(Item auctionItem) {
        return AuctionStartResponse.AuctionStartItemDto.builder()
                .name(auctionItem.getName())
                .image(auctionItem.getImage1())
                .condition(auctionItem.getItemCondition())
                .bidUnit(auctionItem.getBidUnit())
                .startPrice(auctionItem.getStartPrice())
                .build();
    }

    private static BidPlaceResponse buildBidPlaceResponse(BidPlaceResponse.BidInfoDto bidInfoDto, BidPlaceResponse.SnipingTimerDto snipingTimerDto) {
        return BidPlaceResponse.builder()
                .bidInfo(bidInfoDto)
                .snipingTimer(snipingTimerDto)
                .build();
    }

    private static BidPlaceResponse.SnipingTimerDto buildSnipingTimerDto(String serverNow) {
        return BidPlaceResponse.SnipingTimerDto.builder()
                .durationSeconds((int) SNIPING_THRESHOLD_SECONDS)
                .serverNow(serverNow)
                .serverStartedAt(serverNow)
                .build();
    }

    private static BidWinnerResponse buildBidWinnerResponse(BidWinnerResponse.ItemDto itemDto, BidWinnerResponse.ShippingDto shippingDto) {
        return BidWinnerResponse.builder()
                .item(itemDto)
                .shipping(shippingDto)
                .build();
    }

    private static BidWinnerResponse.ItemDto buildItemDto(String itemName, Long finalPrice) {
        return BidWinnerResponse.ItemDto.builder()
                .itemName(itemName)
                .finalPrice(finalPrice)
                .build();
    }

    private static BidWinnerResponse.ShippingDto buildShippingDto(ShippingAddress shippingAddress) {
        return BidWinnerResponse.ShippingDto.builder()
                .recipientName(shippingAddress.getRecipientName())
                .addressName(shippingAddress.getAddressName())
                .postalCode(shippingAddress.getPostalCode())
                .address(shippingAddress.getAddress())
                .addressDetail(shippingAddress.getAddressDetail())
                .phone(shippingAddress.getPhone())
                .build();
    }

    private static BidSyncResponse buildBidSyncResponse(BidSyncResponse.ItemInfo itemInfo, BidSyncResponse.TimerInfo timerInfo) {
        return BidSyncResponse.builder()
                .item(itemInfo)
                .timer(timerInfo)
                .build();
    }

    private static BidSyncResponse.ItemInfo buildBidSyncItemInfo(Long bidUnit, Long currentPrice) {
        return BidSyncResponse.ItemInfo.builder()
                .bidUnit(bidUnit)
                .currentPrice(currentPrice)
                .build();
    }

    private static BidSyncResponse.TimerInfo buildBidSyncTimerInfo(Integer durationSeconds, String serverNow, String serverStartedAt) {
        return BidSyncResponse.TimerInfo.builder()
                .durationSeconds(durationSeconds)
                .serverNow(serverNow)
                .serverStartedAt(serverStartedAt)
                .build();
    }

    private static ItemSyncResponse.ItemInfo buildItemSyncInfo(Auction auction) {
        return ItemSyncResponse.ItemInfo.builder()
                .auctionId(auction.getId())
                .itemName(auction.getItem().getName())
                .image(auction.getItem().getImage1())
                .startPrice(auction.getItem().getStartPrice())
                .auctionStatus(auction.getAuctionStatus())
                .finalPrice(auction.getAuctionStatus() == AuctionStatus.SOLD ? auction.getFinalPrice() : null)
                .itemCondition(auction.getItem().getItemCondition())
                .build();
    }


    public <T> StreamPublishTask buildStreamPublishTask(DestType destType, Long streamId, Long userId,StreamEventType eventType, T payload) {
        return StreamPublishTask.builder()
                .destType(destType)
                .streamId(streamId)
                .userId(userId)
                .eventType(eventType)
                .payload(payload)
                .build();
    }

    private static AuctionStatisticsResponse buildAuctionStatisticsResponse(
            String itemName, Long totalPrice, int bidCount, Long startPrice, Long currentPrice,
            List<AuctionStatisticsResponse.RecentBidDto> recentBidDtos) {
        return AuctionStatisticsResponse.builder()
                .itemName(itemName)
                .totalPrice(totalPrice)
                .bidCount(bidCount)
                .startPrice(startPrice)
                .currentPrice(currentPrice)
                .recentBids(recentBidDtos)
                .build();
    }

    private static AuctionStatisticsResponse.RecentBidDto buildRecentBidDto(Bid bid) {
        return new AuctionStatisticsResponse.RecentBidDto(
                bid.nickname(),
                bid.amount(),
                bid.bidAt()
        );
    }
}
