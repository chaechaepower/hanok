package com.ssafy.be.domain.seller.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "seller")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SellerGrade grade;

    @Column(name = "insta_url", length = 100)
    private String instaUrl;

    @Column(name = "youtube_url", length = 100)
    private String youtubeUrl;

    @Column(name = "tiktok_url", length = 100)
    private String tiktokUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public static Seller createSeller(String intro, SellerType type, String businessNumber,
                                      String instaUrl, String youtubeUrl, String tiktokUrl,
                                      Long userId) {
        return Seller.builder()
                .intro(intro != null ? intro : "")
                .type(type)
                .businessNumber(businessNumber)
                .grade(SellerGrade.GENERAL)
                .instaUrl(instaUrl)
                .youtubeUrl(youtubeUrl)
                .tiktokUrl(tiktokUrl)
                .rating(0.0)
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}