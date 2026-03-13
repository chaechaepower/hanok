package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.escrow.dto.request.EscrowCancelRequest;
import com.ssafy.be.domain.escrow.dto.request.TrackingNumberRegisterRequest;
import com.ssafy.be.domain.escrow.dto.response.EscrowDetailResponse;
import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.be.domain.escrow.entity.EscrowStatus.DEPOSITED;

@RequiredArgsConstructor
@Service
public class EscrowService {
    public static final double FEE_RATE = 0.05;
    private final EscrowRepository escrowRepository;
    private final UserRepository userRepository;

    @Transactional
    public void startEscrow(Bid topBid, Auction auction, ShippingAddress shippingAddress) {
        User buyer = userRepository.findById(topBid.userId())
                .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));

        buyer.depositEscrowBalance(topBid.amount());

        Escrow escrow = Escrow.builder()
                .winningPrice(topBid.amount())
                .feeAmount(calculateFeeAmount(topBid))
                .escrowStatus(DEPOSITED)
                .auction(auction)
                .buyer(buyer)
                .seller(auction.getStream().getSeller())
                .shippingAddress(shippingAddress)
                .build();

        escrowRepository.save(escrow);
    }

    @Transactional
    public void registerTrackingNumber(TrackingNumberRegisterRequest request, Long escrowId, Long userId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // 판매자인지 확인
        validateSeller(escrow, userId);

        // 운송장번호 등로 가능한 에스크로 상태인지 확인
        validateAvailableRegisterTrackingNumber(escrow);

        // 운송장번호 등록
        escrow.registerTrackingNumber(request.carrierName(), request.trackingNumber(), LocalDateTime.now());
    }

    @Transactional
    public void cancelEscrow(EscrowCancelRequest request, Long escrowId, Long userId) {
        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        // 판매자인지 확인
        validateSeller(escrow, userId);

        // 취소 가능한 상태인지 확인
        validateAvailableCancelEscrow(escrow);

        // 취소
        escrow.cancelEscrow(request.cancelReason());
        escrow.getBuyer().cancelDepositedEscrowBalance(escrow.getWinningPrice());
    }

    @Transactional(readOnly = true)
    public List<EscrowListResponse> getAllEscrows(Long userId) {
        return escrowRepository.findAllBySellerUserId(userId).stream()
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

    @Transactional(readOnly = true)
    public EscrowDetailResponse getEscrowDetail(Long escrowId, Long userId) {
        Escrow escrow = escrowRepository.findByIdAndSellerUserId(escrowId, userId)
                .orElseThrow(() -> new GlobalException(EscorwErrorCode.ESCROW_NOT_FOUND));

        EscrowDetailResponse.WinningDto winningInfo = buildWinningInfo(escrow);
        EscrowDetailResponse.ShippingAddressDto shippingAddress = buildShippingAddress(escrow.getShippingAddress());
        EscrowDetailResponse.DeliveryDto delivery = buildDelivery(escrow);

        return buildEscrowDetailResponse(
                winningInfo,
                shippingAddress,
                delivery);
    }

    private static EscrowDetailResponse buildEscrowDetailResponse(EscrowDetailResponse.WinningDto winningInfo, EscrowDetailResponse.ShippingAddressDto shippingAddress, EscrowDetailResponse.DeliveryDto delivery) {
        return EscrowDetailResponse.builder()
                .winningInfo(winningInfo)
                .shippingAddress(shippingAddress)
                .delivery(delivery)
                .build();
    }

    private static long calculateFeeAmount(Bid topBid) {
        return (long) (topBid.amount() * FEE_RATE);
    }

    private void validateSeller(Escrow escrow, Long userId) {
        if (!escrow.isEscrowSeller(userId)) {
            throw new GlobalException(EscorwErrorCode.ESCROW_NOT_SELLER);
        }
    }

    private void validateAvailableRegisterTrackingNumber(Escrow escrow) {
        if (!escrow.isAvailableRegisterTrackingNumber()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }

    private void validateAvailableCancelEscrow(Escrow escrow) {
        if (!escrow.isAvailableCancelEscrow()) {
            throw new GlobalException(EscorwErrorCode.ESCROW_INVALID_STATUS);
        }
    }

    private EscrowDetailResponse.WinningDto buildWinningInfo(Escrow escrow) {
        return EscrowDetailResponse.WinningDto.builder()
                .image(escrow.getAuction().getItem().getImage1())
                .itemName(escrow.getAuction().getItem().getName())
                .finalPrice(escrow.getWinningPrice())
                .sellerName(escrow.getSeller().getUser().getNickname())
                .sellerId(escrow.getSeller().getId())
                .wonAt(escrow.getCreatedAt())
                .build();
    }

    private EscrowDetailResponse.ShippingAddressDto buildShippingAddress(ShippingAddress shippingAddress) {
        return EscrowDetailResponse.ShippingAddressDto.builder()
                .name(shippingAddress.getRecipientName())
                .phone(shippingAddress.getPhone())
                .postalCode(shippingAddress.getPostalCode())
                .address(shippingAddress.getAddress())
                .addressDetail(shippingAddress.getAddressDetail())
                .build();
    }

    private EscrowDetailResponse.DeliveryDto buildDelivery(Escrow escrow) {
        return EscrowDetailResponse.DeliveryDto.builder()
                .courierName(escrow.getCourierName())
                .trackingNumber(escrow.getTrackingNumber())
                .build();
    }
}

