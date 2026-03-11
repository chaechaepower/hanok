package com.ssafy.be.domain.shippingaddress.entity;

import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    private boolean isDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    private ShippingAddress(String addressName,
                           Integer postalCode,
                           String address,
                           String addressDetail,
                           String phone,
                           String recipientName,
                           boolean isDefault,
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
}
