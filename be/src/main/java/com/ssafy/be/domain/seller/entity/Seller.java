package com.ssafy.be.domain.seller.entity;

import com.ssafy.be.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

import static com.ssafy.be.domain.tradereport.entity.TradeType.SETTLEMENT;

@Entity
@Table(name = "seller")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String intro;

    @Column(nullable = false)
    private Integer penaltyCount;

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

    @Column(name = "avg_ship_days")
    private Double avgShipDays;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder(toBuilder = true)
    private Seller(String intro,
                   Integer penaltyCount,
                   SellerType type,
                   String businessNumber,
                   String instaUrl,
                   String youtubeUrl,
                   String tiktokUrl,
                   Double avgShipDays,
                   User user) {
        this.intro = intro;
        this.penaltyCount = penaltyCount;
        this.type = type;
        this.businessNumber = businessNumber;
        this.instaUrl = instaUrl;
        this.youtubeUrl = youtubeUrl;
        this.tiktokUrl = tiktokUrl;
        this.avgShipDays = avgShipDays;
        this.user = user;
    }

    public void updateProfile(String intro, String instaUrl, String youtubeUrl, String tiktokUrl) {
        if (intro != null) this.intro = intro;
        if (instaUrl != null) this.instaUrl = instaUrl;
        if (youtubeUrl != null) this.youtubeUrl = youtubeUrl;
        if (tiktokUrl != null) this.tiktokUrl = tiktokUrl;
    }

    public void increasePenaltyCount() {
        this.penaltyCount++;
    }

    // 판매자 평점 계산
    public double getRating() {
        // 판매자로서 정상 완료한 거래 수 (amount > 0인 정산만)
        int totalCompletedEscrows = (int) getUser().getTradeReports().stream()
                .filter(tradeReport -> tradeReport.getTradeType() == SETTLEMENT)
                .filter(tradeReport -> tradeReport.getAmount() > 0)  // 판매자는 양수
                .count();
        
        int totalTrades = totalCompletedEscrows + this.penaltyCount;

        if (totalTrades == 0) {
            return 5.0;  // 거래 없으면 기본 5.0
        }

        // 성공률 기반 점수 (0.0 ~ 5.0)
        double successRate = (double) totalCompletedEscrows / totalTrades;
        double rating = successRate * 5.0;
        
        // 소수점 둘째자리까지 반올림
        return Math.round(rating * 100.0) / 100.0;
    }

    public void updateAvgShipDays(long newShipDays) {
        if (this.avgShipDays == null) {
            this.avgShipDays = (double) newShipDays;
        } else {
            // 누적 평균 계산 (기존 평균과 새 값의 단순 평균)
            this.avgShipDays = (this.avgShipDays + newShipDays) / 2.0;
        }
    }
}