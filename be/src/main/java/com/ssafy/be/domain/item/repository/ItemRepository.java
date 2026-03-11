package com.ssafy.be.domain.item.repository;

import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findBySellerId(Long sellerId);
    List<Item> findBySellerIdAndStatus(Long sellerId, ItemStatus status);
    Optional<Item> findByIdAndSellerId(Long id, Long sellerId);
}
