package com.ssafy.be.domain.stream.entity;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.seller.entity.Seller;
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
public class Stream {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private Category category;

    private boolean isLive;

    private String thumbnail;

    private LocalDateTime scheduledAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @Builder
    private Stream(String title,
                  Category category,
                  boolean isLive,
                  String thumbnail,
                  LocalDateTime scheduledAt,
                  LocalDateTime createdAt,
                  Seller seller) {
        this.title = title;
        this.category = category;
        this.isLive = isLive;
        this.thumbnail = thumbnail;
        this.scheduledAt = scheduledAt;
        this.createdAt = createdAt;
        this.seller = seller;
    }
}
