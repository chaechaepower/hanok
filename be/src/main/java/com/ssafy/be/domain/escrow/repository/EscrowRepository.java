package com.ssafy.be.domain.escrow.repository;

import com.ssafy.be.domain.escrow.entity.Escrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow,Long> {
}
