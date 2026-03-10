package com.ssafy.be.auction;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.exception.AuctionErrorCode;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.global.common.util.TimeUtils;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class AuctionService {
    private final AuctionRepository auctionRepository;
    private final AuctionTimerRepository auctionTimerRepository;
    private final StreamRepository streamRepository;
    private final SellerRepository sellerRepository;

    @Transactional
    public AuctionStartResponse startAuction(AuctionStartRequest request, Long streamId, Long userId) {
        // 1. 호스트인지 확인
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        validateStreamHost(streamId, seller.getId());

        // 2. 모든 클라이언트의 시각을 서버 시각으로 동기화하기 위해 현재 시각 필요
        String serverNow = TimeUtils.format(TimeUtils.now());

        // 3. 경매 시작
        Auction auction = auctionRepository.findById(request.auctionId())
                .orElseThrow(() -> new GlobalException(AuctionErrorCode.AUCTION_NOT_FOUND));

        auction.startAuction(serverNow);

        // 4. 레디스에 경매 타이머 정보 저장 - TTL로 타이머 관리(MVP)
        Item auctionItem = auction.getItem();
        auctionTimerRepository.save(auction.getId(), auctionItem.getAuctionDuration());

        // 5. 응답
        AuctionStartResponse.AuctionStartItemDto itemDto = buildItemDto(auctionItem);
        AuctionStartResponse.AuctionStartTimerDto timerDto = buildTimerDto(auctionItem, serverNow);
        return buildAuctionStartResponse(itemDto, timerDto);
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

//    public void endAuction(Long auction) {
//        // a. 유찰인 경우
//
//        // a-1. 경매 상태 유찰로 변경
//
//        // a-2. redis 관련 값 삭제
//
//        // a-3. 유찰이라고 broadcast
//
//
//        // b. 낙찰인 경우
//
//        // b-1. 경매 상태 낙찰로 변경, finalPrice 기록
//
//        // b-2. 낙찰자에게 private 메시지 전송 (낙찰 거래 확인 api)
//
//        // b-3. 낙찰 정보 전체 broadcast
//
//        // b-4. redis 관련 값 삭제
//    }

    private void validateStreamHost(Long streamId, Long sellerId) {
        boolean isStreamHost = streamRepository.existsByIdAndSellerId(streamId, sellerId);

        if (!isStreamHost) {
            throw new GlobalException(AuctionErrorCode.AUCTION_UNAUTHORIZED);
        }
    }
}
