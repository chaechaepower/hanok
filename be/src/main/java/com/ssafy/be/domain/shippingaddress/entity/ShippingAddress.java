package com.ssafy.be.domain.shippingaddress.entity;

import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Optional;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class ShippingAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String addressName;

    private Integer postalCode;

    private String address;

    private String addressDetail;

    private String phone;

    private String recipientName;

    @Column(name = "is_default")
    private boolean isDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder(toBuilder = true)
    private ShippingAddress(String addressName,
                           Integer postalCode,
                           String address,
                           String addressDetail,
                           String phone,
                           String recipientName,
                            Boolean  isDefault,
                           User user) {
        this.addressName = addressName;
        this.postalCode = postalCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.phone = phone;
        this.recipientName = recipientName;
        this.isDefault = isDefault;
        this.user = user;
    }

    public void update(String addressName, Integer postalCode, String address,
                       String addressDetail, String phone, String recipientName, Boolean isDefault) {
        Optional.ofNullable(addressName).ifPresent(v -> this.addressName = v);
        Optional.ofNullable(postalCode).ifPresent(v -> this.postalCode = v);
        Optional.ofNullable(address).ifPresent(v -> this.address = v);
        Optional.ofNullable(addressDetail).ifPresent(v -> this.addressDetail = v);
        Optional.ofNullable(phone).ifPresent(v -> this.phone = v);
        Optional.ofNullable(recipientName).ifPresent(v -> this.recipientName = v);
        Optional.ofNullable(isDefault).ifPresent(v -> this.isDefault = v);
    }

    // 기본 배송지 해제
    public void unsetDefault() {
        this.isDefault = false;
    }
}
