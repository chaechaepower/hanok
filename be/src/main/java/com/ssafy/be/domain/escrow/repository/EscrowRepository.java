package com.ssafy.be.domain.escrow.repository;

import com.ssafy.be.domain.escrow.entity.Escrow;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, Long> {

    @Query("""
                select count(*) >0
                from Escrow e
                where e.id=:escrowId
                and e.seller.user.id=:userId
            """)
    boolean existsEscrowSeller(@Param("escrowId") Long escrowId, @Param("userId") Long userId);

    @Query("""
            select e from Escrow e
            join fetch e.auction a
            join fetch a.item
            where e.seller.user.id = :userId
            """)
    List<Escrow> findAllBySellerUserId(@Param("userId") Long userId);
}

