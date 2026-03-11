package com.ssafy.be.domain.follow.service;


import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;

    @Transactional
    public FollowResponse toggleFollow(Long loginUserId, Long targetUserId) {
        User me = userRepository.findById(loginUserId)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다."));

        Seller targetSeller = sellerRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("팔로우 대상이 판매자가 아닙니다."));

        if (me.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신은 팔로우할 수 없습니다.");
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