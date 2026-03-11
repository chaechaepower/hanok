package com.ssafy.be.domain.shippingaddress.repository;

import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShippingAddressRepository extends JpaRepository<ShippingAddress, Long> {
    Optional<ShippingAddress> findByUserIdAndIsDefaultTrue(Long userId);
}
