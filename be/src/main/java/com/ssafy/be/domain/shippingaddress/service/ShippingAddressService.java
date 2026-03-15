package com.ssafy.be.domain.shippingaddress.service;

import com.ssafy.be.domain.shippingaddress.dto.request.ShippingAddressRequest;
import com.ssafy.be.domain.shippingaddress.dto.response.ShippingAddressResponse;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShippingAddressService {

    private final ShippingAddressRepository shippingAddressRepository;
    private final UserRepository userRepository;

    @Transactional
    public ShippingAddressResponse addAddress(Long userId, ShippingAddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 기본 배송지로 설정하는 경우 기존 기본 배송지 해제
        if (request.isDefault()) {
            shippingAddressRepository.findByUserIdAndIsDefaultTrue(userId)
                    .ifPresent(ShippingAddress::unsetDefault);
        }

        ShippingAddress saved = shippingAddressRepository.save(ShippingAddress.builder()
                .addressName(request.addressName())
                .postalCode(request.postalCode())
                .address(request.address())
                .addressDetail(request.addressDetail())
                .phone(request.phone())
                .recipientName(request.recipientName())
                .isDefault(request.isDefault())
                .user(user)
                .build());

        return ShippingAddressResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ShippingAddressResponse> getAddresses(Long userId) {
        return shippingAddressRepository.findAllByUserId(userId).stream()
                .map(ShippingAddressResponse::from)
                .toList();
    }

    @Transactional
    public ShippingAddressResponse updateAddress(Long userId, Long addressId, ShippingAddressRequest request) {
        ShippingAddress address = shippingAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new GlobalException(ShippingAddressErrorCode.ADDRESS_NOT_FOUND));

        // 기본 배송지로 변경하는 경우 기존 기본 배송지 해제
        if (request.isDefault()) {
            shippingAddressRepository.findByUserIdAndIsDefaultTrue(userId)
                    .ifPresent(ShippingAddress::unsetDefault);
        }

        address.update(request.addressName(), request.postalCode(), request.address(),
                request.addressDetail(), request.phone(), request.recipientName(), request.isDefault());

        return ShippingAddressResponse.from(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        ShippingAddress address = shippingAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new GlobalException(ShippingAddressErrorCode.ADDRESS_NOT_FOUND));

        shippingAddressRepository.delete(address);
    }
}