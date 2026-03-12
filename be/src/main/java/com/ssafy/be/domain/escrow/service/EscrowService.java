package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.ssafy.be.domain.escrow.entity.EscrowStatus.DEPOSITED;

@RequiredArgsConstructor
@Service
public class EscrowService {
    public static final double FEE_RATE = 0.05;
    private final EscrowRepository escrowRepository;
    private final UserRepository userRepository;

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

    private static long calculateFeeAmount(Bid topBid) {
        return (long) (topBid.amount() * FEE_RATE);
    }
}
