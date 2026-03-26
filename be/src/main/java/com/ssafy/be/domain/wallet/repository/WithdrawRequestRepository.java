package com.ssafy.be.domain.wallet.repository;

import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawRequestRepository extends JpaRepository<WithdrawRequest, Long> {
    List<WithdrawRequest> findByWithdrawStatus(WithdrawStatus status);

    long countByUserId(Long userId);

    List<WithdrawRequest> findAllByUserId(Long userId);
}
