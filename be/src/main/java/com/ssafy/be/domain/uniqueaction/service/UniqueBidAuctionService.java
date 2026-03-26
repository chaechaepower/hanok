    package com.ssafy.be.domain.uniqueaction.service;

    import com.ssafy.be.domain.auction.dto.response.AuctionCommentResponse;
    import com.ssafy.be.domain.auction.dto.response.BidWinnerResponse;
    import com.ssafy.be.domain.auction.entity.Auction;
    import com.ssafy.be.domain.auction.entity.AuctionStatus;
    import com.ssafy.be.domain.bottomupauction.model.Bid;
    import com.ssafy.be.domain.escrow.service.EscrowService;
    import com.ssafy.be.domain.item.entity.AuctionType;
    import com.ssafy.be.domain.uniqueaction.dto.response.UniqueAuctionResultResponse;
    import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidItemSyncResponse;
    import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuctionDetail;
    import com.ssafy.be.domain.auction.repository.AuctionRepository;
    import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
    import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
    import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
    import com.ssafy.be.domain.uniqueaction.dto.model.DuplicatePriceInfo;
    import com.ssafy.be.domain.uniqueaction.dto.model.UniqueAuctionResult;
    import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
    import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
    import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
    import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidStartResponse;
    import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidSyncResponse;
    import com.ssafy.be.domain.uniqueaction.exception.UniqueBidAuctionErrorCode;
    import com.ssafy.be.domain.uniqueaction.repository.UniqueBidRepository;
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

    import java.time.LocalDateTime;
    import java.util.ArrayList;
    import java.util.List;
    import java.util.Map;
    import java.util.Objects;
    import java.util.Optional;
    import java.util.stream.Stream;

    import static com.ssafy.be.domain.auction.enums.Comment.AUCTION_START;
    import static com.ssafy.be.domain.auction.enums.Comment.UNSOLD;
    import static com.ssafy.be.domain.item.entity.ItemStatus.SOLD;
    import static com.ssafy.be.global.websocket.enums.DestType.BROADCAST;
    import static com.ssafy.be.global.websocket.enums.DestType.PRIVATE;
    import static com.ssafy.be.global.websocket.enums.StreamEventType.*;

    @Service
    @RequiredArgsConstructor
    public class UniqueBidAuctionService {

        private final AuctionRepository auctionRepository;
        private final UniqueBidRepository uniqueBidRepository;
        private final UserRepository userRepository;
        private final ShippingAddressRepository shippingAddressRepository;
        private final EscrowService escrowService;

        @Transactional
        public List<StreamPublishTask> startAuction(Long streamId, UniqueBidStartRequest request, Long userId) {
            Auction auction = findAuctionById(request.auctionId());

            if (!auction.isSeller(userId))
                throw new StompException(UniqueBidAuctionErrorCode.UNAUTHORIZED);

            String serverNow = TimeUtils.nowAsString();
            auction.startAuction(serverNow);

            UniqueBidAuctionDetail detail = auction.getUniqueBidAuctionDetail();

            StreamPublishTask uniqueAuctionStartPublishTask = buildStreamPublishTask(
                    BROADCAST,
                    streamId,
                    null,
                    UNIQUE_AUCTION_START,
                    buildStartResponse(auction, detail, serverNow)
            );

            StreamPublishTask auctionCommentPublishTask = buildStreamPublishTask(
                    BROADCAST,
                    streamId,
                    null,
                    AUCTION_COMMENT,
                    buildAuctionCommentResponse(AUCTION_START.getValue())
            );

            return List.of(uniqueAuctionStartPublishTask, auctionCommentPublishTask);
        }

        @Transactional
        public long placeBid(UniqueBidPlaceRequest request, Long userId) {
            Auction auction = findAuctionById(request.auctionId());

            if (!auction.isLive())
                throw new StompException(UniqueBidAuctionErrorCode.NOT_LIVE);

            if (auction.isSeller(userId))
                throw new StompException(UniqueBidAuctionErrorCode.SELF_BID);

            UniqueBidAuctionDetail detail = auction.getUniqueBidAuctionDetail();

            if (!detail.isValidBidAmount(request.amount()))
                throw new StompException(UniqueBidAuctionErrorCode.INVALID_AMOUNT);

            // HSETNX
            boolean placed = uniqueBidRepository.placeBid(
                    auction.getId(), userId, request.amount()
            );

            // 1회 비드 검사
            if (!placed)
                throw new StompException(UniqueBidAuctionErrorCode.ALREADY_BID);

            // 잔액 즉시 차감
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));
            user.depositBidBalance(request.amount());

            return uniqueBidRepository.countParticipants(auction.getId());
        }

        @Transactional
        public List<StreamPublishTask> aggregate(UniqueBidCalculateRequest request) {

            Long auctionId = request.auctionId();
            // 🔒 비관적 락으로 조회: 동시 aggregate() 중복 호출 시 race condition 방지
            Auction auction = auctionRepository.findByIdWithLock(auctionId)
                    .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_FOUND));
            Long streamId = auction.getStream().getId();

            if (!auction.isLive())
                throw new StompException(UniqueBidAuctionErrorCode.INVALID_STATUS);

            // LIVE → CALCULATING : placeBid 방지 락
            auction.startCalculating();

            // 유일 최고가
            Optional<Long> winnerPrice = uniqueBidRepository.findHighestUniqueBid(auctionId);

            List<DuplicatePriceInfo> topDuplicates = uniqueBidRepository.findTopPriceDuplicate(auctionId, 3);

            // 입찰 데이터 선조회 (환불 + private 알림 발송에 재사용, deleteAll은 트랜잭션 커밋 후 핸들러에서 호출)
            Map<Object, Object> allBids = uniqueBidRepository.getAllBids(auctionId);

            List<StreamPublishTask> publishTasks = new ArrayList<>();

            // 유찰: winnerPrice=null로 각 입찰자에게 private 전송
            if (winnerPrice.isEmpty()) {
                auction.unsold();
                refundAll(auctionId);
                UniqueAuctionResult result = buildUnsoldResult(topDuplicates);

                for (Map.Entry<Object, Object> entry : allBids.entrySet()) {
                    Long bidUserId = Long.parseLong(entry.getKey().toString());
                    Long bidAmount = Long.parseLong(entry.getValue().toString());
                    publishTasks.add(buildStreamPublishTask(PRIVATE, streamId, bidUserId, UNIQUE_AUCTION_END,
                            buildResultResponse(result, bidAmount)));
                }

                publishTasks.add(buildStreamPublishTask(BROADCAST, streamId, null, AUCTION_COMMENT,
                        buildAuctionCommentResponse(UNSOLD.getValue())));
                return publishTasks;
            }

            // 낙찰
            Long winnerId = uniqueBidRepository
                    .findUserIdByAmount(auctionId, winnerPrice.get())
                    .orElseThrow();
            auction.sold(winnerPrice.get());
            auction.getItem().sold(LocalDateTime.now());

            User winner = userRepository.findById(winnerId)
                    .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));

            Bid topBid = Bid.builder().userId(winner.getId()).amount(winnerPrice.get()).nickname(winner.getNickname()).build();

            ShippingAddress shipping = shippingAddressRepository
                    .findByUserIdAndIsDefaultTrue(winnerId)
                    .orElseThrow(() -> new StompException(
                            ShippingAddressErrorCode.DEFAULT_SHIPPING_ADDRESS_NOT_FOUND));

            escrowService.startEscrow(topBid, auction, shipping);
            refundAllExcept(auctionId, winnerId);

            UniqueAuctionResult result = buildWonResult(winnerId, winnerPrice.get(), topDuplicates, shipping);

            // 각 입찰자에게 private로 결과 전송 (myBidPrice 포함)
            // 프론트엔드: winnerPrice == myBidPrice → 내가 낙찰, 아니면 경매 낙찰·나는 유찰
            for (Map.Entry<Object, Object> entry : allBids.entrySet()) {
                Long bidUserId = Long.parseLong(entry.getKey().toString());
                Long bidAmount = Long.parseLong(entry.getValue().toString());
                publishTasks.add(buildStreamPublishTask(PRIVATE, streamId, bidUserId, UNIQUE_AUCTION_END,
                        buildResultResponse(result, bidAmount)));
            }

            // 낙찰자에게 배송지 포함 상세 정보
            publishTasks.add(buildStreamPublishTask(PRIVATE, streamId, winnerId, BID_WINNER, buildWinnerResponse(result)));

            // 전체 경매 중계 메시지
            String message = String.format(SOLD.getValue(), winner.getNickname(), winnerPrice.get());
            publishTasks.add(buildStreamPublishTask(BROADCAST, streamId, null, AUCTION_COMMENT,
                    buildAuctionCommentResponse(message)));
            return publishTasks;
        }

        @Transactional(readOnly = true)
        public UniqueBidSyncResponse syncAuction(Long streamId, Long userId) {
            Auction auction = auctionRepository
                    .findByStreamIdAndAuctionStatus(streamId, AuctionStatus.LIVE)
                    .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_LIVE));

            return buildSyncResponse(auction, auction.getUniqueBidAuctionDetail(), userId);
        }


        public Long getStreamIdByAuctionId(Long auctionId) {
            return findAuctionById(auctionId).getStream().getId();
        }

        // 유찰되어 전부 환불
        private void refundAll(Long auctionId) {
            uniqueBidRepository.getAllBids(auctionId).forEach((uid, amt) -> {
                User user = userRepository.findById(Long.parseLong(uid.toString())).orElseThrow();
                user.cancelDepositedBidBalance(Long.parseLong(amt.toString()));
            });
        }

        // 낙찰자 제외 환불
        private void refundAllExcept(Long auctionId, Long winnerId) {
            uniqueBidRepository.getAllBids(auctionId).forEach((uid, amt) -> {
                Long userId = Long.parseLong(uid.toString());
                if (!userId.equals(winnerId)) {
                    User user = userRepository.findById(userId).orElseThrow();
                    user.cancelDepositedBidBalance(Long.parseLong(amt.toString()));
                }
            });
        }

        private Auction findAuctionById(Long auctionId) {
            return auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_FOUND));
        }

        private UniqueAuctionResult buildUnsoldResult(List<DuplicatePriceInfo> topDuplicates) {
            return UniqueAuctionResult.builder()
                    .isWon(false)
                    .topDuplicates(topDuplicates)
                    .build();
        }

        private UniqueAuctionResult buildWonResult(Long winnerId, Long winnerPrice,
                                                   List<DuplicatePriceInfo> topDuplicates,
                                                   ShippingAddress shipping) {
            return UniqueAuctionResult.builder()
                    .isWon(true)
                    .winnerId(winnerId)
                    .winnerPrice(winnerPrice)
                    .topDuplicates(topDuplicates)
                    .shippingAddress(shipping)
                    .build();
        }

        private UniqueBidStartResponse buildStartResponse(Auction auction, UniqueBidAuctionDetail detail, String serverNow) {
            return UniqueBidStartResponse.builder()
                    .bidRange(UniqueBidStartResponse.BidRangeDto.builder()
                            .minPrice(detail.getMinPrice())
                            .maxPrice(detail.getMaxPrice())
                            .build())
                    .timer(UniqueBidStartResponse.TimerDto.builder()
                            .durationSeconds(auction.getAuctionDuration())
                            .serverNow(serverNow)
                            .serverStartedAt(auction.getStartedAt())
                            .build())
                    .build();
        }

        private UniqueBidSyncResponse buildSyncResponse(Auction auction, UniqueBidAuctionDetail detail, Long userId) {
            return UniqueBidSyncResponse.builder()
                    .bidRange(UniqueBidSyncResponse.BidRangeDto.builder()
                            .minPrice(detail.getMinPrice())
                            .maxPrice(detail.getMaxPrice())
                            .build())
                    .timer(UniqueBidSyncResponse.TimerDto.builder()
                            .durationSeconds(auction.getAuctionDuration())
                            .serverNow(TimeUtils.nowAsString())
                            .serverStartedAt(auction.getStartedAt())
                            .build())
                    .participantCount(uniqueBidRepository.countParticipants(auction.getId()))
                    .hasBid(uniqueBidRepository.existsBid(auction.getId(), userId))
                    .build();
        }

        private static AuctionCommentResponse buildAuctionCommentResponse(String message) {
            return AuctionCommentResponse.builder()
                    .message(message)
                    .build();
        }


        @Transactional(readOnly = true)
        public long getParticipantCount(Long auctionId) {
            return uniqueBidRepository.countParticipants(auctionId);
        }

        // 트랜잭션 커밋 이후 핸들러에서 호출 (race condition 방지)
        public void deleteAllBids(Long auctionId) {
            uniqueBidRepository.deleteAll(auctionId);
        }

        public <T> StreamPublishTask buildStreamPublishTask(DestType destType, Long streamId, Long userId, StreamEventType eventType, T payload) {
            return StreamPublishTask.builder()
                    .destType(destType)
                    .streamId(streamId)
                    .userId(userId)
                    .eventType(eventType)
                    .payload(payload)
                    .build();
        }

        private UniqueBidItemSyncResponse.ItemInfo buildItemSyncInfo(Auction auction) {

            UniqueBidAuctionDetail detail = auction.getUniqueBidAuctionDetail();
            // 이미지 중 Null 제외 처리
            List<String> images = Stream.of(
                            auction.getItem().getImage1(),
                            auction.getItem().getImage2(),
                            auction.getItem().getImage3())
                    .filter(Objects::nonNull)
                    .toList();
            return UniqueBidItemSyncResponse.ItemInfo.builder()
                    .auctionId(auction.getId())
                    .itemName(auction.getItem().getName())
                    .description(auction.getItem().getDescription())
                    .images(images)
                    .minPrice(detail != null ? detail.getMinPrice() : null)
                    .maxPrice(detail != null ? detail.getMaxPrice() : null)
                    .auctionType(auction.getAuctionType())
                    .auctionTime(auction.getAuctionDuration())
                    .auctionStatus(auction.getAuctionStatus())
                    .finalPrice(auction.getFinalPrice())
                    .itemCondition(auction.getItem().getItemCondition())
                    .build();
        }

        private UniqueAuctionResultResponse buildResultResponse(UniqueAuctionResult result, Long myBidPrice) {
            return UniqueAuctionResultResponse.builder()
                    .isWon(result.isWon())
                    .winnerPrice(result.isWon() ? result.winnerPrice() : null)
                    .myBidPrice(myBidPrice) // 추가됨
                    .topDuplicates(result.topDuplicates())
                    .build();
        }

        private BidWinnerResponse buildWinnerResponse(UniqueAuctionResult result) {
            ShippingAddress s = result.shippingAddress();
            return BidWinnerResponse.builder()
                    .item(BidWinnerResponse.ItemDto.builder()
                            .itemName("유일가 경매 낙찰")
                            .finalPrice(result.winnerPrice())
                            .myBidPrice(result.winnerPrice()) // 추가됨
                            .build())
                    .shipping(BidWinnerResponse.ShippingDto.builder()
                            .recipientName(s.getRecipientName())
                            .addressName(s.getAddressName())
                            .postalCode(s.getPostalCode())
                            .address(s.getAddress())
                            .addressDetail(s.getAddressDetail())
                            .phone(s.getPhone())
                            .build())
                    .build();
        }


    }