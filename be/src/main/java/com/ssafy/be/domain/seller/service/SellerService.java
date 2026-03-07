package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;

    public SellerRegisterResponse register(Long userId, SellerRegisterRequest request) {
        if (sellerRepository.existsByUserId(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        Seller seller = Seller.createSeller(
                request.intro(),
                request.type(),
                request.businessNumber(),
                request.instaUrl(),
                request.youtubeUrl(),
                request.tiktokUrl(),
                userId
        );

        Seller saved = sellerRepository.save(seller);
        return new SellerRegisterResponse(saved.getId(), user.getNickname(), saved.getGrade());
    }
}