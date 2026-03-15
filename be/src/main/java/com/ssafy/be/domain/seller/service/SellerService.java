package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.domain.seller.dto.request.SellerProfileUpdateRequest;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.*;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.response.ScheduledStreamResponse;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ItemRepository itemRepository;
    private final StreamRepository streamRepository;
    private final EscrowRepository escrowRepository;
    private final BiznoClient biznoClient;

    @Value("${bizno.api.key}")
    private String biznoApiKey;

    private final RestClient restClient = RestClient.create();

    @Transactional
    public SellerRegisterResponse register(Long userId, SellerRegisterRequest request) {
        if (sellerRepository.existsByUserId(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 닉네임 업데이트
        if (request.nickname() != null) {
            user.updateProfile(request.nickname(), null);
        }

        // 계좌 정보 업데이트
        if (request.bankCode() != null && request.accountNum() != null && request.accountName() != null) {
            user.updateAccount(request.bankCode(), request.accountName(), request.accountNum());
        }

        Seller seller = Seller.builder()
                .intro(request.intro() != null ? request.intro() : "")
                .type(request.type())
                .businessNumber(request.businessNumber())
                .penaltyCount(0)
                .instaUrl(request.instaUrl())
                .youtubeUrl(request.youtubeUrl())
                .tiktokUrl(request.tiktokUrl())
                .user(user)
                .build();

        Seller saved = sellerRepository.save(seller);
        return new SellerRegisterResponse(saved.getId(), user.getNickname());
    }

    @Transactional(readOnly = true)
    public SellerStatusResponse getSellerStatus(Long userId) {
        return sellerRepository.findByUserId(userId)
                .map(seller -> new SellerStatusResponse(true, seller.getId()))
                .orElse(new SellerStatusResponse(false, null));
    }

    @Transactional(readOnly = true)
    public SellerProfileResponse getProfile(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        User user = seller.getUser();

        long followerCount = followRepository.countBySeller(seller);

        // N+1 개선 - 쿼리 1번으로 해결
        List<RecentSaleResponse> recentSales = itemRepository
                .findTop10SoldItemsWithFinalPrice(sellerId)
                .stream()
                .map(row -> new RecentSaleResponse(
                        ((Item) row[0]).getId(),
                        ((Item) row[0]).getName(),
                        (Long) row[1],
                        ((Item) row[0]).getSoldAt()
                ))
                .toList();

        // 예약된 방송 목록 (최근 10개)
        List<ScheduledStreamResponse> posts = streamRepository
                .findTop10BySellerIdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
                        sellerId, StreamStatus.SCHEDULED, LocalDateTime.now())
                .stream()
                .map(stream -> new ScheduledStreamResponse(
                        stream.getId(),
                        stream.getTitle(),
                        stream.getCategory().name(),
                        stream.getThumbnail(),
                        stream.getScheduledAt(),
                        stream.getStatus()
                ))
                .toList();

        return new SellerProfileResponse(
                seller.getId(),
                user.getNickname(),
                seller.getIntro(),
                user.getProfileImage(),
                seller.getInstaUrl(),
                seller.getYoutubeUrl(),
                seller.getTiktokUrl(),
                new SellerStatsResponse(
                        seller.getRating(),
                        seller.getAvgShipDays(),
                        followerCount
                ),
                recentSales,
                posts
        );
    }

    @Transactional
    public void updateProfile(Long sellerId, Long userId, SellerProfileUpdateRequest request) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        // 본인 확인
        if (!seller.getUser().getId().equals(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_FORBIDDEN);
        }

        seller.updateProfile(request.intro(), request.instaUrl(), request.youtubeUrl(), request.tiktokUrl());
        seller.getUser().updateProfile(request.nickname(), request.profileImage());
    }

    public BiznoVerifyResponse verifyBizno(String bizno, int gb) {
        BiznoApiResponse response = biznoClient.verify(bizno, gb);

        if (response == null || response.resultCode() != 0 || response.totalCount() == 0) {
            return new BiznoVerifyResponse(false);
        }

        boolean valid = response.items().stream()
                .findFirst()
                .map(item -> item.bstt() != null && item.bstt().contains("계속사업자"))
                .orElse(false);

        return new BiznoVerifyResponse(valid);
    }

    public List<EscrowListResponse> getAllSoldAuctions(Long sellerId) {
        return escrowRepository.findBySellerId(sellerId).stream()
                .map(escrow -> {
                    Item item = escrow.getAuction().getItem();

                    return EscrowListResponse.builder()
                            .escrowId(escrow.getId())
                            .image(item.getImage1())
                            .itemName(item.getName())
                            .amount(escrow.getWinningPrice())
                            .escrowStatus(escrow.getEscrowStatus())
                            .createdAt(escrow.getCreatedAt())
                            .build();
                }).toList();
    }
}