package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerGrade;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;

    @Transactional
    public SellerRegisterResponse register(Long userId, SellerRegisterRequest request) {
        if (sellerRepository.existsByUserId(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        Seller seller = Seller.builder()
                .intro(request.intro() != null ? request.intro() : "")
                .type(request.type())
                .businessNumber(request.businessNumber())
                .grade(SellerGrade.GENERAL)
                .rating(0.0)
                .instaUrl(request.instaUrl())
                .youtubeUrl(request.youtubeUrl())
                .tiktokUrl(request.tiktokUrl())
                .userId(userId)
                .build();

        Seller saved = sellerRepository.save(seller);
        return new SellerRegisterResponse(saved.getId(), user.getNickname(), saved.getGrade());
    }
}