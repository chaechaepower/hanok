package com.ssafy.be.domain.follow.service;

import com.ssafy.be.domain.follow.dto.response.FollowItemResponse;
import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.dto.response.PageResponse;
import com.ssafy.be.domain.follow.dto.response.SellerSummaryResponse;
import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.follow.exception.FollowErrorCode;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;

    @Transactional
    public FollowResponse toggleFollow(Long loginUserId, Long targetSellerId) {

        User me = userRepository.findById(loginUserId)
                .orElseThrow(() -> new GlobalException(FollowErrorCode.USER_NOT_FOUND));

        Seller targetSeller = sellerRepository.findById(targetSellerId)
                .orElseThrow(() -> new GlobalException(FollowErrorCode.SELLER_NOT_FOUND));

        if (me.getId().equals(targetSeller.getUser().getId())) {
            throw new GlobalException(FollowErrorCode.SELF_FOLLOW_NOT_ALLOWED);
        }

        boolean isFollowing = handleToggle(me, targetSeller);

        return convertToFollowResponse(me, targetSeller, isFollowing);
    }

    public PageResponse<FollowItemResponse> getFollowingList(Long loginUserId, Pageable pageable) {
        User me = userRepository.findById(loginUserId)
                .orElseThrow(() -> new GlobalException(FollowErrorCode.USER_NOT_FOUND));

        Page<Follow> followPage = followRepository.findByUserWithSeller(me, pageable);

        return toPageResponse(followPage.map(this::convertToFollowItemResponse));
    }

    private boolean handleToggle(User user, Seller seller) {
        return followRepository.findByUserAndSeller(user, seller)
                .map(follow -> {
                    followRepository.delete(follow);
                    return false;
                })
                .orElseGet(() -> {
                    followRepository.save(createFollowEntity(user, seller));
                    return true;
                });
    }

    private Follow createFollowEntity(User user, Seller seller) {
        return Follow.builder()
                .user(user)
                .seller(seller)
                .build();
    }

    private FollowResponse convertToFollowResponse(User user, Seller seller, boolean isFollowing) {
        return FollowResponse.builder()
                .following(isFollowing)
                .followerCount(followRepository.countBySeller(seller))
                .followingCount(followRepository.countByUser(user))
                .build();
    }

    private FollowItemResponse convertToFollowItemResponse(Follow follow) {
        Seller seller = follow.getSeller();
        return FollowItemResponse.builder()
                .followId(follow.getId())
                .seller(SellerSummaryResponse.builder()
                        .sellerId(seller.getId())
                        .nickname(seller.getShopName())
                        .profileImageUri(seller.getUser().getProfileImage())
                        .rating(seller.getRating())
                        .build())
                .followedAt(follow.getCreatedAt())
                .build();
    }

    private <T> PageResponse<T> toPageResponse(Page<T> pageResult) {
        return PageResponse.<T>builder()
                .content(pageResult.getContent())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .hasNext(!pageResult.isLast())
                .build();
    }
}
