package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.AuctionStartRequest;
import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.response.AuctionEndResponse;
import com.ssafy.be.domain.auction.dto.response.AuctionStartResponse;
import com.ssafy.be.domain.auction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.auction.entity.Auction;
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
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


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
        return buildAuctionStartResponse(buildItemDto(auctionItem), buildTimerDto(auctionItem, serverNow));
    }

    @Transactional // TODO: 트랜잭션 범위 줄이기
    public BidPlaceResponse placeBid(BidPlaceRequest request, Long streamId, Long userId) {
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

        // 5. 스나이핑 방지 - 잔여 시간이 5초 이내면 5초로 연장 TODO: 시간 얼마로 할지 얘기 필요
        boolean isSniping = preventSniping(auction.getId());

        // 6. 응답
        return buildBidPlaceResponse(
                bidInfoDto,
                isSniping ? buildSnipingTimerDto(TimeUtils.nowAsString()) : null
        );
    }

    @Transactional
    public AuctionEndResponse endAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        Bid topBid = auctionBidRepository.findTopBid(auctionId).orElse(null);

        // 유찰
        if (topBid == null) {
            auction.unsold();
            return null;
        }

        // 낙찰
        auction.sold(topBid.amount());

        ShippingAddress shippingAddress = shippingAddressRepository.findByUserIdAndIsDefaultTrue(topBid.userId())
                .orElseThrow(() -> new StompException(ShippingAddressErrorCode.DEFAULT_SHIPPING_ADDRESS_NOT_FOUND));

        return buildAuctionEndResponse(
                topBid.userId(),
                auction.getStream().getId(),
                buildWinnerDto(
                        buildItemDto(auction.getItem().getName(), topBid.amount()),
                        buildShippingDto(shippingAddress)
                )
        );

        // TODO: 중계 메시지 브로드캐스트 추가 예정
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

    private static AuctionEndResponse buildAuctionEndResponse(Long winnerId, Long streamId, AuctionEndResponse.WinnerDto winnerDto) {
        return AuctionEndResponse.builder()
                .winnerId(winnerId)
                .streamId(streamId)
                .winnerDto(winnerDto)
                .build();
    }

    private static AuctionEndResponse.WinnerDto buildWinnerDto(AuctionEndResponse.WinnerDto.ItemDto itemDto, AuctionEndResponse.WinnerDto.ShippingDto shippingDto) {
        return AuctionEndResponse.WinnerDto.builder()
                .item(itemDto)
                .shipping(shippingDto)
                .build();
    }

    private static AuctionEndResponse.WinnerDto.ItemDto buildItemDto(String itemName, Long finalPrice) {
        return AuctionEndResponse.WinnerDto.ItemDto.builder()
                .itemName(itemName)
                .finalPrice(finalPrice)
                .build();
    }

    private static AuctionEndResponse.WinnerDto.ShippingDto buildShippingDto(ShippingAddress shippingAddress) {
        return AuctionEndResponse.WinnerDto.ShippingDto.builder()
                .recipientName(shippingAddress.getRecipientName())
                .phone(shippingAddress.getPhone())
                .address(shippingAddress.getAddress())
                .addressDetail(shippingAddress.getAddressDetail())
                .build();
    }
}
