package com.ssafy.be.domain.seller.entity;

import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "seller")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String intro;

    @Column(nullable = false)
    private Double rating;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SellerType type;

    @Column(name = "business_number", length = 50)
    private String businessNumber;

    @Column(name = "insta_url", length = 100)
    private String instaUrl;

    @Column(name = "youtube_url", length = 100)
    private String youtubeUrl;

    @Column(name = "tiktok_url", length = 100)
    private String tiktokUrl;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",  nullable = false)
    private User user;

    @Builder
    private Seller(String intro,
                   Double rating,
                   SellerType type,
                   String businessNumber,
                   String instaUrl,
                   String youtubeUrl,
                   String tiktokUrl,
                   LocalDateTime createdAt,
                   LocalDateTime updatedAt,
                   User user) {
        this.intro = intro;
        this.rating = rating;
        this.type = type;
        this.businessNumber = businessNumber;
        this.instaUrl = instaUrl;
        this.youtubeUrl = youtubeUrl;
        this.tiktokUrl = tiktokUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.user = user;
    }
}