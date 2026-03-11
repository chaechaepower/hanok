package com.ssafy.be.domain.item.entity;

import com.ssafy.be.domain.seller.entity.Seller;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Optional;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Entity
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    private Category category;

    private Long startPrice;

    private Long bidUnit;

    private Integer auctionDuration;

    @Enumerated(EnumType.STRING)
    private ItemStatus status;

    @Enumerated(EnumType.STRING)
    private ItemCondition itemCondition;

    private String image1;

    private String image2;

    private String image3;

    private String courierName;

    private String trackingNumber;

    private LocalDateTime submittedAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @Builder
    private Item(String name,
                 String description,
                 Category category,
                 Long startPrice,
                 Long bidUnit,
                 Integer auctionDuration,
                 ItemStatus status,
                 ItemCondition itemCondition,
                 String image1,
                 String image2,
                 String image3,
                 String courierName,
                 String trackingNumber,
                 LocalDateTime submittedAt,
                 LocalDateTime createdAt,
                 Seller seller) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.startPrice = startPrice;
        this.bidUnit = bidUnit;
        this.auctionDuration = auctionDuration;
        this.status = status;
        this.itemCondition = itemCondition;
        this.image1 = image1;
        this.image2 = image2;
        this.image3 = image3;
        this.courierName = courierName;
        this.trackingNumber = trackingNumber;
        this.submittedAt = submittedAt;
        this.createdAt = createdAt;
        this.seller = seller;
    }

    public void updateImages(String image1, String image2, String image3) {
        if (image1 != null) this.image1 = image1;
        if (image2 != null) this.image2 = image2;
        if (image3 != null) this.image3 = image3;
    }

    public void update(String name, String description, Category category,
                       Long startPrice, Long bidUnit, Integer auctionDuration,
                       ItemCondition itemCondition) {
        Optional.ofNullable(name).ifPresent(v -> this.name = v);
        Optional.ofNullable(description).ifPresent(v -> this.description = v);
        Optional.ofNullable(category).ifPresent(v -> this.category = v);
        Optional.ofNullable(startPrice).ifPresent(v -> this.startPrice = v);
        Optional.ofNullable(bidUnit).ifPresent(v -> this.bidUnit = v);
        Optional.ofNullable(auctionDuration).ifPresent(v -> this.auctionDuration = v);
        Optional.ofNullable(itemCondition).ifPresent(v -> this.itemCondition = v);
    }

}
