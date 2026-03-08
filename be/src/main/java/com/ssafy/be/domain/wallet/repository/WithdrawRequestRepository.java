package com.ssafy.be.domain.wallet.repository;

import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WithdrawRequestRepository extends JpaRepository<WithdrawRequest, Long> {
}
