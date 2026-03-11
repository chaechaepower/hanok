package com.ssafy.be.domain.follow.service;

import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.follow.exception.FollowErrorCode;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
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
    public FollowResponse toggleFollow(Long loginUserId, Long targetUserId) {
        // 1. 사용자 조회 예외 처리 변경
        User me = userRepository.findById(loginUserId)
                .orElseThrow(() -> new GlobalException(FollowErrorCode.USER_NOT_FOUND));

        // 2. 판매자 조회 예외 처리 변경
        Seller targetSeller = sellerRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new GlobalException(FollowErrorCode.SELLER_NOT_FOUND));

        // 3. 자기 자신 팔로우 예외 처리 변경
        if (me.getId().equals(targetUserId)) {
            throw new GlobalException(FollowErrorCode.SELF_FOLLOW_NOT_ALLOWED);
        }

        boolean isFollowing = handleToggle(me, targetSeller);

        return convertToFollowResponse(me, targetSeller, isFollowing);
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
}