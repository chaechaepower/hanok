package com.ssafy.be.domain.item.entity;

import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

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

    private Integer bidUnit;

    private Integer auctionDuration;

    @Enumerated(EnumType.STRING)
    private ItemStatus status;

    @Enumerated(EnumType.STRING)
    private Condition itemCondition;

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
                Integer bidUnit,
                Integer auctionDuration,
                ItemStatus status,
                Condition condition,
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
        this.itemCondition = condition;
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

    public void update(ItemUpdateRequest request) {
        if (request.name() != null) this.name = request.name();
        if (request.description() != null) this.description = request.description();
        if (request.category() != null) this.category = request.category();
        if (request.startPrice() != null) this.startPrice = request.startPrice();
        if (request.bidUnit() != null) this.bidUnit = request.bidUnit();
        if (request.auctionDuration() != null) this.auctionDuration = request.auctionDuration();
        if (request.itemCondition() != null) this.itemCondition = request.itemCondition();
    }
}
